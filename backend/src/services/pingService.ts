import { pool } from '../db/pool';

const PING_SERVICES = [
  'https://www.google.com/ping?sitemap={SITEMAP_URL}',
  'https://www.bing.com/ping?sitemap={SITEMAP_URL}',
  'http://www.google.com/webmasters/tools/ping?sitemap={SITEMAP_URL}',
];

const URL_PING_ENDPOINTS = [
  'https://www.google.com/ping?sitemap={URL}',
  'http://blogsearch.google.com/ping/RPC2',
  'http://rpc.pingomatic.com/',
];

export async function pingSitemap(sitemapUrl: string): Promise<{ pinged: number; errors: string[] }> {
  let pinged = 0;
  const errors: string[] = [];

  for (const template of PING_SERVICES) {
    const url = template.replace('{SITEMAP_URL}', encodeURIComponent(sitemapUrl));
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        pinged++;
      } else {
        errors.push(`Ping ${url}: HTTP ${response.status}`);
      }
    } catch (err) {
      errors.push(`Ping ${url}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }

  return { pinged, errors };
}

export async function pingUrls(urls: string[]): Promise<{ pinged: number; errors: string[] }> {
  let pinged = 0;
  const errors: string[] = [];

  // Use Google's ping endpoint for each URL
  for (const url of urls.slice(0, 100)) {
    try {
      const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(url)}`;
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) pinged++;
    } catch {
      errors.push(`Failed to ping ${url}`);
    }
  }

  return { pinged, errors };
}

export async function checkIndexStatus(url: string): Promise<'indexed' | 'not_indexed' | 'unknown'> {
  // Multi-method index check: try Google cache, Bing cache, and Wayback Machine
  const cleanUrl = url.replace(/\/$/, '');
  let signals = 0;
  let checks = 0;

  // Method 1: Check Google's webcache
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(cleanUrl)}`;
    const response = await fetch(cacheUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'manual',
    });
    checks++;
    if (response.status === 200 || response.status === 301 || response.status === 302) {
      signals++;
    }
  } catch { /* ignore */ }

  // Method 2: Check Wayback Machine (indicates crawlability)
  try {
    const waybackUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(cleanUrl)}`;
    const response = await fetch(waybackUrl, {
      headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    checks++;
    if (response.ok) {
      const data = await response.json() as { archived_snapshots?: { closest?: { available?: boolean } } };
      if (data?.archived_snapshots?.closest?.available) {
        signals++;
      }
    }
  } catch { /* ignore */ }

  // Method 3: Check if the page itself is reachable (HTTP 200 = crawlable)
  try {
    const response = await fetch(cleanUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    checks++;
    if (response.ok) {
      signals++;
    }
  } catch { /* ignore */ }

  // If Google cache found OR (Wayback + reachable), mark as indexed
  if (signals >= 2) {
    return 'indexed';
  } else if (checks >= 2 && signals === 0) {
    return 'not_indexed';
  }
  return 'unknown';
}

export async function batchCheckIndexStatus(
  projectId: string,
  urlIds: string[]
): Promise<{ checked: number; indexed: number; notIndexed: number }> {
  let checked = 0;
  let indexed = 0;
  let notIndexed = 0;

  const urlResult = await pool.query(
    'SELECT id, url FROM indexer_urls WHERE id = ANY($1) AND project_id = $2',
    [urlIds, projectId]
  );

  for (const row of urlResult.rows) {
    const status = await checkIndexStatus(row.url);
    checked++;

    if (status === 'indexed') {
      indexed++;
      await pool.query(
        `UPDATE indexer_urls SET index_status = 'indexed', last_checked = NOW(), updated_at = NOW() WHERE id = $1`,
        [row.id]
      );
    } else if (status === 'not_indexed') {
      notIndexed++;
      await pool.query(
        `UPDATE indexer_urls SET index_status = 'not_indexed', last_checked = NOW(), updated_at = NOW() WHERE id = $1`,
        [row.id]
      );
    }

    // Rate limit: 1 check per second to avoid Google blocks
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Update project counts
  const countResult = await pool.query(
    `SELECT COUNT(*) as total,
            COUNT(*) FILTER (WHERE index_status = 'indexed') as indexed_count,
            COUNT(*) FILTER (WHERE index_status NOT IN ('indexed', 'unknown')) as not_indexed_count
     FROM indexer_urls WHERE project_id = $1`,
    [projectId]
  );

  const counts = countResult.rows[0];
  await pool.query(
    `UPDATE indexer_projects SET total_urls = $2, indexed_count = $3, not_indexed_count = $4, last_index_check = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [projectId, counts.total, counts.indexed_count, counts.not_indexed_count]
  );

  return { checked, indexed, notIndexed };
}
