import { pool } from '../db/pool';
import { getAllEndpoints } from './endpointDatabase';
import { generateMassEndpoints } from './massEndpointGenerator';

export async function seedBacklinkEndpoints(): Promise<number> {
  // Generate mass endpoints programmatically (245K+)
  let endpoints: Array<{ name: string; url_template: string; category: string }>;
  try {
    endpoints = generateMassEndpoints();
    console.log(`[Seed] Generated ${endpoints.length.toLocaleString()} endpoints from mass generator`);
  } catch (err) {
    console.error('[Seed] Mass generator failed, falling back to hardcoded:', err);
    endpoints = getAllEndpoints();
  }

  // Check current count
  const currentCount = await pool.query('SELECT COUNT(*) as count FROM backlink_endpoints');
  const existing = parseInt(currentCount.rows[0].count);
  console.log(`[Seed] Current endpoint count: ${existing.toLocaleString()}`);

  // Batch insert for performance (1000 at a time)
  let seeded = 0;
  const batchSize = 1000;

  for (let i = 0; i < endpoints.length; i += batchSize) {
    const batch = endpoints.slice(i, i + batchSize);

    // Build multi-row INSERT
    const values: string[] = [];
    const params: string[] = [];
    let paramIndex = 1;

    for (const ep of batch) {
      values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, true)`);
      params.push(ep.name, ep.url_template, ep.category);
      paramIndex += 3;
    }

    try {
      const result = await pool.query(
        `INSERT INTO backlink_endpoints (name, url_template, category, active)
         VALUES ${values.join(', ')}
         ON CONFLICT (url_template) DO NOTHING`,
        params
      );
      seeded += result.rowCount || 0;
    } catch (err) {
      // If batch fails, try individual inserts for this batch
      for (const ep of batch) {
        try {
          const result = await pool.query(
            `INSERT INTO backlink_endpoints (name, url_template, category, active)
             VALUES ($1, $2, $3, true)
             ON CONFLICT (url_template) DO NOTHING
             RETURNING id`,
            [ep.name, ep.url_template, ep.category]
          );
          if (result.rowCount && result.rowCount > 0) seeded++;
        } catch {
          // skip
        }
      }
    }

    // Log progress every 50K
    if ((i + batchSize) % 50000 < batchSize) {
      console.log(`[Seed] Progress: ${Math.min(i + batchSize, endpoints.length).toLocaleString()}/${endpoints.length.toLocaleString()} processed, ${seeded.toLocaleString()} new`);
    }
  }

  const finalCount = await pool.query('SELECT COUNT(*) as count FROM backlink_endpoints');
  console.log(`[Seed] Done. ${seeded.toLocaleString()} new endpoints added. Total: ${parseInt(finalCount.rows[0].count).toLocaleString()}`);

  return seeded;
}

export async function buildBacklinks(
  projectId: string,
  targetUrl: string,
  domain: string,
  categories?: string[],
  maxEndpoints: number = 50
): Promise<{ submitted: number; errors: string[]; totalAvailable: number }> {
  // Fast query: pick endpoints with DA scores (real/verified) not yet tried for this project
  // Uses a subquery on IDs to avoid slow LEFT JOIN on 192K rows
  const alreadyTriedResult = await pool.query(
    'SELECT DISTINCT endpoint_id FROM backlink_results WHERE project_id = $1',
    [projectId]
  );
  const alreadyTriedIds = alreadyTriedResult.rows.map((r: { endpoint_id: string }) => r.endpoint_id);

  let query: string;
  const params: (string | string[] | number)[] = [];

  if (alreadyTriedIds.length > 0) {
    params.push(alreadyTriedIds);
    query = `SELECT id, name, url_template, category FROM backlink_endpoints 
      WHERE active = true AND domain_authority IS NOT NULL AND id != ALL($1)`;
    if (categories && categories.length > 0) {
      params.push(categories);
      query += ` AND category = ANY($${params.length})`;
    }
  } else {
    query = `SELECT id, name, url_template, category FROM backlink_endpoints 
      WHERE active = true AND domain_authority IS NOT NULL`;
    if (categories && categories.length > 0) {
      params.push(categories);
      query += ` AND category = ANY($${params.length})`;
    }
  }

  params.push(maxEndpoints);
  query += ` ORDER BY domain_authority DESC LIMIT $${params.length}`;

  const result = await pool.query(query, params);
  const endpoints = result.rows;

  const totalCountResult = await pool.query('SELECT COUNT(*) FROM backlink_endpoints WHERE active = true AND domain_authority IS NOT NULL');
  const totalAvailable = parseInt(totalCountResult.rows[0].count) - alreadyTriedIds.length;

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

  return { submitted, errors: errors.slice(0, 20), totalAvailable: totalAvailable - endpoints.length };
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
