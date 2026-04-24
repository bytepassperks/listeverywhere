import { pool } from '../db/pool';
import crypto from 'crypto';

export function generateIndexNowKey(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function submitToIndexNow(urls: string[], domain: string, indexNowKey: string): Promise<{ submitted: number; errors: string[] }> {
  const errors: string[] = [];
  let submitted = 0;

  // IndexNow supports batch submission to Bing
  const engines = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];

  for (const engine of engines) {
    try {
      const host = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

      if (urls.length === 1) {
        // Single URL submission
        const params = new URLSearchParams({
          url: urls[0],
          key: indexNowKey,
        });
        const response = await fetch(`${engine}?${params.toString()}`, {
          method: 'GET',
          headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          submitted++;
        } else {
          errors.push(`${engine}: HTTP ${response.status}`);
        }
      } else {
        // Batch submission (up to 10,000 URLs)
        const response = await fetch(engine, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'User-Agent': 'ListGenius-Indexer/1.0',
          },
          body: JSON.stringify({
            host,
            key: indexNowKey,
            keyLocation: `https://${host}/${indexNowKey}.txt`,
            urlList: urls.slice(0, 10000),
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          submitted += urls.length;
        } else {
          errors.push(`${engine}: HTTP ${response.status}`);
        }
      }
    } catch (err) {
      errors.push(`${engine}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { submitted, errors };
}

export async function submitUrlsViaIndexNow(projectId: string, urlIds: string[]): Promise<{ submitted: number; errors: string[] }> {
  const project = await pool.query(
    'SELECT domain, indexnow_key FROM indexer_projects WHERE id = $1',
    [projectId]
  );

  if (project.rows.length === 0) {
    return { submitted: 0, errors: ['Project not found'] };
  }

  const { domain, indexnow_key } = project.rows[0];
  if (!indexnow_key) {
    return { submitted: 0, errors: ['IndexNow key not configured'] };
  }

  const urlResult = await pool.query(
    'SELECT id, url FROM indexer_urls WHERE id = ANY($1) AND project_id = $2',
    [urlIds, projectId]
  );

  const urls = urlResult.rows.map((r: { url: string }) => r.url);
  if (urls.length === 0) {
    return { submitted: 0, errors: ['No URLs to submit'] };
  }

  const result = await submitToIndexNow(urls, domain, indexnow_key);

  // Update URL statuses
  if (result.submitted > 0) {
    await pool.query(
      `UPDATE indexer_urls SET index_status = 'submitted', last_submitted = NOW(), submit_count = submit_count + 1, updated_at = NOW()
       WHERE id = ANY($1)`,
      [urlIds]
    );

    // Log activity
    await pool.query(
      `INSERT INTO indexer_activity_log (project_id, action, details)
       VALUES ($1, 'indexnow_submit', $2)`,
      [projectId, JSON.stringify({ count: urls.length, engines_reached: result.submitted })]
    );
  }

  return result;
}

/**
 * Submit backlink URLs (the pages on third-party sites that link to our domain) to IndexNow.
 * This helps search engines discover and index the backlink pages faster,
 * making the backlinks count for SEO sooner.
 */
export async function submitBacklinkUrlsToIndexNow(
  projectId: string,
  limit = 500
): Promise<{ submitted: number; total: number; alreadySubmitted: number; errors: string[] }> {
  const project = await pool.query(
    'SELECT domain, indexnow_key FROM indexer_projects WHERE id = $1',
    [projectId]
  );

  if (project.rows.length === 0) {
    return { submitted: 0, total: 0, alreadySubmitted: 0, errors: ['Project not found'] };
  }

  const { domain, indexnow_key } = project.rows[0];
  if (!indexnow_key) {
    return { submitted: 0, total: 0, alreadySubmitted: 0, errors: ['IndexNow key not configured'] };
  }

  // Get successful backlink URLs that haven't been submitted to IndexNow yet
  const backlinkResult = await pool.query(
    `SELECT id, backlink_url FROM backlink_results
     WHERE project_id = $1
       AND status IN ('submitted', 'verified')
       AND backlink_url IS NOT NULL
       AND COALESCE(indexnow_submitted, false) = false
     ORDER BY created_at DESC
     LIMIT $2`,
    [projectId, limit]
  );

  const alreadySubmittedResult = await pool.query(
    `SELECT COUNT(*) as count FROM backlink_results
     WHERE project_id = $1 AND indexnow_submitted = true`,
    [projectId]
  );

  const alreadySubmitted = parseInt(alreadySubmittedResult.rows[0].count);

  if (backlinkResult.rows.length === 0) {
    return { submitted: 0, total: 0, alreadySubmitted, errors: [] };
  }

  const backlinkUrls = backlinkResult.rows.map((r: { backlink_url: string }) => r.backlink_url);
  const backlinkIds = backlinkResult.rows.map((r: { id: string }) => r.id);

  // Submit backlink URLs to IndexNow engines
  // Note: IndexNow requires the URLs to be on the same host as the key.
  // Since backlink URLs are on third-party domains, we use individual GET submissions
  // which don't require host matching.
  const errors: string[] = [];
  let submitted = 0;

  const engines = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
  ];

  for (const backlinkUrl of backlinkUrls) {
    for (const engine of engines) {
      try {
        const params = new URLSearchParams({
          url: backlinkUrl,
          key: indexnow_key,
        });
        const response = await fetch(`${engine}?${params.toString()}`, {
          method: 'GET',
          headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          submitted++;
          break; // One successful engine is enough per URL
        }
      } catch {
        // Try next engine
      }
    }

    // Rate limit: avoid hammering IndexNow
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // Mark backlinks as submitted to IndexNow
  if (submitted > 0) {
    await pool.query(
      `UPDATE backlink_results SET indexnow_submitted = true, indexnow_submitted_at = NOW()
       WHERE id = ANY($1)`,
      [backlinkIds]
    );
  }

  // Log activity
  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'backlink_indexnow_submit', $2)`,
    [projectId, JSON.stringify({ backlink_urls_submitted: submitted, total_backlinks: backlinkUrls.length })]
  );

  return { submitted, total: backlinkUrls.length, alreadySubmitted, errors };
}

/**
 * Check if backlink URLs are indexed by Google (using the same multi-method approach).
 */
export async function checkBacklinkIndexStatus(
  projectId: string,
  limit = 30
): Promise<{ checked: number; indexed: number; notIndexed: number; unknown: number; results: Array<{ url: string; name: string; status: string }> }> {
  // Get backlink URLs to check
  const backlinkResult = await pool.query(
    `SELECT id, backlink_url, endpoint_name FROM backlink_results
     WHERE project_id = $1
       AND status IN ('submitted', 'verified')
       AND backlink_url IS NOT NULL
     ORDER BY COALESCE(index_checked_at, '1970-01-01') ASC
     LIMIT $2`,
    [projectId, limit]
  );

  let checked = 0;
  let indexed = 0;
  let notIndexed = 0;
  let unknown = 0;
  const results: Array<{ url: string; name: string; status: string }> = [];

  for (const row of backlinkResult.rows) {
    const url = row.backlink_url;
    let signals = 0;
    let checks = 0;

    // Method 1: Check Google's webcache
    try {
      const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
      const response = await fetch(cacheUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(6000),
        redirect: 'manual',
      });
      checks++;
      if (response.status === 200 || response.status === 301 || response.status === 302) {
        signals++;
      }
    } catch { /* ignore */ }

    // Method 2: Check Wayback Machine
    try {
      const waybackUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
      const response = await fetch(waybackUrl, {
        headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
        signal: AbortSignal.timeout(6000),
      });
      checks++;
      if (response.ok) {
        const data = await response.json() as { archived_snapshots?: { closest?: { available?: boolean } } };
        if (data?.archived_snapshots?.closest?.available) {
          signals++;
        }
      }
    } catch { /* ignore */ }

    // Method 3: Check if reachable by Googlebot
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
        signal: AbortSignal.timeout(6000),
        redirect: 'follow',
      });
      checks++;
      if (response.ok) {
        signals++;
      }
    } catch { /* ignore */ }

    let status: string;
    if (signals >= 2) {
      status = 'indexed';
      indexed++;
    } else if (checks >= 2 && signals === 0) {
      status = 'not_indexed';
      notIndexed++;
    } else {
      status = 'unknown';
      unknown++;
    }
    checked++;

    results.push({ url: row.backlink_url, name: row.endpoint_name, status });

    // Update the backlink record
    await pool.query(
      `UPDATE backlink_results SET index_status = $1, index_checked_at = NOW() WHERE id = $2`,
      [status, row.id]
    );

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Log activity
  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'backlink_index_check', $2)`,
    [projectId, JSON.stringify({ checked, indexed, notIndexed, unknown })]
  );

  return { checked, indexed, notIndexed, unknown, results };
}
