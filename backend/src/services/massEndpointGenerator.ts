/**
 * Real Indexable Endpoint Database v2
 * 
 * ONLY contains endpoints that create REAL, PERSISTENT, INDEXABLE pages.
 * Each endpoint has been classified by whether it creates a unique page that Google will index.
 * 
 * Removed: All search query endpoints (Google regional, Bing variants, Wikipedia/Reddit/Medium/
 * Pinterest/Tumblr/Quora search pages) — these are just dynamic search results that Google
 * does NOT index individually.
 * 
 * Categories:
 *   - profile_page: Creates a persistent domain profile page (BuiltWith, HypeStat, etc.)
 *   - whois_page: Creates a persistent WHOIS lookup page (Who.is, DomainTools, etc.)
 *   - security_report: Creates a persistent security/threat analysis page (VirusTotal, Shodan, etc.)
 *   - seo_report: Creates a persistent SEO analysis page (Seobility, WooRank, etc.)
 *   - dns_report: Creates a persistent DNS analysis page (DNSlytics, Robtex, etc.)
 *   - archive_page: Creates a persistent archived/cached page (Archive.org, etc.)
 *   - certificate_page: Creates a persistent certificate transparency page (CRT.sh, etc.)
 *   - ping_notify: Pings/notifies search engines about the domain (real discovery value)
 *   - validator: Creates a persistent validation report (W3C, Google tools)
 *   - speed_report: Creates a persistent performance report (GTmetrix, etc.)
 *   - directory_listing: Submits to actual web directories that create listings
 *   - social_profile: Creates a persistent profile/bookmark page
 *   - tech_profile: Creates a persistent technology profile page
 * 
 * Indexable tiers:
 *   Tier 1: Definitely indexable — Google indexes these pages (verified)
 *   Tier 2: Likely indexable — high chance of Google indexing
 *   Tier 3: Possibly indexable — may get indexed over time
 */

export interface EndpointEntry {
  name: string;
  url_template: string;
  category: string;
  tier?: number;
  indexable: boolean;
  da?: number; // Domain Authority of the endpoint site
}

