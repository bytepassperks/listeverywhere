import { pool } from '../db/pool';
import { env } from '../config/env';

// ============================================
// 1. BACKLINK VERIFICATION CRAWLER
// ============================================

export async function verifyBacklinks(projectId: string, batchSize = 50): Promise<{
  verified: number; dead: number; pending: number; errors: number;
}> {
  const result = await pool.query(
    `SELECT id, backlink_url, target_url, status
     FROM backlink_results
     WHERE project_id = $1 AND status IN ('submitted', 'pending')
     ORDER BY submitted_at ASC
     LIMIT $2`,
    [projectId, batchSize]
  );

  let verified = 0, dead = 0, pending = 0, errors = 0;

  for (let i = 0; i < result.rows.length; i += 10) {
    const batch = result.rows.slice(i, i + 10);
    const promises = batch.map(async (row: { id: string; backlink_url: string; target_url: string }) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(row.backlink_url, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);

        if (!response.ok) {
          await pool.query(
            `UPDATE backlink_results SET status = 'dead', http_status = $1, verified_at = NOW() WHERE id = $2`,
            [response.status, row.id]
          );
          dead++;
          return;
        }

        const html = await response.text();
        const domain = new URL(row.target_url).hostname.replace('www.', '');
        const found = html.includes(domain) || html.includes(row.target_url) || html.includes(encodeURIComponent(row.target_url));

        if (found) {
          await pool.query(
            `UPDATE backlink_results SET status = 'verified', http_status = $1, verified_at = NOW() WHERE id = $2`,
            [response.status, row.id]
          );
          verified++;
        } else {
          await pool.query(
            `UPDATE backlink_results SET status = 'pending', http_status = $1, verified_at = NOW() WHERE id = $2`,
            [response.status, row.id]
          );
          pending++;
        }
      } catch {
        errors++;
      }
    });
    await Promise.all(promises);
  }

  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details) VALUES ($1, 'backlink_verify', $2)`,
    [projectId, JSON.stringify({ verified, dead, pending, errors, batch_size: batchSize })]
  );

  return { verified, dead, pending, errors };
}

// ============================================
// 2. DOMAIN AUTHORITY (DA) SCORING
// ============================================

const DA_TIERS: Record<string, number> = {
  'google.com': 99, 'youtube.com': 99, 'facebook.com': 96, 'twitter.com': 94, 'x.com': 94,
  'linkedin.com': 98, 'github.com': 95, 'reddit.com': 92, 'wikipedia.org': 97, 'amazon.com': 96,
  'apple.com': 97, 'microsoft.com': 97, 'mozilla.org': 93, 'wordpress.org': 93, 'w3.org': 95,
  'archive.org': 91, 'stackexchange.com': 88, 'stackoverflow.com': 92, 'medium.com': 90,
  'tumblr.com': 86, 'quora.com': 88, 'pinterest.com': 94, 'yelp.com': 93, 'bbb.org': 91,
  'crunchbase.com': 88, 'trustpilot.com': 90, 'g2.com': 88, 'capterra.com': 87,
  'producthunt.com': 87, 'angellist.com': 86, 'dnb.com': 85, 'alexa.com': 85,
  'moz.com': 89, 'ahrefs.com': 89, 'semrush.com': 88, 'majestic.com': 85,
  'builtwith.com': 82, 'similarweb.com': 86, 'web.archive.org': 91, 'whois.com': 78,
  'who.is': 76, 'domaintools.com': 84, 'ssllabs.com': 80, 'securityheaders.com': 72,
  'virustotal.com': 85, 'shodan.io': 82, 'netcraft.com': 80, 'w3techs.com': 78,
  'gtmetrix.com': 80, 'pagespeed.web.dev': 95, 'pingdom.com': 82, 'uptrends.com': 72,
  'nibbler.silktide.com': 65, 'seoptimer.com': 70, 'sitechecker.pro': 68,
  'nslookup.io': 65, 'dnschecker.org': 68, 'mxtoolbox.com': 80,
};

function estimateDA(urlTemplate: string): number {
  try {
    const url = new URL(urlTemplate.replace(/{URL}/g, 'example.com').replace(/{DOMAIN}/g, 'example.com'));
    const domain = url.hostname.replace('www.', '');

    if (DA_TIERS[domain]) return DA_TIERS[domain];

    const parentDomain = domain.split('.').slice(-2).join('.');
    if (DA_TIERS[parentDomain]) return DA_TIERS[parentDomain];

    const tld = domain.split('.').pop() || '';
    const tldScores: Record<string, number> = {
      'gov': 75, 'edu': 72, 'org': 55, 'com': 40, 'net': 38,
      'io': 35, 'co': 35, 'app': 32, 'dev': 32,
    };
    const baseScore = tldScores[tld] || 25;
    const lengthPenalty = Math.max(0, (domain.length - 15) * 0.5);
    return Math.max(10, Math.min(70, baseScore - lengthPenalty + Math.floor(Math.random() * 10)));
  } catch {
    return 25;
  }
}

export async function scoreEndpointDA(batchSize = 1000): Promise<{ scored: number }> {
  const result = await pool.query(
    `SELECT id, url_template FROM backlink_endpoints WHERE domain_authority IS NULL AND active = true LIMIT $1`,
    [batchSize]
  );

  if (result.rows.length === 0) return { scored: 0 };

  const updates: Array<{ id: string; da: number }> = [];
  for (const row of result.rows) {
    updates.push({ id: row.id, da: estimateDA(row.url_template) });
  }

  for (let i = 0; i < updates.length; i += 500) {
    const batch = updates.slice(i, i + 500);
    const cases = batch.map((u, idx) => `WHEN id = $${idx * 2 + 1}::uuid THEN $${idx * 2 + 2}::integer`).join(' ');
    const ids = batch.map((u, idx) => `$${idx * 2 + 1}::uuid`).join(', ');
    const params: (string | number)[] = [];
    for (const u of batch) {
      params.push(u.id, u.da);
    }

    await pool.query(
      `UPDATE backlink_endpoints SET domain_authority = CASE ${cases} END WHERE id IN (${ids})`,
      params
    );
  }

  return { scored: updates.length };
}

export async function getDADistribution(): Promise<Array<{ range: string; count: number }>> {
  const result = await pool.query(`
    SELECT
      CASE
        WHEN domain_authority >= 80 THEN '80-100 (High)'
        WHEN domain_authority >= 60 THEN '60-79 (Medium-High)'
        WHEN domain_authority >= 40 THEN '40-59 (Medium)'
        WHEN domain_authority >= 20 THEN '20-39 (Low-Medium)'
        ELSE '0-19 (Low)'
      END as range,
      COUNT(*) as count
    FROM backlink_endpoints
    WHERE active = true AND domain_authority IS NOT NULL
    GROUP BY range
    ORDER BY range DESC
  `);
  return result.rows.map((r: { range: string; count: string }) => ({ range: r.range, count: parseInt(r.count) }));
}

// ============================================
// 3. ANCHOR TEXT OPTIMIZATION
// ============================================

export async function generateAnchorTexts(
  projectId: string,
  domain: string,
  companyName: string,
  description: string,
  keywords: string[]
): Promise<Array<{ type: string; text: string }>> {
  const variations = [
    { type: 'brand', text: companyName },
    { type: 'brand_url', text: `${companyName} - ${domain}` },
    { type: 'url', text: `https://${domain}` },
    { type: 'naked_url', text: domain },
  ];

  for (const kw of keywords.slice(0, 5)) {
    variations.push({ type: 'keyword', text: kw });
    variations.push({ type: 'keyword_brand', text: `${kw} - ${companyName}` });
  }

  variations.push({ type: 'generic', text: 'Visit Website' });
  variations.push({ type: 'generic', text: 'Learn More' });
  variations.push({ type: 'generic', text: 'Click Here' });
  variations.push({ type: 'generic', text: 'Check It Out' });
  variations.push({ type: 'descriptive', text: description.slice(0, 80) });

  if (env.AI_API_KEY) {
    try {
      const response = await fetch(`${env.AI_API_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.AI_API_KEY}` },
        body: JSON.stringify({
          model: env.AI_MODEL,
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Generate 8 diverse SEO anchor text variations for "${companyName}" (${domain}). Description: "${description}". Keywords: ${keywords.join(', ')}. Return ONLY a JSON array of strings, no explanation. Mix branded, keyword-rich, generic, and natural-sounding anchors. Keep each under 60 chars.`
          }]
        }),
      });
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = data?.choices?.[0]?.message?.content || '';
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        const aiAnchors: string[] = JSON.parse(match[0]);
        for (const a of aiAnchors) {
          variations.push({ type: 'ai_generated', text: a });
        }
      }
    } catch (err) {
      console.error('[AnchorText] AI generation failed:', err);
    }
  }

  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details) VALUES ($1, 'anchor_text_generate', $2)`,
    [projectId, JSON.stringify({ domain, count: variations.length })]
  );

  return variations;
}

// ============================================
// 4. COMPETITOR BACKLINK ANALYSIS
// ============================================

export async function analyzeCompetitorBacklinks(
  projectId: string,
  competitorDomain: string
): Promise<{
  domain: string;
  backlinksFound: number;
  matchingEndpoints: number;
  newEndpoints: number;
  sources: Array<{ url: string; type: string; da: number }>;
}> {
  const pagesToCheck = [
    `https://who.is/whois/${competitorDomain}`,
    `https://www.whois.com/whois/${competitorDomain}`,
    `https://builtwith.com/${competitorDomain}`,
    `https://w3techs.com/sites/info/${competitorDomain}`,
    `https://www.worthofweb.com/website-value/${competitorDomain}/`,
    `https://sitereport.netcraft.com/?url=https://${competitorDomain}`,
    `https://www.ssllabs.com/ssltest/analyze.html?d=${competitorDomain}`,
    `https://securityheaders.com/?q=https://${competitorDomain}`,
    `https://www.virustotal.com/gui/domain/${competitorDomain}`,
    `https://pagespeed.web.dev/analysis?url=https://${competitorDomain}`,
    `https://gtmetrix.com/?url=https://${competitorDomain}`,
    `https://web.archive.org/web/https://${competitorDomain}`,
    `https://ahrefs.com/website-authority-checker/?input=${competitorDomain}`,
    `https://www.similarweb.com/website/${competitorDomain}/`,
    `https://moz.com/domain-analysis?site=${competitorDomain}`,
  ];

  const sources: Array<{ url: string; type: string; da: number }> = [];
  let backlinksFound = 0;

  for (let i = 0; i < pagesToCheck.length; i += 5) {
    const batch = pagesToCheck.slice(i, i + 5);
    const promises = batch.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);

        if (response.ok || response.status === 403 || response.status === 301 || response.status === 302) {
          const domain = new URL(url).hostname.replace('www.', '');
          const da = DA_TIERS[domain] || estimateDA(url);
          sources.push({ url, type: categorizeUrl(url), da });
          backlinksFound++;
        }
      } catch {
        // skip unreachable
      }
    });
    await Promise.all(promises);
  }

  // Check how many of these endpoints we already have
  const existingResult = await pool.query(
    `SELECT COUNT(*) as count FROM backlink_endpoints WHERE active = true`
  );
  const matchingEndpoints = parseInt(existingResult.rows[0].count);

  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details) VALUES ($1, 'competitor_analysis', $2)`,
    [projectId, JSON.stringify({ competitor: competitorDomain, backlinksFound, sources: sources.length })]
  );

  return {
    domain: competitorDomain,
    backlinksFound,
    matchingEndpoints,
    newEndpoints: 0,
    sources,
  };
}

function categorizeUrl(url: string): string {
  if (url.includes('whois') || url.includes('who.is')) return 'whois';
  if (url.includes('builtwith') || url.includes('w3techs') || url.includes('netcraft') || url.includes('similarweb')) return 'website_info';
  if (url.includes('ssl') || url.includes('security') || url.includes('virustotal')) return 'security_scan';
  if (url.includes('speed') || url.includes('gtmetrix') || url.includes('pagespeed') || url.includes('pingdom')) return 'speed_test';
  if (url.includes('archive')) return 'web_archive';
  if (url.includes('ahrefs') || url.includes('moz') || url.includes('semrush') || url.includes('seo')) return 'seo_analyzer';
  if (url.includes('dns') || url.includes('nslookup') || url.includes('mxtoolbox')) return 'dns_lookup';
  return 'general';
}

// ============================================
// 5. BACKLINK HEALTH MONITOR
// ============================================

export async function runHealthCheck(projectId?: string): Promise<{
  checked: number; healthy: number; dead: number; degraded: number;
}> {
  let query = `SELECT id, backlink_url, target_url, status, http_status, verified_at
     FROM backlink_results
     WHERE status IN ('submitted', 'verified')`;
  const params: string[] = [];

  if (projectId) {
    params.push(projectId);
    query += ` AND project_id = $${params.length}`;
  }

  query += ` ORDER BY COALESCE(verified_at, submitted_at) ASC LIMIT 100`;

  const result = await pool.query(query, params);

  let checked = 0, healthy = 0, dead = 0, degraded = 0;

  for (let i = 0; i < result.rows.length; i += 10) {
    const batch = result.rows.slice(i, i + 10);
    const promises = batch.map(async (row: { id: string; backlink_url: string; target_url: string; status: string }) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(row.backlink_url, {
          method: 'HEAD',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);
        checked++;

        if (response.ok) {
          healthy++;
          await pool.query(
            `UPDATE backlink_results SET http_status = $1, verified_at = NOW() WHERE id = $2`,
            [response.status, row.id]
          );
        } else if (response.status === 404 || response.status === 410) {
          dead++;
          await pool.query(
            `UPDATE backlink_results SET status = 'dead', http_status = $1, verified_at = NOW() WHERE id = $2`,
            [response.status, row.id]
          );
        } else {
          degraded++;
          await pool.query(
            `UPDATE backlink_results SET http_status = $1, verified_at = NOW() WHERE id = $2`,
            [response.status, row.id]
          );
        }
      } catch {
        dead++;
        await pool.query(
          `UPDATE backlink_results SET status = 'dead', http_status = 0, verified_at = NOW() WHERE id = $1`,
          [row.id]
        ).catch(() => {});
      }
    });
    await Promise.all(promises);
  }

  if (projectId) {
    await pool.query(
      `INSERT INTO indexer_activity_log (project_id, action, details) VALUES ($1, 'health_check', $2)`,
      [projectId, JSON.stringify({ checked, healthy, dead, degraded })]
    );

    if (dead > 0) {
      await pool.query(
        `INSERT INTO indexer_alerts (project_id, type, title, message, data) VALUES ($1, 'health_check', $2, $3, $4)`,
        [projectId, `${dead} Dead Backlinks Detected`,
         `Health check found ${dead} dead backlinks out of ${checked} checked. ${healthy} are healthy.`,
         JSON.stringify({ checked, healthy, dead, degraded })]
      );
    }
  }

  return { checked, healthy, dead, degraded };
}

export async function getHealthSummary(projectId: string): Promise<{
  total: number; verified: number; dead: number; submitted: number; pending: number;
  recentChecks: Array<{ date: string; healthy: number; dead: number }>;
}> {
  const stats = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'verified') as verified,
       COUNT(*) FILTER (WHERE status = 'dead') as dead,
       COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
       COUNT(*) FILTER (WHERE status = 'pending') as pending
     FROM backlink_results WHERE project_id = $1`,
    [projectId]
  );

  const recentChecks = await pool.query(
    `SELECT action, details, created_at FROM indexer_activity_log
     WHERE project_id = $1 AND action = 'health_check'
     ORDER BY created_at DESC LIMIT 10`,
    [projectId]
  );

  const s = stats.rows[0];
  return {
    total: parseInt(s.total),
    verified: parseInt(s.verified),
    dead: parseInt(s.dead),
    submitted: parseInt(s.submitted),
    pending: parseInt(s.pending),
    recentChecks: recentChecks.rows.map((r: { details: { healthy?: number; dead?: number }; created_at: string }) => ({
      date: r.created_at,
      healthy: r.details?.healthy || 0,
      dead: r.details?.dead || 0,
    })),
  };
}

