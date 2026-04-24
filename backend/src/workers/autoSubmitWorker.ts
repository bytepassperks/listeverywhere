import { pool } from '../db/pool';

/**
 * Auto-Submit Worker
 * Runs every 6 hours alongside the discovery worker.
 * 
 * For each active project, finds any new endpoints that haven't been submitted yet
 * and queues them for submission. Processes submissions with randomized delays.
 * 
 * NO LIMITS — processes all pending endpoints continuously.
 */

interface PendingSubmission {
  endpoint_id: string;
  endpoint_name: string;
  url_template: string;
  category: string;
  project_id: string;
  domain: string;
}

async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<{ ok: boolean; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    return { ok: response.ok, status: response.status };
  } catch {
    clearTimeout(timeout);
    return { ok: false, status: 0 };
  }
}

export async function runAutoSubmit(batchSize = 50): Promise<{
  projectsProcessed: number;
  totalSubmitted: number;
  totalFailed: number;
  newEndpointsQueued: number;
}> {
  console.log('[AutoSubmit] Starting auto-submit run...');

  // Get all active projects
  const { rows: projects } = await pool.query(
    "SELECT id, domain FROM indexer_projects WHERE status = 'active'"
  );

  let totalSubmitted = 0;
  let totalFailed = 0;
  let newEndpointsQueued = 0;

  for (const project of projects) {
    // Fast approach: get already-tried endpoint IDs first, then exclude them
    const { rows: triedRows } = await pool.query(
      'SELECT DISTINCT endpoint_id FROM backlink_results WHERE project_id = $1',
      [project.id]
    );
    const triedIds = triedRows.map((r: { endpoint_id: string }) => r.endpoint_id);

    let newEndpoints;
    if (triedIds.length > 0) {
      const { rows } = await pool.query(
        `SELECT id as endpoint_id, name as endpoint_name, url_template, category
         FROM backlink_endpoints
         WHERE active = true AND domain_authority IS NOT NULL AND id != ALL($1)
         ORDER BY RANDOM()
         LIMIT $2`,
        [triedIds, batchSize]
      );
      newEndpoints = rows;
    } else {
      const { rows } = await pool.query(
        `SELECT id as endpoint_id, name as endpoint_name, url_template, category
         FROM backlink_endpoints
         WHERE active = true AND domain_authority IS NOT NULL
         ORDER BY RANDOM()
         LIMIT $1`,
        [batchSize]
      );
      newEndpoints = rows;
    }

    if (newEndpoints.length === 0) continue;

    newEndpointsQueued += newEndpoints.length;
    console.log(`[AutoSubmit] Project ${project.domain}: ${newEndpoints.length} new endpoints to submit`);

    const domain = project.domain;
    const url = `https://${domain}`;

    for (const ep of newEndpoints) {
      // Randomized delay between 2-10 seconds for auto-submit (faster than drip-feed since this is background)
      const delay = 2000 + Math.random() * 8000;
      await new Promise(resolve => setTimeout(resolve, delay));

      try {
        const targetUrl = ep.url_template
          .replace(/{DOMAIN}/g, domain)
          .replace(/{URL}/g, encodeURIComponent(url));

        const result = await fetchWithTimeout(targetUrl);
        const success = result.status >= 200 && result.status < 400;

        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [project.id, ep.endpoint_id, ep.endpoint_name, ep.category, url, targetUrl,
           success ? 'submitted' : 'failed', result.status]
        );

        if (success) totalSubmitted++;
        else totalFailed++;
      } catch (err) {
        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'failed', 0)
           ON CONFLICT DO NOTHING`,
          [project.id, ep.endpoint_id, ep.endpoint_name, ep.category, url, '']
        );
        totalFailed++;
      }
    }

    // Log activity
    await pool.query(
      `INSERT INTO indexer_activity_log (project_id, action, details)
       VALUES ($1, 'auto_submit', $2)`,
      [project.id, JSON.stringify({
        endpoints_submitted: newEndpoints.length,
        succeeded: totalSubmitted,
        failed: totalFailed,
      })]
    );
  }

  // Log overall stats
  console.log(`[AutoSubmit] Complete: ${projects.length} projects, ${totalSubmitted} submitted, ${totalFailed} failed, ${newEndpointsQueued} queued`);

  return {
    projectsProcessed: projects.length,
    totalSubmitted,
    totalFailed,
    newEndpointsQueued,
  };
}

/**
 * Run the full 6-hour cycle: discover new endpoints then auto-submit to all projects
 */
export async function runFullCycle(): Promise<void> {
  const { runDiscovery } = await import('./endpointDiscoveryWorker');

  console.log('[Worker] Starting 6-hour cycle...');

  // Phase 1: Discover new endpoints
  const discoveryResult = await runDiscovery();
  console.log(`[Worker] Discovery: ${discoveryResult.added} new endpoints added`);

  // Phase 2: Auto-submit to all projects
  const submitResult = await runAutoSubmit();
  console.log(`[Worker] Auto-submit: ${submitResult.totalSubmitted} submitted across ${submitResult.projectsProcessed} projects`);

  // Log cycle completion
  await pool.query(
    `INSERT INTO indexer_worker_log (worker_type, details)
     VALUES ('six_hour_cycle', $1)`,
    [JSON.stringify({ discovery: discoveryResult, submit: submitResult })]
  );
}
