import { pool } from '../db/pool';
import { getAllEndpoints } from './endpointDatabase';
import { generateMassEndpoints } from './massEndpointGenerator';

export async function seedBacklinkEndpoints(): Promise<number> {
  // Get all real verified endpoints from v2 generator
  let endpoints: Array<{ name: string; url_template: string; category: string; tier?: number; indexable?: boolean; da?: number }>;
  try {
    endpoints = generateMassEndpoints();
    console.log(`[Seed v2] Loaded ${endpoints.length} endpoints (${endpoints.filter(e => e.indexable).length} indexable)`);
  } catch (err) {
    console.error('[Seed] Endpoint generator failed, falling back to legacy:', err);
    endpoints = getAllEndpoints();
  }

  // First, deactivate old search-query endpoints that are no longer in v2
  const v2Templates = new Set(endpoints.map(e => e.url_template));

  const currentCount = await pool.query('SELECT COUNT(*) as count FROM backlink_endpoints');
  const existing = parseInt(currentCount.rows[0].count);
  console.log(`[Seed v2] Current endpoint count: ${existing}`);

  let seeded = 0;

  for (const ep of endpoints) {
    try {
      const result = await pool.query(
        `INSERT INTO backlink_endpoints (name, url_template, category, active, tier, indexable, endpoint_da)
         VALUES ($1, $2, $3, true, $4, $5, $6)
         ON CONFLICT (url_template) DO UPDATE SET 
           tier = EXCLUDED.tier, name = EXCLUDED.name, category = EXCLUDED.category,
           indexable = EXCLUDED.indexable, endpoint_da = EXCLUDED.endpoint_da, active = true
         RETURNING id`,
        [ep.name, ep.url_template, ep.category, ep.tier || 4, ep.indexable !== false, ep.da || null]
      );
      if (result.rowCount && result.rowCount > 0) seeded++;
    } catch {
      // skip individual failures
    }
  }

  // Deactivate old non-indexable endpoints that were removed in v2
  // (search queries, Wikipedia/Reddit/Medium searches, etc.)
  try {
    const deactivated = await pool.query(
      `UPDATE backlink_endpoints SET active = false, indexable = false 
       WHERE url_template NOT IN (SELECT unnest($1::text[]))
       AND active = true`,
      [endpoints.map(e => e.url_template)]
    );
    console.log(`[Seed v2] Deactivated ${deactivated.rowCount} old non-indexable endpoints`);
  } catch (err) {
    console.error('[Seed v2] Failed to deactivate old endpoints:', err);
  }

  const finalCount = await pool.query('SELECT COUNT(*) as count FROM backlink_endpoints WHERE active = true');
  const indexableCount = await pool.query('SELECT COUNT(*) as count FROM backlink_endpoints WHERE active = true AND indexable = true');
  console.log(`[Seed v2] Done. ${seeded} endpoints upserted. Active: ${parseInt(finalCount.rows[0].count)}, Indexable: ${parseInt(indexableCount.rows[0].count)}`);

  return seeded;
}

