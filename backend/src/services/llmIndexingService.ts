import { pool } from '../db/pool';

const LLM_SEARCH_ENGINES = [
  {
    name: 'Bing Chat / Copilot',
    type: 'indexnow',
    description: 'Uses IndexNow protocol — automatically covered by IndexNow submissions',
  },
  {
    name: 'ChatGPT Browse',
    type: 'web_presence',
    description: 'Discovers content via Bing index and web browsing — covered by backlinks + IndexNow',
  },
  {
    name: 'Perplexity',
    type: 'web_presence',
    description: 'Crawls the web independently + uses Bing — strong web presence helps',
  },
  {
    name: 'Google Gemini',
    type: 'google_index',
    description: 'Uses Google Search index — covered by GSC submissions',
  },
  {
    name: 'Claude (Anthropic)',
    type: 'web_presence',
    description: 'No direct submission — trained on web data, web presence matters',
  },
  {
    name: 'You.com',
    type: 'yep_indexnow',
    description: 'Has its own crawler — supports IndexNow-like submission',
  },
];

const LLM_OPTIMIZATION_ENDPOINTS = [
  // Sites that help LLMs discover and understand your content
  { name: 'llms.txt Generator', url_template: 'https://{DOMAIN}/llms.txt', category: 'llm_indexing', description: 'Check/create llms.txt file for AI crawlers' },
  { name: 'llms-full.txt Generator', url_template: 'https://{DOMAIN}/llms-full.txt', category: 'llm_indexing', description: 'Full content file for LLM training' },

  // Schema.org structured data (helps LLMs understand content)
  { name: 'Schema.org Validator', url_template: 'https://validator.schema.org/?url={URL}', category: 'llm_indexing' },
  { name: 'Google Rich Results', url_template: 'https://search.google.com/test/rich-results?url={URL}', category: 'llm_indexing' },

  // Social proof signals LLMs use to evaluate trustworthiness
  { name: 'Crunchbase', url_template: 'https://www.crunchbase.com/discover/organization.companies/{DOMAIN}', category: 'llm_indexing' },
  { name: 'G2', url_template: 'https://www.g2.com/search?query={DOMAIN}', category: 'llm_indexing' },
  { name: 'Capterra', url_template: 'https://www.capterra.com/search/?search={DOMAIN}', category: 'llm_indexing' },
  { name: 'TrustPilot', url_template: 'https://www.trustpilot.com/review/{DOMAIN}', category: 'llm_indexing' },
  { name: 'ProductHunt', url_template: 'https://www.producthunt.com/search?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'AlternativeTo', url_template: 'https://alternativeto.net/software/{DOMAIN}/', category: 'llm_indexing' },

  // Wikipedia & knowledge bases (high authority for LLMs)
  { name: 'Wikipedia Search', url_template: 'https://en.wikipedia.org/w/index.php?search={DOMAIN}', category: 'llm_indexing' },
  { name: 'Wikidata Search', url_template: 'https://www.wikidata.org/w/index.php?search={DOMAIN}', category: 'llm_indexing' },
  { name: 'DBpedia Lookup', url_template: 'https://lookup.dbpedia.org/api/search?query={DOMAIN}', category: 'llm_indexing' },

  // Developer & tech references (LLMs heavily trained on these)
  { name: 'GitHub Search', url_template: 'https://github.com/search?q={DOMAIN}&type=repositories', category: 'llm_indexing' },
  { name: 'StackOverflow Search', url_template: 'https://stackoverflow.com/search?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'NPM Search', url_template: 'https://www.npmjs.com/search?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'PyPI Search', url_template: 'https://pypi.org/search/?q={DOMAIN}', category: 'llm_indexing' },

  // News & content aggregators (LLMs use for real-time info)
  { name: 'Google News', url_template: 'https://news.google.com/search?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'Bing News', url_template: 'https://www.bing.com/news/search?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'Google Scholar', url_template: 'https://scholar.google.com/scholar?q={DOMAIN}', category: 'llm_indexing' },

  // AI-specific directories
  { name: 'There Is An AI', url_template: 'https://theresanaiforthat.com/search/?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'Futurepedia', url_template: 'https://www.futurepedia.io/search?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'AI Tool Directory', url_template: 'https://aitoolsdirectory.com/?s={DOMAIN}', category: 'llm_indexing' },

  // Q&A platforms (LLMs use for context)
  { name: 'Quora Search', url_template: 'https://www.quora.com/search?q={DOMAIN}', category: 'llm_indexing' },
  { name: 'Reddit Search', url_template: 'https://www.reddit.com/search/?q={DOMAIN}', category: 'llm_indexing' },
];

export async function submitToLLMEngines(projectId: string, maxPlatforms?: number): Promise<{
  results: Array<{ engine: string; status: string; method: string }>;
}> {
  const { rows: [project] } = await pool.query(
    'SELECT domain, indexnow_key FROM indexer_projects WHERE id = $1',
    [projectId]
  );
  if (!project) throw new Error('Project not found');

  const domain = project.domain;
  const url = `https://${domain}`;
  const results: Array<{ engine: string; status: string; method: string }> = [];

  // Tier-gate: only submit to the number of platforms allowed by the tier
  const endpointsToUse = maxPlatforms
    ? LLM_OPTIMIZATION_ENDPOINTS.slice(0, maxPlatforms)
    : LLM_OPTIMIZATION_ENDPOINTS;

  // Submit to LLM-relevant endpoints
  for (const endpoint of endpointsToUse) {
    try {
      const targetUrl = endpoint.url_template
        .replace(/{DOMAIN}/g, domain)
        .replace(/{URL}/g, encodeURIComponent(url));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });
      clearTimeout(timeout);

      const success = response.status >= 200 && response.status < 400;
      results.push({
        engine: endpoint.name,
        status: success ? 'submitted' : `HTTP ${response.status}`,
        method: 'web_presence',
      });

      // Save as backlink result (only if endpoint exists in DB, otherwise skip to avoid NOT NULL violation)
      if (success) {
        const epLookup = await pool.query('SELECT id FROM backlink_endpoints WHERE name = $1 LIMIT 1', [endpoint.name]);
        if (epLookup.rows.length > 0) {
          await pool.query(
            `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status)
             VALUES ($1, $2, $3, 'llm_indexing', $4, $5, 'submitted', $6)
             ON CONFLICT DO NOTHING`,
            [projectId, epLookup.rows[0].id, endpoint.name, url, targetUrl, response.status]
          );
        }
      }
    } catch (err) {
      results.push({
        engine: endpoint.name,
        status: `Error: ${err instanceof Error ? err.message : 'Failed'}`,
        method: 'web_presence',
      });
    }
  }

  // Log activity
  const succeeded = results.filter(r => r.status === 'submitted').length;
  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'llm_indexing', $2)`,
    [projectId, JSON.stringify({ total: results.length, succeeded, engines: LLM_SEARCH_ENGINES.map(e => e.name) })]
  );

  return { results };
}

export function getLLMEngineInfo(): typeof LLM_SEARCH_ENGINES {
  return LLM_SEARCH_ENGINES;
}

export async function checkLLMVisibility(domain: string): Promise<{
  checks: Array<{ platform: string; found: boolean; url: string }>;
}> {
  const checks: Array<{ platform: string; found: boolean; url: string }> = [];

  const platforms = [
    { name: 'llms.txt', url: `https://${domain}/llms.txt` },
    { name: 'llms-full.txt', url: `https://${domain}/llms-full.txt` },
    { name: 'robots.txt AI rules', url: `https://${domain}/robots.txt` },
    { name: 'sitemap.xml', url: `https://${domain}/sitemap.xml` },
    { name: 'Schema.org JSON-LD', url: `https://${domain}` },
  ];

  for (const platform of platforms) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(platform.url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      clearTimeout(timeout);

      let found = response.status === 200;

      // Special check for robots.txt AI rules
      if (platform.name === 'robots.txt AI rules' && found) {
        const text = await response.text();
        found = /GPTBot|ChatGPT-User|Anthropic|Claude|Google-Extended|PerplexityBot/i.test(text);
      }

      // Special check for JSON-LD
      if (platform.name === 'Schema.org JSON-LD' && found) {
        const html = await response.text();
        found = html.includes('application/ld+json');
      }

      checks.push({ platform: platform.name, found, url: platform.url });
    } catch {
      checks.push({ platform: platform.name, found: false, url: platform.url });
    }
  }

  return { checks };
}