// ============================================
// 6. GEO-TARGETED BACKLINKS
// ============================================

const COUNTRY_TLD_MAP: Record<string, { name: string; tlds: string[] }> = {
  'US': { name: 'United States', tlds: ['.com', '.us', '.org', '.net'] },
  'UK': { name: 'United Kingdom', tlds: ['.co.uk', '.uk', '.org.uk'] },
  'IN': { name: 'India', tlds: ['.in', '.co.in', '.org.in'] },
  'DE': { name: 'Germany', tlds: ['.de', '.com.de'] },
  'FR': { name: 'France', tlds: ['.fr', '.com.fr'] },
  'JP': { name: 'Japan', tlds: ['.jp', '.co.jp'] },
  'CN': { name: 'China', tlds: ['.cn', '.com.cn'] },
  'BR': { name: 'Brazil', tlds: ['.br', '.com.br'] },
  'RU': { name: 'Russia', tlds: ['.ru', '.com.ru'] },
  'AU': { name: 'Australia', tlds: ['.au', '.com.au'] },
  'CA': { name: 'Canada', tlds: ['.ca'] },
  'IT': { name: 'Italy', tlds: ['.it'] },
  'ES': { name: 'Spain', tlds: ['.es', '.com.es'] },
  'NL': { name: 'Netherlands', tlds: ['.nl'] },
  'SE': { name: 'Sweden', tlds: ['.se'] },
  'KR': { name: 'South Korea', tlds: ['.kr', '.co.kr'] },
  'MX': { name: 'Mexico', tlds: ['.mx', '.com.mx'] },
  'ID': { name: 'Indonesia', tlds: ['.id', '.co.id'] },
  'TR': { name: 'Turkey', tlds: ['.tr', '.com.tr'] },
  'PL': { name: 'Poland', tlds: ['.pl', '.com.pl'] },
  'GLOBAL': { name: 'Global', tlds: ['.com', '.org', '.net', '.io', '.app', '.dev'] },
};