export async function buildBacklinks(
  projectId: string,
  targetUrl: string,
  domain: string,
  categories?: string[],
  maxEndpoints: number = 50
): Promise<{ submitted: number; indexableSubmitted: number; errors: string[]; totalAvailable: number }> {
  // Auto-disable endpoints that have failed 3+ times across all projects
  await pool.query(
    `UPDATE backlink_endpoints SET active = false
     WHERE id IN (
       SELECT endpoint_id FROM backlink_results
       WHERE status = 'error' AND http_status IN (403, 404, 500, 521, 0)
       GROUP BY endpoint_id
       HAVING COUNT(*) >= 3
     ) AND active = true`
  );

  // Get already-tried endpoint IDs for this project
  const alreadyTriedResult = await pool.query(
    'SELECT DISTINCT endpoint_id FROM backlink_results WHERE project_id = $1',
    [projectId]
  );
  const alreadyTriedIds = alreadyTriedResult.rows.map((r: { endpoint_id: string }) => r.endpoint_id);

  // Also exclude endpoints that failed for ANY project (403/404/500/521/0 are permanent failures)
  const globalFailedResult = await pool.query(
    `SELECT DISTINCT endpoint_id FROM backlink_results
     WHERE status = 'error' AND http_status IN (403, 404, 500, 521, 0)`
  );
  const globalFailedIds = globalFailedResult.rows.map((r: { endpoint_id: string }) => r.endpoint_id);
  const excludeIds = [...new Set([...alreadyTriedIds, ...globalFailedIds])];

  let query: string;
  const params: (string | string[] | number)[] = [];

  if (excludeIds.length > 0) {
    params.push(excludeIds);
    query = `SELECT id, name, url_template, category, COALESCE(indexable, true) as indexable, endpoint_da FROM backlink_endpoints 
      WHERE active = true AND id != ALL($1)`;
    if (categories && categories.length > 0) {
      params.push(categories);
      query += ` AND category = ANY($${params.length})`;
    }
  } else {
    query = `SELECT id, name, url_template, category, COALESCE(indexable, true) as indexable, endpoint_da FROM backlink_endpoints 
      WHERE active = true`;
    if (categories && categories.length > 0) {
      params.push(categories);
      query += ` AND category = ANY($${params.length})`;
    }
  }

  // Prioritize indexable endpoints first, then by tier, then by DA
  params.push(maxEndpoints);
  query += ` ORDER BY COALESCE(indexable, true) DESC, COALESCE(tier, 4) ASC, COALESCE(endpoint_da, COALESCE(domain_authority, 0)) DESC LIMIT $${params.length}`;

  const result = await pool.query(query, params);
  const endpoints = result.rows;

  const totalCountResult = await pool.query('SELECT COUNT(*) FROM backlink_endpoints WHERE active = true');
  const totalAvailable = parseInt(totalCountResult.rows[0].count) - alreadyTriedIds.length;

  let submitted = 0;
  let indexableSubmitted = 0;
  const errors: string[] = [];
  const batchSize = 10;

  for (let i = 0; i < endpoints.length; i += batchSize) {
    const batch = endpoints.slice(i, i + batchSize);

    const promises = batch.map(async (ep: { id: string; name: string; url_template: string; category: string; indexable: boolean; endpoint_da: number | null }) => {
      const resolvedUrl = ep.url_template
        .replace(/{URL}/g, encodeURIComponent(targetUrl))
        .replace(/{DOMAIN}/g, domain);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(resolvedUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);

        const isSuccess = response.ok || response.status === 301 || response.status === 302 || response.status === 403;

        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status, indexable)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`,
          [projectId, ep.id, ep.name, ep.category, targetUrl, resolvedUrl,
           isSuccess ? 'submitted' : 'error', response.status, ep.indexable]
        );

        if (isSuccess) {
          submitted++;
          if (ep.indexable) indexableSubmitted++;
        } else {
          errors.push(`${ep.name}: HTTP ${response.status}`);
        }
      } catch (err) {
        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status, indexable)
           VALUES ($1, $2, $3, $4, $5, $6, 'error', 0, $7)
           ON CONFLICT DO NOTHING`,
          [projectId, ep.id, ep.name, ep.category, targetUrl, resolvedUrl, ep.indexable]
        );
        errors.push(`${ep.name}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    });

    await Promise.all(promises);
  }

  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'backlink_build', $2)`,
    [projectId, JSON.stringify({ target_url: targetUrl, total_endpoints: endpoints.length, submitted, indexableSubmitted, errors_count: errors.length })]
  );

  return { submitted, indexableSubmitted, errors: errors.slice(0, 20), totalAvailable: totalAvailable - endpoints.length };
}

export async function getBacklinkStats(projectId: string): Promise<{
  total: number;
  submitted: number;
  verified: number;
  dead: number;
  errors: number;
  indexable: number;
  googleIndexed: number;
  byCategory: Record<string, number>;
}> {
  const statsResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status != 'error') as total,
       COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
       COUNT(*) FILTER (WHERE status = 'verified') as verified,
       COUNT(*) FILTER (WHERE status = 'dead') as dead,
       COUNT(*) FILTER (WHERE status = 'error') as errors,
       COUNT(*) FILTER (WHERE indexable = true AND status != 'error') as indexable,
       COUNT(*) FILTER (WHERE google_indexed = true) as google_indexed
     FROM backlink_results
     WHERE project_id = $1`,
    [projectId]
  );

  const byCategoryResult = await pool.query(
    `SELECT COALESCE(endpoint_category, 'unknown') as category, COUNT(*) as count
     FROM backlink_results
     WHERE project_id = $1 AND status IN ('submitted', 'verified')
     GROUP BY endpoint_category`,
    [projectId]
  );

  const byCategory: Record<string, number> = {};
  for (const row of byCategoryResult.rows) {
    byCategory[row.category] = parseInt(row.count);
  }

  const stats = statsResult.rows[0];
  return {
    total: parseInt(stats.total),
    submitted: parseInt(stats.submitted),
    verified: parseInt(stats.verified),
    dead: parseInt(stats.dead),
    errors: parseInt(stats.errors),
    indexable: parseInt(stats.indexable),
    googleIndexed: parseInt(stats.google_indexed),
    byCategory,
  };
}
