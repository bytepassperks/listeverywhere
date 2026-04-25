import { pool } from '../db/pool';

/**
 * Endpoint Discovery Worker
 * Runs every 6 hours to discover new backlink endpoints from known aggregator sources.
 * 
 * Strategy:
 * 1. Maintain a list of "seed URLs" — aggregator pages that list website analysis tools
 * 2. Fetch each seed URL and extract links matching backlink endpoint patterns
 * 3. Verify discovered endpoints are alive (HTTP 200-399)
 * 4. Add verified endpoints to the database
 * 5. Log discovery stats for the alert system
 */

interface DiscoveredEndpoint {
  name: string;
  url_template: string;
  category: string;
  source: string;
}

// Known patterns that indicate a URL accepts domain/URL input
const URL_PARAM_PATTERNS = [
  /[?&](url|domain|site|host|q|query|search|target|input|check|lookup|scan|analyze|test|addr|hostname)=/i,
  /\/(whois|lookup|check|scan|analyze|report|review|test|info|details|search)\//i,
];

// Category detection patterns
const CATEGORY_PATTERNS: { pattern: RegExp; category: string }[] = [
  { pattern: /whois|domain.*(lookup|search|check)|registrar/i, category: 'whois' },
  { pattern: /dns|nameserver|mx.*(record|lookup)|spf|dmarc|dkim/i, category: 'dns_lookup' },
  { pattern: /seo|backlink|rank|authority|serp|keyword|meta.?tag|sitemap/i, category: 'seo_analyzer' },
  { pattern: /speed|performance|pagespeed|lighthouse|load.?time|gtmetrix/i, category: 'speed_test' },
  { pattern: /ssl|security|malware|virus|threat|vulnerability|safe.?browsing/i, category: 'security_scan' },
  { pattern: /archive|wayback|cache|snapshot|screenshot/i, category: 'web_archive' },
  { pattern: /hosting|technology|stack|built.?with|cms|framework/i, category: 'website_info' },
  { pattern: /ping|submit|notify|indexnow|webmaster/i, category: 'ping_service' },
  { pattern: /bookmark|share|social|reddit|twitter|facebook|linkedin/i, category: 'social_bookmark' },
  { pattern: /directory|listing|business|local|yellow/i, category: 'directory' },
  { pattern: /ai|llm|chatgpt|perplexity|gemini|claude|copilot/i, category: 'llm_indexing' },
];

// Seed sources — aggregator pages that list website tools
const SEED_SOURCES = [
  // Lists of free SEO tools
  'https://www.google.com/search?q=free+website+analysis+tools+list+2024&num=20',
  'https://www.google.com/search?q=free+seo+tools+check+website&num=20',
  'https://www.google.com/search?q=free+whois+lookup+tools&num=20',
  'https://www.google.com/search?q=free+dns+lookup+tools+online&num=20',
  'https://www.google.com/search?q=free+website+speed+test+tools&num=20',
  'https://www.google.com/search?q=free+ssl+checker+tools+online&num=20',
  'https://www.google.com/search?q=free+backlink+checker+tools&num=20',
  'https://www.google.com/search?q=website+technology+checker+tools&num=20',
  'https://www.google.com/search?q=free+website+security+scanner+tools&num=20',
  'https://www.google.com/search?q=submit+website+to+search+engines+free&num=20',
  'https://www.google.com/search?q=best+free+domain+analysis+tools+2025&num=20',
  'https://www.google.com/search?q=website+worth+calculator+free&num=20',
  'https://www.google.com/search?q=online+ping+service+website&num=20',
  'https://www.google.com/search?q=social+bookmark+submission+sites+list&num=20',
  'https://www.google.com/search?q=free+website+directory+submission+sites&num=20',
  'https://www.google.com/search?q=ai+tools+directory+submit&num=20',
];

// Well-known tool domains to check for new paths/tools
const TOOL_DOMAINS = [
  'viewdns.info', 'mxtoolbox.com', 'hackertarget.com', 'pentest-tools.com',
  'centralops.net', 'dnschecker.org', 'sitechecker.pro', 'smallseotools.com',
  'prepostseo.com', 'duplichecker.com', 'websiteseochecker.com', 'seoreviewtools.com',
  'tools.keycdn.com', 'check-host.net', 'web-check.xyz', 'urlscan.io',
  'who.is', 'whois.com', 'dnslytics.com', 'securitytrails.com',
  'builtwith.com', 'w3techs.com', 'wappalyzer.com', 'netcraft.com',
];

