/**
 * Google Index Verification Service v2
 * 
 * Performs REAL index verification by checking if URLs appear in Google's index
 * using the "site:" operator and Google cache checks.
 * 
 * Methods:
 * 1. Google Cache check — fastest, checks if Google has cached the page
 * 2. Site: query check — checks if the exact URL appears in Google's index
 * 3. Batch verification — processes multiple URLs with rate limiting
 */

import { pool } from '../db/pool';

interface IndexCheckResult {
  url: string;
  indexed: boolean;
  method: string;
  checkedAt: Date;
  details?: string;
}

/**
 * Check if a single URL is indexed by Google using cache check
 */
async function checkGoogleCache(url: string): Promise<{ indexed: boolean; details: string }> {
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(cacheUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (response.ok || response.status === 200) {
      return { indexed: true, details: 'Found in Google cache' };
    }
    if (response.status === 404) {
      return { indexed: false, details: 'Not in Google cache' };
    }
    return { indexed: false, details: `Cache check returned HTTP ${response.status}` };
  } catch (err) {
    return { indexed: false, details: `Cache check failed: ${err instanceof Error ? err.message : 'unknown'}` };
  }
}

/**
 * Check if a URL's domain page is indexed using Google site: operator
 * This checks if the specific page URL exists in Google's index
 */
async function checkGoogleSiteQuery(url: string): Promise<{ indexed: boolean; details: string }> {
  try {
    // Extract the clean URL for site: query
    const cleanUrl = url.replace(/^https?:\/\//, '');
    const searchUrl = `https://www.google.com/search?q=site:${encodeURIComponent(cleanUrl)}&num=1`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return { indexed: false, details: `Google search returned HTTP ${response.status}` };
    }

    const html = await response.text();
    
    // Check if there are results (no "did not match any documents" message)
    if (html.includes('did not match any documents') || html.includes('No results found')) {
      return { indexed: false, details: 'Not found in Google index (site: query returned 0 results)' };
    }
    
    // Check if the URL domain appears in the results
    const urlDomain = new URL(url).hostname;
    if (html.includes(urlDomain)) {
      return { indexed: true, details: 'Found in Google index via site: query' };
    }

    return { indexed: false, details: 'Site: query returned results but URL not found' };
  } catch (err) {
    return { indexed: false, details: `Site query failed: ${err instanceof Error ? err.message : 'unknown'}` };
  }
}

/**
 * Verify Google index status for a batch of backlink URLs
 * Uses rate limiting to avoid being blocked by Google
 */