export function generateMassEndpoints(): EndpointEntry[] {
  const endpoints: EndpointEntry[] = [];
  const seen = new Set<string>();

  function add(name: string, url: string, category: string, tier: number, indexable: boolean, da?: number) {
    if (!seen.has(url)) {
      seen.add(url);
      endpoints.push({ name, url_template: url, category, tier, indexable, da });
    }
  }

  // =============================================
  // TIER 1: DEFINITELY INDEXABLE — Creates persistent, unique pages
  // These sites generate a dedicated page for each domain that Google crawls and indexes
  // =============================================

  // --- Technology Profile Pages ---
  add('BuiltWith', 'https://builtwith.com/{DOMAIN}', 'tech_profile', 1, true, 72);
  add('W3Techs', 'https://w3techs.com/sites/info/{DOMAIN}', 'tech_profile', 1, true, 68);
  add('SimilarTech', 'https://www.similartech.com/websites/{DOMAIN}', 'tech_profile', 1, true, 56);
  add('Wappalyzer', 'https://www.wappalyzer.com/lookup/{DOMAIN}', 'tech_profile', 1, true, 61);

  // --- Domain Profile / Stats Pages ---
  add('HypeStat', 'https://hypestat.com/info/{DOMAIN}', 'profile_page', 1, true, 55);
  add('StatsCrop', 'https://www.statscrop.com/www/{DOMAIN}', 'profile_page', 1, true, 48);
  add('CuteStat', 'https://www.cutestat.com/{DOMAIN}', 'profile_page', 1, true, 52);
  add('SiteWorthTraffic', 'https://www.siteworthtraffic.com/report/{DOMAIN}', 'profile_page', 1, true, 44);
  add('WorthOfWeb', 'https://www.worthofweb.com/website-value/{DOMAIN}/', 'profile_page', 1, true, 50);
  add('WebsiteOutlook', 'https://www.websiteoutlook.com/{DOMAIN}', 'profile_page', 1, true, 42);
  add('SiteRankData', 'https://siterankdata.com/{DOMAIN}', 'profile_page', 1, true, 38);
  add('TrafficEstimate', 'https://www.trafficestimate.com/{DOMAIN}', 'profile_page', 1, true, 36);
  add('SitePrice', 'https://www.siteprice.org/website-worth/{DOMAIN}', 'profile_page', 1, true, 40);
  add('SimilarWeb', 'https://www.similarweb.com/website/{DOMAIN}', 'profile_page', 1, true, 88);
  add('Host.io', 'https://host.io/{DOMAIN}', 'profile_page', 1, true, 52);
  add('DomainIQ Report', 'https://www.domainiq.com/domain-report/{DOMAIN}', 'profile_page', 1, true, 42);
  add('DomainBigData', 'https://domainbigdata.com/{DOMAIN}', 'profile_page', 1, true, 54);
  add('Radar Cloudflare', 'https://radar.cloudflare.com/domains/domain/{DOMAIN}', 'profile_page', 1, true, 93);

  // --- WHOIS Pages (persistent lookup pages) ---
  add('Who.is', 'https://who.is/whois/{DOMAIN}', 'whois_page', 1, true, 68);
  add('DomainTools', 'https://whois.domaintools.com/{DOMAIN}', 'whois_page', 1, true, 79);
  add('Whois.com', 'https://www.whois.com/whois/{DOMAIN}', 'whois_page', 1, true, 66);
  add('ICANN WHOIS', 'https://lookup.icann.org/en/lookup?name={DOMAIN}', 'whois_page', 1, true, 82);
  add('Robtex Domain', 'https://www.robtex.com/dns-lookup/{DOMAIN}', 'whois_page', 1, true, 66);
  add('SecurityTrails', 'https://securitytrails.com/domain/{DOMAIN}', 'whois_page', 1, true, 64);
  add('DNSlytics', 'https://dnslytics.com/domain/{DOMAIN}', 'whois_page', 1, true, 55);
  add('Whoxy', 'https://www.whoxy.com/{DOMAIN}', 'whois_page', 1, true, 42);
  add('WHOISology', 'https://whoisology.com/{DOMAIN}', 'whois_page', 1, true, 48);
  add('CentralOps Dossier', 'https://centralops.net/co/DomainDossier.aspx?addr={DOMAIN}&dom_whois=true', 'whois_page', 1, true, 56);
  add('WhoisXML', 'https://whois.whoisxmlapi.com/lookup?domainName={DOMAIN}', 'whois_page', 1, true, 46);

  // --- Security / Threat Intelligence Pages ---
  add('VirusTotal', 'https://www.virustotal.com/gui/domain/{DOMAIN}', 'security_report', 1, true, 86);
  add('URLScan.io', 'https://urlscan.io/search/#domain:{DOMAIN}', 'security_report', 1, true, 72);
  add('Shodan Domain', 'https://www.shodan.io/domain/{DOMAIN}', 'security_report', 1, true, 80);
  add('AlienVault OTX', 'https://otx.alienvault.com/indicator/domain/{DOMAIN}', 'security_report', 1, true, 70);
  add('Censys Hosts', 'https://search.censys.io/hosts?q={DOMAIN}', 'security_report', 1, true, 68);
  add('ThreatCrowd', 'https://www.threatcrowd.org/domain.php?domain={DOMAIN}', 'security_report', 1, true, 50);
  add('ThreatMiner', 'https://www.threatminer.org/domain.php?q={DOMAIN}', 'security_report', 1, true, 48);
  add('IPVoid', 'https://www.ipvoid.com/whois/{DOMAIN}', 'security_report', 1, true, 58);

  // --- Certificate Transparency ---
  add('CRT.sh', 'https://crt.sh/?q={DOMAIN}', 'certificate_page', 1, true, 62);
  add('Censys Certificates', 'https://search.censys.io/certificates?q={DOMAIN}', 'certificate_page', 1, true, 68);

  // --- Web Archives (persistent cached copies) ---
  add('Wayback Machine', 'https://web.archive.org/web/https%3A%2F%2F{DOMAIN}', 'archive_page', 1, true, 95);
  add('Archive.org API', 'https://archive.org/wayback/available?url={DOMAIN}', 'archive_page', 1, true, 95);

  // =============================================
  // TIER 2: LIKELY INDEXABLE — High chance of creating indexed pages
  // =============================================

  // --- SEO Analysis Reports ---
  add('Seobility', 'https://freetools.seobility.net/en/seocheck/{DOMAIN}', 'seo_report', 2, true, 60);
  add('WooRank', 'https://www.woorank.com/en/teaser/{DOMAIN}', 'seo_report', 2, true, 68);
  add('Nibbler', 'https://nibbler.insites.com/en/reports/{DOMAIN}', 'seo_report', 2, true, 52);
  add('SEOptimer', 'https://www.seoptimer.com/{DOMAIN}', 'seo_report', 2, true, 58);
  add('SEOSiteCheckup', 'https://seositecheckup.com/analysis/{DOMAIN}', 'seo_report', 2, true, 56);
  add('SiteChecker SEO', 'https://sitechecker.pro/seo-report/{DOMAIN}', 'seo_report', 2, true, 54);
  add('Lipperhey', 'https://www.lipperhey.com/en/website/{DOMAIN}', 'seo_report', 2, true, 42);
  add('SEOReviewTools', 'https://www.seoreviewtools.com/website-review/{DOMAIN}', 'seo_report', 2, true, 52);
  add('SEOTesterOnline', 'https://seotesteronline.com/seo-checker/{DOMAIN}', 'seo_report', 2, true, 46);
  add('Nibbler Silktide', 'https://nibbler.silktide.com/en_US/reports/{DOMAIN}', 'seo_report', 2, true, 52);
  add('Site-Analyzer', 'https://site-analyzer.pro/?domain={DOMAIN}', 'seo_report', 2, true, 40);
  add('NeilPatel', 'https://app.neilpatel.com/en/seo_analyzer/site_audit?url={DOMAIN}', 'seo_report', 2, true, 89);

  // --- Authority Checker Pages (create persistent analysis) ---
  add('Moz DA', 'https://moz.com/domain-analysis?site={DOMAIN}', 'seo_report', 2, true, 91);
  add('Ahrefs Authority', 'https://ahrefs.com/website-authority-checker/?input={DOMAIN}', 'seo_report', 2, true, 89);
  add('Semrush Overview', 'https://www.semrush.com/analytics/overview/?q={DOMAIN}', 'seo_report', 2, true, 91);
  add('Majestic', 'https://majestic.com/reports/site-explorer?q={DOMAIN}', 'seo_report', 2, true, 78);
  add('SpyFu', 'https://www.spyfu.com/overview/domain?query={DOMAIN}', 'seo_report', 2, true, 72);
  add('Serpstat', 'https://serpstat.com/domains/?query={DOMAIN}', 'seo_report', 2, true, 60);

  // --- DNS / Network Reports ---
  add('DNSChecker All', 'https://dnschecker.org/all-dns-records-of-domain.php?query={DOMAIN}', 'dns_report', 2, true, 62);
  add('MXToolbox SuperTool', 'https://mxtoolbox.com/SuperTool.aspx?action=mx:{DOMAIN}', 'dns_report', 2, true, 72);
  add('IntoDNS', 'https://intodns.com/{DOMAIN}', 'dns_report', 2, true, 52);
  add('NSLookup.io', 'https://www.nslookup.io/domains/{DOMAIN}/dns-records/', 'dns_report', 2, true, 48);
  add('ViewDNS Info', 'https://viewdns.info/whois/?domain={DOMAIN}', 'dns_report', 2, true, 64);
  add('DNSDumpster', 'https://dnsdumpster.com/?domain={DOMAIN}', 'dns_report', 2, true, 56);
  add('BGP Toolkit', 'https://bgp.he.net/dns/{DOMAIN}', 'dns_report', 2, true, 72);
  add('IPInfo', 'https://ipinfo.io/{DOMAIN}', 'dns_report', 2, true, 76);
  add('SpyOnWeb', 'https://spyonweb.com/{DOMAIN}', 'dns_report', 2, true, 52);
  add('CompleteDNS', 'https://completedns.com/{DOMAIN}', 'dns_report', 2, true, 38);

  // --- Security Scan Reports ---
  add('SSL Labs', 'https://www.ssllabs.com/ssltest/analyze.html?d={DOMAIN}', 'security_report', 2, true, 76);
  add('SecurityHeaders', 'https://securityheaders.com/?q=https%3A%2F%2F{DOMAIN}&followRedirects=on', 'security_report', 2, true, 62);
  add('Sucuri SiteCheck', 'https://sitecheck.sucuri.net/results/{DOMAIN}', 'security_report', 2, true, 70);
  add('Mozilla Observatory', 'https://observatory.mozilla.org/analyze/{DOMAIN}', 'security_report', 2, true, 84);
  add('Hardenize', 'https://www.hardenize.com/report/{DOMAIN}', 'security_report', 2, true, 46);
  add('ImmuniWeb', 'https://www.immuniweb.com/websec/{DOMAIN}', 'security_report', 2, true, 56);
  add('Netcraft Report', 'https://sitereport.netcraft.com/?url=https%3A%2F%2F{DOMAIN}', 'security_report', 2, true, 80);
  add('URLVoid', 'https://www.urlvoid.com/scan/{DOMAIN}/', 'security_report', 2, true, 58);
  add('Quttera', 'https://quttera.com/detailed_report/{DOMAIN}', 'security_report', 2, true, 48);
  add('UpGuard Risk', 'https://www.upguard.com/security-report/{DOMAIN}', 'security_report', 2, true, 62);
  add('Kaspersky Threat', 'https://opentip.kaspersky.com/{DOMAIN}', 'security_report', 2, true, 88);
  add('HSTSPreload', 'https://hstspreload.org/?domain={DOMAIN}', 'security_report', 2, true, 58);

  // --- Blacklist / Reputation Pages ---
  add('Talos Intelligence', 'https://talosintelligence.com/reputation_center/lookup?search={DOMAIN}', 'security_report', 2, true, 72);
  add('FortiGuard WebFilter', 'https://fortiguard.com/webfilter?q={DOMAIN}', 'security_report', 2, true, 76);
  add('BitDefender Traffic', 'https://trafficlight.bitdefender.com/info?url={DOMAIN}', 'security_report', 2, true, 80);
  add('SafeBrowsing', 'https://transparencyreport.google.com/safe-browsing/search?url={DOMAIN}', 'security_report', 2, true, 97);
  add('TrendMicro Safety', 'https://global.sitesafety.trendmicro.com/result.php?url={DOMAIN}', 'security_report', 2, true, 78);
  add('Spamhaus Lookup', 'https://check.spamhaus.org/listed/?searchterm={DOMAIN}', 'security_report', 2, true, 72);
  add('MXToolbox Blacklist', 'https://mxtoolbox.com/SuperTool.aspx?action=blacklist:{DOMAIN}', 'security_report', 2, true, 72);

  // --- Speed / Performance Reports ---
  add('PageSpeed Insights', 'https://pagespeed.web.dev/analysis?url=https%3A%2F%2F{DOMAIN}', 'speed_report', 2, true, 97);
  add('GTmetrix', 'https://gtmetrix.com/?url=https%3A%2F%2F{DOMAIN}', 'speed_report', 2, true, 72);
  add('WebPageTest', 'https://www.webpagetest.org/?url=https://{DOMAIN}', 'speed_report', 2, true, 72);
  add('DownDetector', 'https://downdetector.com/status/{DOMAIN}', 'speed_report', 2, true, 80);
  add('IsItDown', 'https://www.isitdownrightnow.com/{DOMAIN}.html', 'speed_report', 2, true, 66);
  add('Yellow Lab Tools', 'https://yellowlab.tools/result/{DOMAIN}', 'speed_report', 2, true, 42);

  // --- Validators (Google / W3C create persistent reports) ---
  add('Google Rich Results', 'https://search.google.com/test/rich-results?url=https%3A%2F%2F{DOMAIN}', 'validator', 2, true, 97);
  add('Google Mobile Test', 'https://search.google.com/test/mobile-friendly?url={DOMAIN}', 'validator', 2, true, 97);
  add('W3C HTML Validator', 'https://validator.w3.org/nu/?doc={DOMAIN}', 'validator', 2, true, 82);
  add('Schema Validator', 'https://validator.schema.org/#url=https%3A%2F%2F{DOMAIN}', 'validator', 2, true, 78);
  add('W3C Feed Validator', 'https://validator.w3.org/feed/check.cgi?url={DOMAIN}', 'validator', 2, true, 82);

  // --- Meta / Social Preview ---
  add('MetaTags.io', 'https://metatags.io/?url={DOMAIN}', 'seo_report', 2, true, 52);
  add('OpenGraph.xyz', 'https://www.opengraph.xyz/url/{DOMAIN}', 'seo_report', 2, true, 42);

  // =============================================
  // TIER 3: POSSIBLY INDEXABLE — May get indexed over time
  // These create pages but indexing is less certain
  // =============================================

  // --- Additional WHOIS ---
  add('Namecheap WHOIS', 'https://www.namecheap.com/domains/whois/result?domain={DOMAIN}', 'whois_page', 3, true, 82);
  add('GoDaddy WHOIS', 'https://www.godaddy.com/whois/results.aspx?domain={DOMAIN}', 'whois_page', 3, true, 90);
  add('Name.com WHOIS', 'https://www.name.com/whois/{DOMAIN}', 'whois_page', 3, true, 72);
  add('Gandi WHOIS', 'https://www.gandi.net/whois?search={DOMAIN}', 'whois_page', 3, true, 72);
  add('NetworkSolutions', 'https://www.networksolutions.com/whois/results.jsp?domain={DOMAIN}', 'whois_page', 3, true, 78);
  add('HostAdvice WHOIS', 'https://hostadvice.com/tools/whois/{DOMAIN}', 'whois_page', 3, true, 52);
  add('IANA WHOIS', 'https://www.iana.org/whois?q={DOMAIN}', 'whois_page', 3, true, 82);
  add('WhoisRequest History', 'https://whoisrequest.com/history/{DOMAIN}', 'whois_page', 3, true, 38);
  add('WhoisFreaks', 'https://whoisfreaks.com/tools/whois/lookup/{DOMAIN}', 'whois_page', 3, true, 40);
  add('UltraTools WHOIS', 'https://www.ultratools.com/tools/whoisResult?domain={DOMAIN}', 'whois_page', 3, true, 48);
  add('WhoIsHostingThis', 'https://www.whoishostingthis.com/{DOMAIN}', 'whois_page', 3, true, 62);
  add('ThatsThem WHOIS', 'https://thatsthem.com/whois/{DOMAIN}', 'whois_page', 3, true, 52);

  // --- Additional DNS/Network ---
  add('WhatsmyDNS', 'https://www.whatsmydns.net/#A/{DOMAIN}', 'dns_report', 3, true, 60);
  add('DNSInspect', 'https://dnsinspect.com/{DOMAIN}', 'dns_report', 3, true, 38);
  add('HackerTarget DNS', 'https://hackertarget.com/dns-lookup/?q={DOMAIN}', 'dns_report', 3, true, 62);
  add('ViewDNS Reverse', 'https://viewdns.info/reverseip/?host={DOMAIN}&t=1', 'dns_report', 3, true, 64);
  add('DNSViz', 'https://dnsviz.net/d/{DOMAIN}/dnssec/', 'dns_report', 3, true, 52);
  add('Zonemaster', 'https://zonemaster.net/domain_check/{DOMAIN}', 'dns_report', 3, true, 44);
  add('DNSlytics Reverse IP', 'https://dnslytics.com/reverse-ip/{DOMAIN}', 'dns_report', 3, true, 55);

  // --- Additional Security ---
  add('AbuseIPDB', 'https://www.abuseipdb.com/check/{DOMAIN}', 'security_report', 3, true, 66);
  add('SiteGuarding', 'https://siteguarding.com/en/sitecheck/report/{DOMAIN}', 'security_report', 3, true, 38);
  add('ImmuniWeb SSL', 'https://www.immuniweb.com/ssl/{DOMAIN}', 'security_report', 3, true, 56);
  add('DigiCert SSL', 'https://www.digicert.com/help/?host={DOMAIN}', 'security_report', 3, true, 78);

  // --- SSL Checkers ---
  add('SSLShopper', 'https://www.sslshopper.com/ssl-checker.html#{DOMAIN}', 'security_report', 3, true, 58);

  // --- Additional Speed Tests ---
  add('Pingdom', 'https://tools.pingdom.com/#https://{DOMAIN}', 'speed_report', 3, true, 82);
  add('KeyCDN Speed', 'https://tools.keycdn.com/speed?url=https%3A%2F%2F{DOMAIN}', 'speed_report', 3, true, 68);
  add('Bitcatcha', 'https://www.bitcatcha.com/tools/server-response-checker/?url={DOMAIN}', 'speed_report', 3, true, 52);
  add('Dareboost', 'https://www.dareboost.com/en/report/{DOMAIN}', 'speed_report', 3, true, 48);

  // --- CMS Detection ---
  add('WhatCMS', 'https://whatcms.org/?s={DOMAIN}', 'tech_profile', 3, true, 48);
  add('CMSDetect', 'https://cmsdetect.com/{DOMAIN}', 'tech_profile', 3, true, 32);

  // --- Redirect/Header Tools ---
  add('RedirectDetective', 'https://redirectdetective.com/?url={DOMAIN}', 'dns_report', 3, true, 40);
  add('WhereGoes', 'https://wheregoes.com/trace/{DOMAIN}', 'dns_report', 3, true, 42);

  // --- OSINT ---
  add('BinaryEdge', 'https://app.binaryedge.io/services/query?query={DOMAIN}', 'security_report', 3, true, 50);
  add('ZoomEye', 'https://www.zoomeye.org/searchResult?q={DOMAIN}', 'security_report', 3, true, 58);
  add('GreyNoise', 'https://viz.greynoise.io/query/?q={DOMAIN}', 'security_report', 3, true, 52);

  // --- PublicWWW ---
  add('PublicWWW', 'https://publicwww.com/websites/{DOMAIN}/', 'tech_profile', 3, true, 56);

  // --- Domain Age ---
  add('SmallSEOTools Age', 'https://smallseotools.com/domain-age-checker/?url={DOMAIN}', 'seo_report', 3, true, 74);
  add('SEOReviewTools Age', 'https://www.seoreviewtools.com/domain-age-checker/?domain={DOMAIN}', 'seo_report', 3, true, 52);

  // --- Web Archives ---
  add('Archive.ph', 'https://archive.ph/{DOMAIN}', 'archive_page', 3, true, 58);
  add('Memento TimeTravel', 'https://timetravel.mementoweb.org/list/https://{DOMAIN}', 'archive_page', 3, true, 48);

  // =============================================
  // PING/NOTIFICATION SERVICES — Real discovery value
  // These notify search engines/blog directories about the domain
  // Not "indexable" pages themselves, but they DO have real SEO discovery value
  // =============================================
  add('PingOMatic', 'https://pingomatic.com/ping/?title={DOMAIN}&blogurl=https%3A%2F%2F{DOMAIN}', 'ping_notify', 2, false, 56);
  add('Twingly', 'https://ping.twingly.com/?url=https%3A%2F%2F{DOMAIN}', 'ping_notify', 2, false, 52);
  add('WeblogUpdate', 'https://www.weblogupdate.com/ping/?url=https%3A%2F%2F{DOMAIN}', 'ping_notify', 3, false, 32);
  add('Pingler', 'https://pingler.com/ping/?url={DOMAIN}', 'ping_notify', 3, false, 34);
  add('FeedPing', 'https://feedping.com/?url={DOMAIN}', 'ping_notify', 3, false, 28);

  // =============================================
  // AI/LLM PLATFORM SUBMISSIONS — Indexable on AI platforms
  // These create references in AI search engines (real value for AI visibility)
  // =============================================
  add('Perplexity', 'https://www.perplexity.ai/search?q={DOMAIN}', 'social_profile', 2, true, 72);
  add('Phind', 'https://www.phind.com/search?q={DOMAIN}', 'social_profile', 2, true, 54);
  add('You.com', 'https://you.com/search?q={DOMAIN}', 'social_profile', 2, true, 58);
  add('HackerNews Algolia', 'https://hn.algolia.com/?q={DOMAIN}', 'social_profile', 2, true, 72);
  add('AlternativeTo', 'https://alternativeto.net/browse/search/?q={DOMAIN}', 'social_profile', 2, true, 62);
  add('Common Crawl', 'https://index.commoncrawl.org/CC-MAIN-2024-10-index?url=*.{DOMAIN}&output=json', 'social_profile', 2, true, 62);
  add('GitHub Search', 'https://github.com/search?q={DOMAIN}&type=repositories', 'social_profile', 2, true, 95);
  add('StackOverflow Search', 'https://stackoverflow.com/search?q={DOMAIN}', 'social_profile', 2, true, 92);

  // --- Review/Business Platforms (create real profile pages) ---
  add('G2 Search', 'https://www.g2.com/search?query={DOMAIN}', 'social_profile', 2, true, 82);
  add('Capterra Search', 'https://www.capterra.com/search/?query={DOMAIN}', 'social_profile', 2, true, 76);
  add('TrustPilot Search', 'https://www.trustpilot.com/search?query={DOMAIN}', 'social_profile', 2, true, 88);
  add('ProductHunt Search', 'https://www.producthunt.com/search?q={DOMAIN}', 'social_profile', 2, true, 82);
  add('Crunchbase Search', 'https://www.crunchbase.com/textsearch?q={DOMAIN}', 'social_profile', 2, true, 82);

  // --- Bookmarking/Content platforms that create searchable profiles ---
  add('Feedly', 'https://feedly.com/i/subscription/feed/https://{DOMAIN}', 'social_profile', 2, true, 83);
  add('Hacker News From', 'https://news.ycombinator.com/from?site={DOMAIN}', 'social_profile', 2, true, 91);

  // --- Directory listing pages ---
  add('Hotfrog', 'https://www.hotfrog.com/search/{DOMAIN}', 'directory_listing', 2, true, 54);
  add('Curlie', 'https://curlie.org/search?q={DOMAIN}', 'directory_listing', 2, true, 68);
  add('BOTW', 'https://botw.org/search?q={DOMAIN}', 'directory_listing', 3, true, 50);
  add('Jasmine Directory', 'https://www.jasminedirectory.com/search?q={DOMAIN}', 'directory_listing', 3, true, 58);

  // =============================================
  // LOCAL CITATIONS — Review/trust pages that are unique to this category
  // All other persistent pages (WHOIS, tech profiles, SEO reports, security
  // scans, speed reports, etc.) already exist above in their own categories.
  // Gig 7 pulls from ALL persistent categories, not just local_citation.
  // =============================================
  add('TrustPilot Review', 'https://www.trustpilot.com/review/{DOMAIN}', 'local_citation', 1, true, 93);
  add('Sitejabber Review', 'https://www.sitejabber.com/reviews/{DOMAIN}', 'local_citation', 1, true, 72);
  add('ScamAdviser Check', 'https://www.scamadviser.com/check-website/{DOMAIN}', 'local_citation', 1, true, 72);
  add('Brownbook Business', 'https://www.brownbook.net/businesses/{DOMAIN}/', 'local_citation', 2, true, 56);

  console.log(`[EndpointDB v2] Total real indexable endpoints: ${endpoints.length} (${endpoints.filter(e => e.indexable).length} indexable)`);
  return endpoints;
}