function detectCategory(url: string, text: string): string {
  const combined = `${url} ${text}`.toLowerCase();
  for (const { pattern, category } of CATEGORY_PATTERNS) {
    if (pattern.test(combined)) return category;
  }
  return 'general';
}

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function createUrlTemplate(url: string, domain: string): string | null {
  // Try to create a template by replacing the domain parameter with {DOMAIN}
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  for (const [key, value] of params.entries()) {
    if (/^(url|domain|site|host|q|query|search|target|input|check|lookup|scan|analyze|test|addr|hostname)$/i.test(key)) {
      if (value) {
        const template = url.replace(value, '{DOMAIN}');
        if (template.includes('{DOMAIN}')) return template;
      }
    }
  }
  
  // Check for path-based patterns like /whois/example.com
  const pathMatch = url.match(/\/(whois|lookup|check|scan|analyze|report|review|domain|site)\/([^/?]+)/i);
  if (pathMatch && pathMatch[2]) {
    const template = url.replace(pathMatch[2], '{DOMAIN}');
    if (template.includes('{DOMAIN}')) return template;
  }
  
  return null;
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<{ ok: boolean; status: number; text: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    const text = await response.text();
    return { ok: response.ok, status: response.status, text: text.slice(0, 50000) };
  } catch {
    clearTimeout(timeout);
    return { ok: false, status: 0, text: '' };
  }
}

async function verifyEndpoint(template: string, testDomain = 'example.com'): Promise<boolean> {
  const url = template
    .replace(/{DOMAIN}/g, testDomain)
    .replace(/{URL}/g, encodeURIComponent(`https://${testDomain}`));
  
  const result = await fetchWithTimeout(url, 8000);
  return result.ok || (result.status >= 200 && result.status < 400);
}

async function getExistingTemplates(): Promise<Set<string>> {
  const { rows } = await pool.query('SELECT url_template FROM backlink_endpoints WHERE active = true');
  return new Set(rows.map(r => r.url_template));
}

export async function runDiscovery(): Promise<{
  discovered: number;
  verified: number;
  added: number;
  sources_checked: number;
}> {
  console.log('[EndpointDiscovery] Starting discovery run...');
  
  const existingTemplates = await getExistingTemplates();
  const newEndpoints: DiscoveredEndpoint[] = [];
  let sourcesChecked = 0;
  
  // Strategy 1: Check well-known tool domains for new tools/paths
  for (const domain of TOOL_DOMAINS) {
    try {
      const result = await fetchWithTimeout(`https://${domain}`, 8000);
      sourcesChecked++;
      
      if (result.ok) {
        // Extract all links from the page
        const linkRegex = /href=["'](https?:\/\/[^"']+)["']/gi;
        let match;
        while ((match = linkRegex.exec(result.text)) !== null) {
          const href = match[1];
          const hrefDomain = extractDomainFromUrl(href);
          
          // Only interested in links on the same domain that have URL parameters
          if (hrefDomain === domain || hrefDomain === `www.${domain}`) {
            for (const pattern of URL_PARAM_PATTERNS) {
              if (pattern.test(href)) {
                const template = createUrlTemplate(href, domain);
                if (template && !existingTemplates.has(template)) {
                  const category = detectCategory(href, '');
                  newEndpoints.push({
                    name: `${domain} - ${category}`,
                    url_template: template,
                    category,
                    source: `crawl:${domain}`,
                  });
                }
                break;
              }
            }
          }
        }
      }
    } catch {
      // Skip failed domains
    }
    
    // Small delay between domains
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`[EndpointDiscovery] Found ${newEndpoints.length} potential new endpoints from ${sourcesChecked} sources`);
  
  // Verify new endpoints (sample up to 50 at a time)
  const toVerify = newEndpoints.slice(0, 50);
  let verified = 0;
  let added = 0;
  
  for (const ep of toVerify) {
    const isAlive = await verifyEndpoint(ep.url_template);
    if (isAlive) {
      verified++;
      
      // Add to database
      try {
        await pool.query(
          `INSERT INTO backlink_endpoints (name, url_template, category, active, discovered_by)
           VALUES ($1, $2, $3, true, $4)
           ON CONFLICT (url_template) DO NOTHING`,
          [ep.name, ep.url_template, ep.category, ep.source]
        );
        added++;
        existingTemplates.add(ep.url_template);
      } catch {
        // Skip duplicates
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Log discovery results
  await pool.query(
    `INSERT INTO indexer_discovery_log (discovered_count, verified_count, added_count, sources_checked)
     VALUES ($1, $2, $3, $4)`,
    [newEndpoints.length, verified, added, sourcesChecked]
  );
  
  console.log(`[EndpointDiscovery] Discovery complete: ${newEndpoints.length} discovered, ${verified} verified, ${added} added`);
  
  return {
    discovered: newEndpoints.length,
    verified,
    added,
    sources_checked: sourcesChecked,
  };
}

export async function getDiscoveryStats(): Promise<{
  totalEndpoints: number;
  lastDiscovery: string | null;
  newThisWeek: number;
  totalDiscovered: number;
}> {
  const [{ rows: [total] }, { rows: [last] }, { rows: [week] }] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM backlink_endpoints WHERE active = true'),
    pool.query('SELECT created_at, added_count FROM indexer_discovery_log ORDER BY created_at DESC LIMIT 1'),
    pool.query(`SELECT COALESCE(SUM(added_count), 0) as count FROM indexer_discovery_log 
                WHERE created_at >= NOW() - INTERVAL '7 days'`),
  ]);
  
  return {
    totalEndpoints: parseInt(total.count),
    lastDiscovery: last?.created_at || null,
    newThisWeek: parseInt(week.count),
    totalDiscovered: parseInt(total.count),
  };
}
