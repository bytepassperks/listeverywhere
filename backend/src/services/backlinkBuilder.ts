import { pool } from '../db/pool';

export async function seedBacklinkEndpoints(): Promise<number> {
  const endpoints = [
    // WHOIS & DNS Lookup sites
    { name: 'Who.is Lookup', url_template: 'https://who.is/whois/{DOMAIN}', category: 'whois' },
    { name: 'WhoisRequest', url_template: 'https://whoisrequest.com/whois/{DOMAIN}', category: 'whois' },
    { name: 'ICANN WHOIS', url_template: 'https://lookup.icann.org/en/lookup?name={DOMAIN}', category: 'whois' },
    { name: 'DomainTools', url_template: 'https://whois.domaintools.com/{DOMAIN}', category: 'whois' },
    { name: 'Whois.com', url_template: 'https://www.whois.com/whois/{DOMAIN}', category: 'whois' },
    { name: 'DomainBigData', url_template: 'https://domainbigdata.com/{DOMAIN}', category: 'whois' },
    { name: 'Whoxy', url_template: 'https://www.whoxy.com/{DOMAIN}', category: 'whois' },
    { name: 'WhoisXML', url_template: 'https://dns-lookup.whoisxmlapi.com/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS', url_template: 'https://viewdns.info/whois/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSlytics', url_template: 'https://dnslytics.com/domain/{DOMAIN}', category: 'dns_lookup' },
    { name: 'SecurityTrails', url_template: 'https://securitytrails.com/domain/{DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSdumpster', url_template: 'https://dnsdumpster.com/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'MXToolbox DNS', url_template: 'https://mxtoolbox.com/SuperTool.aspx?action=dns:{DOMAIN}', category: 'dns_lookup' },
    { name: 'IntoDNS', url_template: 'https://intodns.com/{DOMAIN}', category: 'dns_lookup' },

    // SEO Analyzers
    { name: 'Nibbler', url_template: 'https://nibbler.insites.com/en/reports/{DOMAIN}', category: 'seo_analyzer' },
    { name: 'SEOptimer', url_template: 'https://www.seoptimer.com/{DOMAIN}', category: 'seo_analyzer' },
    { name: 'SiteChecker', url_template: 'https://sitechecker.pro/app/main/project?input={URL}', category: 'seo_analyzer' },
    { name: 'SEOSiteCheckup', url_template: 'https://seositecheckup.com/analysis/{URL}', category: 'seo_analyzer' },
    { name: 'WooRank', url_template: 'https://www.woorank.com/en/teaser/{DOMAIN}', category: 'seo_analyzer' },
    { name: 'Ahrefs Free Checker', url_template: 'https://ahrefs.com/website-authority-checker/?input={DOMAIN}', category: 'seo_analyzer' },
    { name: 'Neil Patel SEO', url_template: 'https://neilpatel.com/seo-analyzer/result/?url={URL}', category: 'seo_analyzer' },
    { name: 'WebPageTest', url_template: 'https://www.webpagetest.org/?url={URL}', category: 'speed_test' },
    { name: 'GTmetrix', url_template: 'https://gtmetrix.com/?url={URL}', category: 'speed_test' },
    { name: 'PageSpeed Insights', url_template: 'https://pagespeed.web.dev/analysis?url={URL}', category: 'speed_test' },
    { name: 'Pingdom', url_template: 'https://tools.pingdom.com/#!{URL}', category: 'speed_test' },
    { name: 'Uptrends Speed', url_template: 'https://www.uptrends.com/tools/website-speed-test?url={URL}', category: 'speed_test' },

    // Security Scanners
    { name: 'SSL Labs', url_template: 'https://www.ssllabs.com/ssltest/analyze.html?d={DOMAIN}', category: 'security_scan' },
    { name: 'SecurityHeaders', url_template: 'https://securityheaders.com/?q={URL}&followRedirects=on', category: 'security_scan' },
    { name: 'Mozilla Observatory', url_template: 'https://observatory.mozilla.org/analyze/{DOMAIN}', category: 'security_scan' },
    { name: 'VirusTotal', url_template: 'https://www.virustotal.com/gui/domain/{DOMAIN}', category: 'security_scan' },
    { name: 'Sucuri SiteCheck', url_template: 'https://sitecheck.sucuri.net/results/{URL}', category: 'security_scan' },
    { name: 'URLVoid', url_template: 'https://www.urlvoid.com/scan/{DOMAIN}/', category: 'security_scan' },

    // Web Archives
    { name: 'Wayback Machine', url_template: 'https://web.archive.org/web/{URL}', category: 'web_archive' },
    { name: 'Archive.today', url_template: 'https://archive.ph/?url={URL}', category: 'web_archive' },
    { name: 'Google Cache', url_template: 'https://webcache.googleusercontent.com/search?q=cache:{URL}', category: 'web_archive' },
    { name: 'CachedView', url_template: 'https://cachedview.nl/#{URL}', category: 'web_archive' },

    // Website Info & Stats
    { name: 'SimilarWeb', url_template: 'https://www.similarweb.com/website/{DOMAIN}/', category: 'website_info' },
    { name: 'BuiltWith', url_template: 'https://builtwith.com/{DOMAIN}', category: 'website_info' },
    { name: 'W3Techs', url_template: 'https://w3techs.com/sites/info/{DOMAIN}', category: 'website_info' },
    { name: 'Netcraft', url_template: 'https://sitereport.netcraft.com/?url={URL}', category: 'website_info' },
    { name: 'Wappalyzer', url_template: 'https://www.wappalyzer.com/lookup/{DOMAIN}/', category: 'website_info' },
    { name: 'HypeStat', url_template: 'https://hypestat.com/info/{DOMAIN}', category: 'website_info' },
    { name: 'StatShow', url_template: 'https://www.statshow.com/www/{DOMAIN}', category: 'website_info' },
    { name: 'Alexa (Web Archive)', url_template: 'https://web.archive.org/web/2022/https://www.alexa.com/siteinfo/{DOMAIN}', category: 'website_info' },
    { name: 'SitePriceChecker', url_template: 'https://www.siteprice.org/website-worth/{DOMAIN}', category: 'website_info' },
    { name: 'WorthOfWeb', url_template: 'https://www.worthofweb.com/website-value/{DOMAIN}/', category: 'website_info' },
    { name: 'WebsiteOutlook', url_template: 'https://www.websiteoutlook.com/{DOMAIN}', category: 'website_info' },
    { name: 'Cutestat', url_template: 'https://www.cutestat.com/{DOMAIN}', category: 'website_info' },
    { name: 'Statvoo', url_template: 'https://statvoo.com/website/{DOMAIN}', category: 'website_info' },

    // Ping Services
    { name: 'Google Ping', url_template: 'https://www.google.com/ping?sitemap={URL}', category: 'ping_service' },
    { name: 'Bing Ping', url_template: 'https://www.bing.com/ping?sitemap={URL}', category: 'ping_service' },
    { name: 'Pingomatic', url_template: 'http://pingomatic.com/ping/?title=Page&blogurl={URL}&rssurl=&chk_weblogscom=on&chk_blogs=on&chk_feedburner=on&chk_newsgator=on&chk_myyahoo=on&chk_pubsubcom=on&chk_blogdigger=on&chk_weblogalot=on&chk_newsisfree=on&chk_topicexchange=on&chk_google=on&chk_tailrank=on&chk_bloglines=on&chk_postrank=on&chk_skygrid=on&chk_collecta=on&chk_superfeedr=on', category: 'ping_service' },
    { name: 'Twingly Ping', url_template: 'https://rpc.twingly.com/ping', category: 'ping_service' },
    { name: 'FeedBurner Ping', url_template: 'https://feedburner.google.com/fb/a/pingSubmit?bloglink={URL}', category: 'ping_service' },

    // Social Bookmarks
    { name: 'Reddit Submit', url_template: 'https://www.reddit.com/submit?url={URL}', category: 'social_bookmark' },
    { name: 'Pinterest Pin', url_template: 'https://www.pinterest.com/pin/create/button/?url={URL}', category: 'social_bookmark' },
    { name: 'LinkedIn Share', url_template: 'https://www.linkedin.com/sharing/share-offsite/?url={URL}', category: 'social_bookmark' },
    { name: 'Facebook Share', url_template: 'https://www.facebook.com/sharer/sharer.php?u={URL}', category: 'social_bookmark' },
    { name: 'Twitter Share', url_template: 'https://twitter.com/intent/tweet?url={URL}', category: 'social_bookmark' },
    { name: 'Tumblr Share', url_template: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={URL}', category: 'social_bookmark' },
    { name: 'Pocket Save', url_template: 'https://getpocket.com/save?url={URL}', category: 'social_bookmark' },
    { name: 'Mix (StumbleUpon)', url_template: 'https://mix.com/add?url={URL}', category: 'social_bookmark' },
    { name: 'Diigo Bookmark', url_template: 'https://www.diigo.com/post?url={URL}', category: 'social_bookmark' },
    { name: 'Flipboard', url_template: 'https://share.flipboard.com/bookmarklet/popout?v=2&url={URL}', category: 'social_bookmark' },
    { name: 'Blogger Post', url_template: 'https://www.blogger.com/blog-this.g?u={URL}', category: 'social_bookmark' },
    { name: 'WordPress Press This', url_template: 'https://wordpress.com/press-this.php?u={URL}', category: 'social_bookmark' },
    { name: 'Evernote Clip', url_template: 'https://www.evernote.com/clip.action?url={URL}', category: 'social_bookmark' },
    { name: 'Buffer Share', url_template: 'https://bufferapp.com/add?url={URL}', category: 'social_bookmark' },
    { name: 'HackerNews', url_template: 'https://news.ycombinator.com/submitlink?u={URL}', category: 'social_bookmark' },
    { name: 'Slashdot', url_template: 'https://slashdot.org/bookmark.pl?url={URL}', category: 'social_bookmark' },
  ];

  let seeded = 0;
  for (const ep of endpoints) {
    try {
      const result = await pool.query(
        `INSERT INTO backlink_endpoints (name, url_template, category, active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [ep.name, ep.url_template, ep.category]
      );
      if (result.rowCount && result.rowCount > 0) seeded++;
    } catch {
      // skip
    }
  }

  return seeded;
}

export async function buildBacklinks(
  projectId: string,
  targetUrl: string,
  domain: string,
  categories?: string[]
): Promise<{ submitted: number; errors: string[] }> {
  let query = 'SELECT id, name, url_template, category FROM backlink_endpoints WHERE active = true';
  const params: (string | string[])[] = [];

  if (categories && categories.length > 0) {
    params.push(categories);
    query += ` AND category = ANY($${params.length})`;
  }

  const result = await pool.query(query, params);
  const endpoints = result.rows;

  let submitted = 0;
  const errors: string[] = [];
  const batchSize = 10;

  for (let i = 0; i < endpoints.length; i += batchSize) {
    const batch = endpoints.slice(i, i + batchSize);

    const promises = batch.map(async (ep: { id: string; name: string; url_template: string; category: string }) => {
      const resolvedUrl = ep.url_template
        .replace(/{URL}/g, encodeURIComponent(targetUrl))
        .replace(/{DOMAIN}/g, domain);

      try {
        const response = await fetch(resolvedUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(10000),
          redirect: 'follow',
        });

        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, target_url, backlink_url, status, http_status)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT DO NOTHING`,
          [projectId, ep.id, targetUrl, resolvedUrl, response.ok ? 'submitted' : 'error', response.status]
        );

        if (response.ok || response.status === 301 || response.status === 302 || response.status === 403) {
          submitted++;
        } else {
          errors.push(`${ep.name}: HTTP ${response.status}`);
        }
      } catch (err) {
        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, target_url, backlink_url, status, http_status)
           VALUES ($1, $2, $3, $4, 'error', 0)
           ON CONFLICT DO NOTHING`,
          [projectId, ep.id, targetUrl, resolvedUrl]
        );
        errors.push(`${ep.name}: ${err instanceof Error ? err.message : 'failed'}`);
      }
    });

    await Promise.all(promises);
  }

  // Log activity
  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'backlink_build', $2)`,
    [projectId, JSON.stringify({ target_url: targetUrl, total_endpoints: endpoints.length, submitted, errors_count: errors.length })]
  );

  return { submitted, errors: errors.slice(0, 20) };
}

export async function getBacklinkStats(projectId: string): Promise<{
  total: number;
  submitted: number;
  verified: number;
  dead: number;
  byCategory: Record<string, number>;
}> {
  const statsResult = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE br.status = 'submitted') as submitted,
       COUNT(*) FILTER (WHERE br.status = 'verified') as verified,
       COUNT(*) FILTER (WHERE br.status = 'dead') as dead
     FROM backlink_results br
     WHERE br.project_id = $1`,
    [projectId]
  );

  const byCategoryResult = await pool.query(
    `SELECT be.category, COUNT(*) as count
     FROM backlink_results br
     JOIN backlink_endpoints be ON br.endpoint_id = be.id
     WHERE br.project_id = $1 AND br.status IN ('submitted', 'verified')
     GROUP BY be.category`,
    [projectId]
  );

  const byCategory: Record<string, number> = {};
  for (const row of byCategoryResult.rows) {
    byCategory[row.category] = parseInt(row.count);
  }

  const stats = statsResult.rows[0];
  return {
    total: parseInt(stats.total),
    submitted: parseInt(stats.submitted),
    verified: parseInt(stats.verified),
    dead: parseInt(stats.dead),
    byCategory,
  };
}