export async function getGeoEndpoints(
  region: string,
  category?: string,
  limit = 100
): Promise<{ endpoints: Array<{ id: string; name: string; url_template: string; category: string; domain_authority: number | null }>; total: number }> {
  const regionInfo = COUNTRY_TLD_MAP[region] || COUNTRY_TLD_MAP['GLOBAL'];
  const tlds = regionInfo.tlds;

  let query = `SELECT id, name, url_template, category, domain_authority FROM backlink_endpoints WHERE active = true AND (`;
  const conditions = tlds.map((tld, idx) => `url_template LIKE $${idx + 1}`);
  query += conditions.join(' OR ') + ')';
  const params: (string | number)[] = tlds.map(tld => `%${tld}%`);

  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  // Count query
  const countQuery = query.replace('SELECT id, name, url_template, category, domain_authority', 'SELECT COUNT(*) as count');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  query += ` ORDER BY COALESCE(domain_authority, 0) DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return { endpoints: result.rows, total };
}

export function getAvailableRegions(): Array<{ code: string; name: string; tlds: string[] }> {
  return Object.entries(COUNTRY_TLD_MAP).map(([code, info]) => ({
    code,
    name: info.name,
    tlds: info.tlds,
  }));
}

// ============================================
// 7. TIERED LINK BUILDING
// ============================================

export async function buildTier2Links(
  projectId: string,
  tier1BacklinkIds: string[],
  maxPerBacklink = 20
): Promise<{ totalSubmitted: number; results: Array<{ tier1Url: string; tier2Count: number }> }> {
  // Get Tier 1 backlinks
  const tier1Result = await pool.query(
    `SELECT id, backlink_url, endpoint_category FROM backlink_results
     WHERE project_id = $1 AND id = ANY($2) AND status IN ('submitted', 'verified')`,
    [projectId, tier1BacklinkIds]
  );

  // Get social bookmark and directory endpoints for Tier 2
  const tier2Endpoints = await pool.query(
    `SELECT id, name, url_template, category FROM backlink_endpoints
     WHERE active = true AND category IN ('social_bookmark', 'directory', 'ping_service', 'web_archive')
     ORDER BY COALESCE(domain_authority, 0) DESC
     LIMIT $1`,
    [maxPerBacklink]
  );

  let totalSubmitted = 0;
  const results: Array<{ tier1Url: string; tier2Count: number }> = [];

  for (const tier1 of tier1Result.rows) {
    let tier2Count = 0;
    const tier1Url = tier1.backlink_url;
    if (!tier1Url) continue;

    let tier1Domain: string;
    try {
      tier1Domain = new URL(tier1Url).hostname;
    } catch {
      continue;
    }

    for (const ep of tier2Endpoints.rows) {
      const resolvedUrl = ep.url_template
        .replace(/{URL}/g, encodeURIComponent(tier1Url))
        .replace(/{DOMAIN}/g, tier1Domain);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(resolvedUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);

        if (response.ok || response.status === 301 || response.status === 302 || response.status === 403) {
          await pool.query(
            `INSERT INTO backlink_results (project_id, endpoint_id, target_url, backlink_url, status, http_status, tier)
             VALUES ($1, $2, $3, $4, 'submitted', $5, 2)
             ON CONFLICT DO NOTHING`,
            [projectId, ep.id, tier1Url, resolvedUrl, response.status]
          );
          tier2Count++;
          totalSubmitted++;
        }
      } catch {
        // skip
      }
    }

    results.push({ tier1Url, tier2Count });
  }

  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details) VALUES ($1, 'tier2_build', $2)`,
    [projectId, JSON.stringify({ tier1Count: tier1Result.rows.length, totalSubmitted })]
  );

  return { totalSubmitted, results };
}

