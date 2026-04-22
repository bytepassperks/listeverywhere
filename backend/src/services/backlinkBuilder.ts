import { pool } from '../db/pool';
import { getAllEndpoints } from './endpointDatabase';

export async function seedBacklinkEndpoints(): Promise<number> {
  const endpoints = getAllEndpoints();

  let seeded = 0;
  for (const ep of endpoints) {
    try {
      const result = await pool.query(
        `INSERT INTO backlink_endpoints (name, url_template, category, active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [ep.name, ep.url_template, ep.category]
      );
      if (result.rowCount && result.rowCount > 0) seeded++;
    } catch {
      // skip duplicates
    }
  }

  return seeded;
}

export async function buildBacklinks(
  projectId: string,
  targetUrl: string,
  domain: string,
  categories?: string[]
): Promise<{ submitted: number; errors: string[] }> {
  let query = 'SELECT id, name, url_template, category FROM backlink_endpoints WHERE active = true';
  const params: (string | string[])[] = [];

  if (categories && categories.length > 0) {
    params.push(categories);
    query += ` AND category = ANY($${params.length})`;
  }

  const result = await pool.query(query, params);
  const endpoints = result.rows;

  let submitted = 0;
  const errors: string[] = [];
  const batchSize = 10;

  for (let i = 0; i < endpoints.length; i += batchSize) {
    const batch = endpoints.slice(i, i + batchSize);

    const promises = batch.map(async (ep: { id: string; name: string; url_template: string; category: string }) => {
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

        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [projectId, ep.id, ep.name, ep.category, targetUrl, resolvedUrl,
           response.ok ? 'submitted' : 'error', response.status]
        );

        if (response.ok || response.status === 301 || response.status === 302 || response.status === 403) {
          submitted++;
        } else {
          errors.push(`${ep.name}: HTTP ${response.status}`);
        }
      } catch (err) {
        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'error', 0)
           ON CONFLICT DO NOTHING`,
          [projectId, ep.id, ep.name, ep.category, targetUrl, resolvedUrl]
        );
        errors.push(`${ep.name}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    });

    await Promise.all(promises);
  }

  // Log activity
  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'backlink_build', $2)`,
    [projectId, JSON.stringify({ target_url: targetUrl, total_endpoints: endpoints.length, submitted, errors_count: errors.length })]
  );

  return { submitted, errors: errors.slice(0, 20) };
}

export async function getBacklinkStats(projectId: string): Promise<{
  total: number;
  submitted: number;
  verified: number;
  dead: number;
  byCategory: Record<string, number>;
}> {
  const statsResult = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
       COUNT(*) FILTER (WHERE status = 'verified') as verified,
       COUNT(*) FILTER (WHERE status = 'dead') as dead
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
    byCategory,
  };
}
