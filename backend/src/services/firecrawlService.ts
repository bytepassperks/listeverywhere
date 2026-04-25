import { env } from '../config/env';

interface CrawlResult {
  success: boolean;
  data: CrawlPage[];
  error?: string;
}

interface CrawlPage {
  url: string;
  markdown: string;
  metadata?: {
    title?: string;
    description?: string;
    ogImage?: string;
    sourceURL?: string;
    url?: string;
    'og:image'?: string;
    [key: string]: unknown;
  };
}

interface CrawlStatusResponse {
  success: boolean;
  status: string;
  total: number;
  completed: number;
  data?: Record<string, unknown>[];
}

async function startCrawl(url: string, limit: number = 10): Promise<string> {
  const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      limit,
      scrapeOptions: {
        formats: ['markdown'],
        includeTags: ['main', 'article', 'section', 'header', 'footer', 'nav', 'h1', 'h2', 'h3', 'p', 'ul', 'ol', 'a', 'img', 'meta'],
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Firecrawl crawl start failed: ${response.status} - ${err}`);
  }

  const data = await response.json() as { success: boolean; id: string };
  if (!data.success || !data.id) {
    throw new Error('Firecrawl did not return a crawl ID');
  }

  return data.id;
}

async function pollCrawlStatus(crawlId: string, maxWaitMs: number = 300000): Promise<CrawlPage[]> {
  const startTime = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: {
        'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Firecrawl status check failed: ${response.status}`);
    }

    const status = await response.json() as CrawlStatusResponse;
    console.log(`[FIRECRAWL] Poll status: ${status.status}, total: ${status.total}, completed: ${status.completed}, data length: ${status.data?.length || 0}`);

    if (status.status === 'completed' && status.data) {
      const mappedPages: CrawlPage[] = status.data.map((page: Record<string, unknown>) => {
        const meta = (page.metadata || {}) as Record<string, unknown>;
        const pageUrl = (page.url as string) || (meta.sourceURL as string) || (meta.url as string) || (meta.ogUrl as string) || '';
        return {
          url: pageUrl,
          markdown: (page.markdown as string) || '',
          metadata: meta as CrawlPage['metadata'],
        };
      });
      console.log(`[FIRECRAWL] Mapped ${mappedPages.length} pages, first URL: ${mappedPages[0]?.url || 'N/A'}`);
      return mappedPages;
    }

    if (status.status === 'failed') {
      throw new Error('Firecrawl crawl failed');
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Firecrawl crawl timed out');
}

function categorizePages(pages: CrawlPage[]): {
  homepage: CrawlPage | null;
  about: CrawlPage | null;
  pricing: CrawlPage | null;
  features: CrawlPage | null;
  contact: CrawlPage | null;
  other: CrawlPage[];
} {
  const result = {
    homepage: null as CrawlPage | null,
    about: null as CrawlPage | null,
    pricing: null as CrawlPage | null,
    features: null as CrawlPage | null,
    contact: null as CrawlPage | null,
    other: [] as CrawlPage[],
  };

  for (const page of pages) {
    if (!page.url) {
      result.other.push(page);
      continue;
    }
    const urlLower = page.url.toLowerCase();
    let pathPart: string;
    try {
      pathPart = new URL(urlLower).pathname;
    } catch {
      result.other.push(page);
      continue;
    }

    if (pathPart === '/' || pathPart === '') {
      result.homepage = page;
    } else if (pathPart.includes('about') || pathPart.includes('story') || pathPart.includes('team')) {
      result.about = page;
    } else if (pathPart.includes('pricing') || pathPart.includes('plans')) {
      result.pricing = page;
    } else if (pathPart.includes('features') || pathPart.includes('product')) {
      result.features = page;
    } else if (pathPart.includes('contact') || pathPart.includes('support')) {
      result.contact = page;
    } else {
      result.other.push(page);
    }
  }

  return result;
}

export async function crawlCompanySite(url: string): Promise<CrawlResult> {
  try {
    if (!env.FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not configured');
    }

    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
    const crawlId = await startCrawl(normalizedUrl, 15);
    const pages = await pollCrawlStatus(crawlId);

    if (!pages || pages.length === 0) {
      throw new Error('No pages were crawled');
    }

    const validPages = pages.filter(p => p.url && p.markdown);
    if (validPages.length === 0) {
      throw new Error('No valid pages with URLs were crawled');
    }

    const categorized = categorizePages(validPages);

    const combinedMarkdown = [
      categorized.homepage ? `# HOMEPAGE\n${categorized.homepage.markdown}` : '',
      categorized.about ? `\n# ABOUT PAGE\n${categorized.about.markdown}` : '',
      categorized.pricing ? `\n# PRICING PAGE\n${categorized.pricing.markdown}` : '',
      categorized.features ? `\n# FEATURES PAGE\n${categorized.features.markdown}` : '',
      categorized.contact ? `\n# CONTACT PAGE\n${categorized.contact.markdown}` : '',
      ...categorized.other.slice(0, 3).map((p, i) => `\n# OTHER PAGE ${i + 1} (${p.url})\n${p.markdown}`),
    ].filter(Boolean).join('\n\n---\n\n');

    return {
      success: true,
      data: validPages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown crawl error';
    return {
      success: false,
      data: [],
      error: message,
    };
  }
}

export function buildCrawlMarkdown(pages: CrawlPage[]): string {
  const categorized = categorizePages(pages);

  return [
    categorized.homepage ? `# HOMEPAGE\nURL: ${categorized.homepage.url}\n${categorized.homepage.markdown}` : '',
    categorized.about ? `\n# ABOUT PAGE\nURL: ${categorized.about.url}\n${categorized.about.markdown}` : '',
    categorized.pricing ? `\n# PRICING PAGE\nURL: ${categorized.pricing.url}\n${categorized.pricing.markdown}` : '',
    categorized.features ? `\n# FEATURES PAGE\nURL: ${categorized.features.url}\n${categorized.features.markdown}` : '',
    categorized.contact ? `\n# CONTACT PAGE\nURL: ${categorized.contact.url}\n${categorized.contact.markdown}` : '',
    ...categorized.other.slice(0, 3).map((p, i) => `\n# OTHER PAGE ${i + 1}\nURL: ${p.url}\n${p.markdown}`),
  ].filter(Boolean).join('\n\n---\n\n');
}

export function extractMetaFromPages(pages: CrawlPage[]): {
  title?: string;
  description?: string;
  ogImage?: string;
} {
  const homepage = pages.find(p => {
    if (!p.url) return false;
    try {
      const path = new URL(p.url).pathname;
      return path === '/' || path === '';
    } catch {
      return false;
    }
  });

  return {
    title: homepage?.metadata?.title as string | undefined,
    description: homepage?.metadata?.description as string | undefined,
    ogImage: (homepage?.metadata?.ogImage || homepage?.metadata?.['og:image']) as string | undefined,
  };
}