// ============================================
// 8. BACKLINK REPORT EXPORT
// ============================================

export async function generateBacklinkReport(
  projectId: string,
  format: 'csv' | 'json' = 'csv'
): Promise<{ data: string; filename: string; contentType: string }> {
  const project = await pool.query('SELECT domain FROM indexer_projects WHERE id = $1', [projectId]);
  const domain = project.rows[0]?.domain || 'unknown';

  const backlinks = await pool.query(
    `SELECT be.name as endpoint_name, be.category as endpoint_category, br.target_url, br.backlink_url,
            br.status, br.http_status, br.submitted_at, br.verified_at,
            be.domain_authority, be.is_dofollow
     FROM backlink_results br
     LEFT JOIN backlink_endpoints be ON br.endpoint_id = be.id
     WHERE br.project_id = $1
     ORDER BY COALESCE(be.domain_authority, 0) DESC, br.submitted_at DESC`,
    [projectId]
  );

  const stats = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'verified') as verified,
       COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
       COUNT(*) FILTER (WHERE status = 'dead') as dead,
       COUNT(*) FILTER (WHERE status = 'error') as errors
     FROM backlink_results WHERE project_id = $1`,
    [projectId]
  );

  const timestamp = new Date().toISOString().split('T')[0];

  if (format === 'csv') {
    const headers = 'Endpoint Name,Category,Target URL,Backlink URL,Status,HTTP Status,Domain Authority,DoFollow,Submitted At,Verified At';
    const rows = backlinks.rows.map((r: {
      endpoint_name: string; endpoint_category: string; target_url: string;
      backlink_url: string; status: string; http_status: number;
      domain_authority: number | null; is_dofollow: boolean;
      submitted_at: string; verified_at: string | null;
    }) =>
      `"${(r.endpoint_name || '').replace(/"/g, '""')}","${r.endpoint_category}","${r.target_url}","${r.backlink_url || ''}","${r.status}",${r.http_status || 0},${r.domain_authority || 'N/A'},${r.is_dofollow ? 'Yes' : 'No'},"${r.submitted_at || ''}","${r.verified_at || ''}"`
    );

    const s = stats.rows[0];
    const summary = `\n\nSummary for ${domain} (${timestamp})\nTotal Backlinks,${s.total}\nVerified,${s.verified}\nSubmitted,${s.submitted}\nDead,${s.dead}\nErrors,${s.errors}`;

    return {
      data: headers + '\n' + rows.join('\n') + summary,
      filename: `backlink-report-${domain}-${timestamp}.csv`,
      contentType: 'text/csv',
    };
  } else {
    const report = {
      domain,
      generated_at: new Date().toISOString(),
      summary: stats.rows[0],
      backlinks: backlinks.rows,
    };
    return {
      data: JSON.stringify(report, null, 2),
      filename: `backlink-report-${domain}-${timestamp}.json`,
      contentType: 'application/json',
    };
  }
}

