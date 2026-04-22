import { pool } from '../db/pool';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function parseSitemap(sitemapUrl: string): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  const visited = new Set<string>();

  async function fetchAndParse(url: string): Promise<void> {
    if (visited.has(url)) return;
    visited.add(url);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return;

      const text = await response.text();

      // Check if it's a sitemap index (contains <sitemap> tags)
      const sitemapIndexMatches = text.match(/<sitemap>\s*<loc>([^<]+)<\/loc>/gi);
      if (sitemapIndexMatches) {
        const childUrls = sitemapIndexMatches.map(m => {
          const match = m.match(/<loc>([^<]+)<\/loc>/);
          return match ? match[1].trim() : '';
        }).filter(Boolean);

        // Recursively parse child sitemaps (limit to 50)
        for (const childUrl of childUrls.slice(0, 50)) {
          await fetchAndParse(childUrl);
        }
        return;
      }

      // Parse regular sitemap URLs
      const urlMatches = text.match(/<url>[\s\S]*?<\/url>/gi);
      if (urlMatches) {
        for (const urlBlock of urlMatches) {
          const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/);
          const lastmodMatch = urlBlock.match(/<lastmod>([^<]+)<\/lastmod>/);
          const changefreqMatch = urlBlock.match(/<changefreq>([^<]+)<\/changefreq>/);
          const priorityMatch = urlBlock.match(/<priority>([^<]+)<\/priority>/);

          if (locMatch) {
            urls.push({
              loc: locMatch[1].trim(),
              lastmod: lastmodMatch?.[1]?.trim(),
              changefreq: changefreqMatch?.[1]?.trim(),
              priority: priorityMatch?.[1]?.trim(),
            });
          }
        }
      }
    } catch {
      // Silently skip failed sitemaps
    }
  }

  await fetchAndParse(sitemapUrl);
  return urls;
}

export async function discoverSitemapUrl(domain: string): Promise<string | null> {
  const candidates = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/sitemap/sitemap.xml`,
    `https://www.${domain}/sitemap.xml`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (response.ok) return url;
    } catch {
      continue;
    }
  }

  // Try robots.txt
  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) {
      const text = await response.text();
      const sitemapMatch = text.match(/Sitemap:\s*(.+)/i);
      if (sitemapMatch) return sitemapMatch[1].trim();
    }
  } catch {
    // ignore
  }

  return null;
}

export async function syncSitemapToProject(projectId: string, sitemapUrl: string): Promise<{ added: number; total: number }> {
  const urls = await parseSitemap(sitemapUrl);
  let added = 0;

  for (const sitemapEntry of urls) {
    try {
      const result = await pool.query(
        `INSERT INTO indexer_urls (project_id, url, source)
         VALUES ($1, $2, 'sitemap')
         ON CONFLICT (project_id, url) DO NOTHING
         RETURNING id`,
        [projectId, sitemapEntry.loc]
      );
      if (result.rowCount && result.rowCount > 0) added++;
    } catch {
      // skip duplicates
    }
  }

  // Update project counts
  const countResult = await pool.query(
    `SELECT COUNT(*) as total,
            COUNT(*) FILTER (WHERE index_status = 'indexed') as indexed,
            COUNT(*) FILTER (WHERE index_status != 'indexed' AND index_status != 'unknown') as not_indexed
     FROM indexer_urls WHERE project_id = $1`,
    [projectId]
  );

  const counts = countResult.rows[0];
  await pool.query(
    `UPDATE indexer_projects SET
       total_urls = $2, indexed_count = $3, not_indexed_count = $4,
       last_sitemap_sync = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [projectId, counts.total, counts.indexed, counts.not_indexed]
  );

  return { added, total: urls.length };
}
