export interface MetaTagsResult {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical: string;
  robots: string;
  viewport: string;
  charset: string;
  favicon: string;
  h1: string[];
  h2: string[];
  wordCount: number;
  imageCount: number;
  linkCount: number;
  hasSSL: boolean;
  loadTimeMs: number;
  statusCode: number;
  contentLength: number;
  issues: string[];
  score: number;
}

export async function analyzeMetaTags(url: string): Promise<MetaTagsResult> {
  const startTime = Date.now();
  const issues: string[] = [];

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ListGenius-SEO-Analyzer/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });

    const loadTimeMs = Date.now() - startTime;
    const html = await response.text();
    const contentLength = html.length;

    const extract = (pattern: RegExp): string => {
      const match = html.match(pattern);
      return match ? match[1]?.trim() || '' : '';
    };

    const extractAll = (pattern: RegExp): string[] => {
      const matches: string[] = [];
      let m;
      const re = new RegExp(pattern.source, 'gi');
      while ((m = re.exec(html)) !== null) {
        if (m[1]) matches.push(m[1].trim().replace(/<[^>]*>/g, ''));
      }
      return matches;
    };

    const title = extract(/<title[^>]*>([^<]+)<\/title>/i);
    const description = extract(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
      || extract(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    const keywords = extract(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
    const ogTitle = extract(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
      || extract(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    const ogDescription = extract(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
      || extract(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    const ogImage = extract(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
      || extract(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    const ogUrl = extract(/<meta\s+property=["']og:url["']\s+content=["']([^"']+)["']/i);
    const ogType = extract(/<meta\s+property=["']og:type["']\s+content=["']([^"']+)["']/i);
    const twitterCard = extract(/<meta\s+name=["']twitter:card["']\s+content=["']([^"']+)["']/i);
    const twitterTitle = extract(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    const twitterDescription = extract(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
    const twitterImage = extract(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
    const canonical = extract(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
    const robots = extract(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
    const viewport = extract(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["']/i);
    const charset = extract(/<meta\s+charset=["']([^"']+)["']/i) || 'utf-8';
    const favicon = extract(/<link\s+rel=["'](?:shortcut )?icon["']\s+href=["']([^"']+)["']/i);
    const h1 = extractAll(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h2 = extractAll(/<h2[^>]*>([\s\S]*?)<\/h2>/i);

    const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

    const imageCount = (html.match(/<img\s/gi) || []).length;
    const linkCount = (html.match(/<a\s/gi) || []).length;
    const hasSSL = url.startsWith('https://');

    // Calculate score and issues
    let score = 100;

    if (!title) { issues.push('Missing title tag'); score -= 15; }
    else if (title.length < 30) { issues.push('Title too short (< 30 chars)'); score -= 5; }
    else if (title.length > 60) { issues.push('Title too long (> 60 chars)'); score -= 5; }

    if (!description) { issues.push('Missing meta description'); score -= 15; }
    else if (description.length < 120) { issues.push('Meta description too short (< 120 chars)'); score -= 5; }
    else if (description.length > 160) { issues.push('Meta description too long (> 160 chars)'); score -= 5; }

    if (!ogTitle) { issues.push('Missing Open Graph title'); score -= 5; }
    if (!ogDescription) { issues.push('Missing Open Graph description'); score -= 5; }
    if (!ogImage) { issues.push('Missing Open Graph image'); score -= 5; }
    if (!twitterCard) { issues.push('Missing Twitter card meta'); score -= 3; }
    if (!canonical) { issues.push('Missing canonical URL'); score -= 5; }
    if (!viewport) { issues.push('Missing viewport meta (not mobile-friendly)'); score -= 10; }
    if (!hasSSL) { issues.push('Not using HTTPS'); score -= 10; }
    if (h1.length === 0) { issues.push('Missing H1 tag'); score -= 10; }
    if (h1.length > 1) { issues.push('Multiple H1 tags found'); score -= 3; }
    if (loadTimeMs > 3000) { issues.push('Slow load time (> 3s)'); score -= 5; }
    if (wordCount < 300) { issues.push('Low word count (< 300 words)'); score -= 5; }
    if (!favicon) { issues.push('Missing favicon'); score -= 3; }

    return {
      title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, ogType,
      twitterCard, twitterTitle, twitterDescription, twitterImage,
      canonical, robots, viewport, charset, favicon,
      h1, h2, wordCount, imageCount, linkCount,
      hasSSL, loadTimeMs, statusCode: response.status, contentLength,
      issues, score: Math.max(0, score),
    };
  } catch (err) {
    return {
      title: '', description: '', keywords: '', ogTitle: '', ogDescription: '', ogImage: '',
      ogUrl: '', ogType: '', twitterCard: '', twitterTitle: '', twitterDescription: '',
      twitterImage: '', canonical: '', robots: '', viewport: '', charset: '', favicon: '',
      h1: [], h2: [], wordCount: 0, imageCount: 0, linkCount: 0,
      hasSSL: url.startsWith('https://'), loadTimeMs: Date.now() - startTime,
      statusCode: 0, contentLength: 0,
      issues: [`Failed to fetch: ${err instanceof Error ? err.message : 'Unknown error'}`],
      score: 0,
    };
  }
}

export async function checkGoogleIndex(url: string): Promise<{ indexed: boolean; status: string }> {
  try {
    const query = `site:${url}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=1`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return { indexed: false, status: 'check_failed' };

    const html = await response.text();

    if (html.includes('did not match any documents') || html.includes('did not return any results')) {
      return { indexed: false, status: 'not_indexed' };
    }

    const urlNormalized = url.replace('https://', '').replace('http://', '').replace('www.', '');
    if (html.includes(urlNormalized)) {
      return { indexed: true, status: 'indexed' };
    }

    return { indexed: false, status: 'uncertain' };
  } catch {
    return { indexed: false, status: 'check_failed' };
  }
}

export interface RobotsTxtResult {
  found: boolean;
  content: string;
  sitemaps: string[];
  disallowedPaths: string[];
  allowedPaths: string[];
  crawlDelay: number | null;
}

export async function analyzeRobotsTxt(domain: string): Promise<RobotsTxtResult> {
  try {
    const response = await fetch(`https://${domain}/robots.txt`, {
      headers: { 'User-Agent': 'ListGenius-SEO-Analyzer/1.0' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { found: false, content: '', sitemaps: [], disallowedPaths: [], allowedPaths: [], crawlDelay: null };
    }

    const content = await response.text();
    const sitemaps: string[] = [];
    const disallowedPaths: string[] = [];
    const allowedPaths: string[] = [];
    let crawlDelay: number | null = null;

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('sitemap:')) {
        sitemaps.push(trimmed.substring(8).trim());
      } else if (trimmed.toLowerCase().startsWith('disallow:')) {
        disallowedPaths.push(trimmed.substring(9).trim());
      } else if (trimmed.toLowerCase().startsWith('allow:')) {
        allowedPaths.push(trimmed.substring(6).trim());
      } else if (trimmed.toLowerCase().startsWith('crawl-delay:')) {
        crawlDelay = parseInt(trimmed.substring(12).trim()) || null;
      }
    }

    return { found: true, content, sitemaps, disallowedPaths, allowedPaths, crawlDelay };
  } catch {
    return { found: false, content: '', sitemaps: [], disallowedPaths: [], allowedPaths: [], crawlDelay: null };
  }
}