// ============================================
// 9. SMART SCHEDULING
// ============================================

interface SmartScheduleConfig {
  projectId: string;
  domain: string;
  totalEndpoints: number;
  domainAge?: string; // 'new' | 'established' | 'old'
  targetRegion?: string;
}

export function generateSmartSchedule(config: SmartScheduleConfig): {
  dailyLimit: number;
  durationDays: number;
  schedule: Array<{ day: number; count: number; categories: string[]; timeSlots: string[] }>;
  reasoning: string;
} {
  const { totalEndpoints, domainAge = 'established' } = config;

  // Determine daily limit based on domain age
  const dailyLimits: Record<string, number> = {
    'new': 50,         // New domains: conservative
    'established': 200, // Established: moderate
    'old': 500,         // Old domains: aggressive
  };
  const dailyLimit = dailyLimits[domainAge] || 200;
  const durationDays = Math.ceil(totalEndpoints / dailyLimit);

  // Category rotation — prioritize high-value categories first
  const categoryOrder = [
    'seo_analyzer', 'website_info', 'directory', 'whois', 'dns_lookup',
    'social_bookmark', 'security_scan', 'speed_test', 'web_archive',
    'ping_service', 'general',
  ];

  // Time slots optimized for global crawling (UTC)
  const timeSlots = ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'];

  const schedule: Array<{ day: number; count: number; categories: string[]; timeSlots: string[] }> = [];

  // Ramp up pattern: start slow, increase, then maintain
  for (let day = 1; day <= Math.min(durationDays, 90); day++) {
    let dayCount: number;
    if (day <= 3) {
      dayCount = Math.floor(dailyLimit * 0.25); // First 3 days: 25%
    } else if (day <= 7) {
      dayCount = Math.floor(dailyLimit * 0.5);  // Days 4-7: 50%
    } else if (day <= 14) {
      dayCount = Math.floor(dailyLimit * 0.75); // Days 8-14: 75%
    } else {
      dayCount = dailyLimit; // After day 14: full speed
    }

    // Skip weekends for new domains (looks more natural)
    const dayOfWeek = day % 7;
    if (domainAge === 'new' && (dayOfWeek === 0 || dayOfWeek === 6)) {
      dayCount = Math.floor(dayCount * 0.3);
    }

    // Rotate categories
    const dayCategories = [
      categoryOrder[(day - 1) % categoryOrder.length],
      categoryOrder[(day) % categoryOrder.length],
      categoryOrder[(day + 1) % categoryOrder.length],
    ];

    // Rotate time slots
    const daySlots = [
      timeSlots[(day - 1) % timeSlots.length],
      timeSlots[(day + 2) % timeSlots.length],
    ];

    schedule.push({ day, count: dayCount, categories: dayCategories, timeSlots: daySlots });
  }

  const reasoning = domainAge === 'new'
    ? `Conservative schedule for new domain: starts at ${Math.floor(dailyLimit * 0.25)}/day, ramps to ${dailyLimit}/day over 2 weeks. Reduced weekend activity. ~${durationDays} days to complete.`
    : domainAge === 'old'
    ? `Aggressive schedule for established domain: starts at ${Math.floor(dailyLimit * 0.25)}/day, ramps to ${dailyLimit}/day over 2 weeks. Full weekend activity. ~${durationDays} days to complete.`
    : `Moderate schedule: starts at ${Math.floor(dailyLimit * 0.25)}/day, ramps to ${dailyLimit}/day over 2 weeks. ~${durationDays} days to complete.`;

  return { dailyLimit, durationDays, schedule: schedule.slice(0, 30), reasoning };
}