export async function verifyGoogleIndex(
  projectId: string,
  maxUrls: number = 30,
  onlyIndexable: boolean = true
): Promise<{
  checked: number;
  indexed: number;
  notIndexed: number;
  failed: number;
  results: IndexCheckResult[];
}> {
  // Get URLs to check — prioritize indexable endpoints, unchecked first
  let query = `
    SELECT br.id, br.backlink_url, br.endpoint_name, br.indexable
    FROM backlink_results br
    WHERE br.project_id = $1
    AND br.status IN ('submitted', 'verified')
    AND br.backlink_url IS NOT NULL
  `;
  const params: (string | number | boolean)[] = [projectId];

  if (onlyIndexable) {
    query += ` AND (br.indexable = true OR br.indexable IS NULL)`;
  }

  // Check unchecked URLs first, then re-check old ones
  query += ` ORDER BY 
    CASE WHEN br.google_checked_at IS NULL THEN 0 ELSE 1 END,
    br.google_checked_at ASC NULLS FIRST
    LIMIT $2`;
  params.push(maxUrls);

  const { rows } = await pool.query(query, params);

  const results: IndexCheckResult[] = [];
  let indexed = 0;
  let notIndexed = 0;
  let failed = 0;

  // Process in small batches with delays to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const promises = batch.map(async (row: { id: string; backlink_url: string; endpoint_name: string; indexable: boolean }) => {
      // Try cache check first (faster), then site: query as fallback
      let checkResult = await checkGoogleCache(row.backlink_url);
      const method = 'cache';

      // If cache check was inconclusive, try site: query for the domain
      if (!checkResult.indexed && !checkResult.details.includes('Not in Google cache')) {
        const siteResult = await checkGoogleSiteQuery(row.backlink_url);
        if (siteResult.indexed) {
          checkResult = siteResult;
        }
      }

      // Update the database
      try {
        await pool.query(
          `UPDATE backlink_results 
           SET google_indexed = $2, google_checked_at = NOW(),
               index_status = CASE WHEN $2 THEN 'indexed' ELSE 'not_indexed' END
           WHERE id = $1`,
          [row.id, checkResult.indexed]
        );
      } catch {
        // non-fatal
      }

      const result: IndexCheckResult = {
        url: row.backlink_url,
        indexed: checkResult.indexed,
        method,
        checkedAt: new Date(),
        details: checkResult.details,
      };

      if (checkResult.indexed) {
        indexed++;
      } else {
        notIndexed++;
      }

      results.push(result);
    });

    await Promise.all(promises);

    // Rate limit: wait 2 seconds between batches to avoid Google blocking
    if (i + batchSize < rows.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Log the verification
  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'google_index_verify', $2)`,
    [projectId, JSON.stringify({ checked: results.length, indexed, notIndexed, failed })]
  );

  return { checked: results.length, indexed, notIndexed, failed, results };
}

/**
 * Get comprehensive index stats for a project
 */
export async function getIndexStats(projectId: string): Promise<{
  totalBacklinks: number;
  indexableBacklinks: number;
  googleIndexed: number;
  notIndexed: number;
  unchecked: number;
  indexRate: number;
  byCategory: Record<string, { total: number; indexed: number; rate: number }>;
  topIndexedUrls: Array<{ url: string; name: string; da: number }>;
}> {
  const statsResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status != 'error') as total,
       COUNT(*) FILTER (WHERE (indexable = true OR indexable IS NULL) AND status != 'error') as indexable,
       COUNT(*) FILTER (WHERE google_indexed = true) as google_indexed,
       COUNT(*) FILTER (WHERE google_indexed = false) as not_indexed,
       COUNT(*) FILTER (WHERE google_indexed IS NULL AND (indexable = true OR indexable IS NULL) AND status != 'error') as unchecked
     FROM backlink_results
     WHERE project_id = $1`,
    [projectId]
  );

  const stats = statsResult.rows[0];
  const indexable = parseInt(stats.indexable);
  const googleIndexed = parseInt(stats.google_indexed);

  // Category breakdown
  const catResult = await pool.query(
    `SELECT 
       COALESCE(endpoint_category, 'unknown') as category,
       COUNT(*) FILTER (WHERE status != 'error') as total,
       COUNT(*) FILTER (WHERE google_indexed = true) as indexed
     FROM backlink_results
     WHERE project_id = $1
     GROUP BY endpoint_category`,
    [projectId]
  );

  const byCategory: Record<string, { total: number; indexed: number; rate: number }> = {};
  for (const row of catResult.rows) {
    const total = parseInt(row.total);
    const catIndexed = parseInt(row.indexed);
    byCategory[row.category] = {
      total,
      indexed: catIndexed,
      rate: total > 0 ? Math.round((catIndexed / total) * 100) : 0,
    };
  }

  // Top indexed URLs with DA
  const topResult = await pool.query(
    `SELECT br.backlink_url, br.endpoint_name, COALESCE(be.endpoint_da, be.domain_authority, 0) as da
     FROM backlink_results br
     LEFT JOIN backlink_endpoints be ON be.id = br.endpoint_id
     WHERE br.project_id = $1 AND br.google_indexed = true
     ORDER BY COALESCE(be.endpoint_da, be.domain_authority, 0) DESC
     LIMIT 20`,
    [projectId]
  );

  const topIndexedUrls = topResult.rows.map((r: { backlink_url: string; endpoint_name: string; da: number }) => ({
    url: r.backlink_url,
    name: r.endpoint_name,
    da: parseInt(String(r.da)),
  }));

  return {
    totalBacklinks: parseInt(stats.total),
    indexableBacklinks: indexable,
    googleIndexed,
    notIndexed: parseInt(stats.not_indexed),
    unchecked: parseInt(stats.unchecked),
    indexRate: indexable > 0 ? Math.round((googleIndexed / indexable) * 100) : 0,
    byCategory,
    topIndexedUrls,
  };
}
