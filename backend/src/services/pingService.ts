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
  try {
    // Use site: operator to check if URL is indexed
    const query = `site:${url}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return 'unknown';

    const html = await response.text();

    // If Google returns "did not match any documents" or similar, it's not indexed
    if (html.includes('did not match any documents') || html.includes('did not return any results')) {
      return 'not_indexed';
    }

    // If the URL appears in results, it's indexed
    if (html.includes(url) || html.includes(url.replace('https://', '').replace('http://', ''))) {
      return 'indexed';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
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