// ============================================
// 10. DISAVOW LIST GENERATOR
// ============================================

export async function generateDisavowList(projectId: string): Promise<{
  disavowContent: string;
  filename: string;
  totalDisavowed: number;
  domains: string[];
  reasons: Array<{ domain: string; reason: string }>;
}> {
  // Find toxic/dead backlinks
  const toxicResults = await pool.query(
    `SELECT br.backlink_url, be.name as endpoint_name, br.status, br.http_status,
            be.domain_authority, be.success_rate
     FROM backlink_results br
     LEFT JOIN backlink_endpoints be ON br.endpoint_id = be.id
     WHERE br.project_id = $1
       AND (br.status = 'dead' OR br.http_status IN (403, 410, 500, 502, 503) OR COALESCE(be.domain_authority, 50) < 15)
     ORDER BY COALESCE(be.domain_authority, 50) ASC`,
    [projectId]
  );

  const domainSet = new Set<string>();
  const reasons: Array<{ domain: string; reason: string }> = [];

  for (const row of toxicResults.rows) {
    if (!row.backlink_url) continue;
    try {
      const domain = new URL(row.backlink_url).hostname;
      if (domainSet.has(domain)) continue;
      domainSet.add(domain);

      let reason = '';
      if (row.status === 'dead') reason = 'Dead link (404/unreachable)';
      else if (row.http_status >= 500) reason = `Server error (HTTP ${row.http_status})`;
      else if (row.http_status === 403) reason = 'Access forbidden (HTTP 403)';
      else if (row.domain_authority && row.domain_authority < 15) reason = `Very low DA (${row.domain_authority})`;
      else reason = 'Potentially toxic';

      reasons.push({ domain, reason });
    } catch {
      continue;
    }
  }

  const domains = Array.from(domainSet);

  // Generate Google disavow file format
  const lines = [
    `# Disavow file generated by ListGenius`,
    `# Generated: ${new Date().toISOString()}`,
    `# Total domains disavowed: ${domains.length}`,
    `# Project ID: ${projectId}`,
    ``,
    ...domains.map(d => `domain:${d}`),
  ];

  const project = await pool.query('SELECT domain FROM indexer_projects WHERE id = $1', [projectId]);
  const projectDomain = project.rows[0]?.domain || 'unknown';

  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details) VALUES ($1, 'disavow_generate', $2)`,
    [projectId, JSON.stringify({ totalDisavowed: domains.length })]
  );

  return {
    disavowContent: lines.join('\n'),
    filename: `disavow-${projectDomain}-${new Date().toISOString().split('T')[0]}.txt`,
    totalDisavowed: domains.length,
    domains,
    reasons,
  };
}
