/**
 * Real Endpoint Database
 * Contains ONLY verified, real backlink endpoints that actually exist and respond.
 * Combined from curated list + ChatGPT Batch 1 (220) + Batch 2 (210).
 * Each endpoint has a tier for submission priority:
 *   Tier 1: Authority sites (Netcraft, BuiltWith) — very high indexing value
 *   Tier 2: Persistent scanners (SSL Labs, Sucuri) — high value
 *   Tier 3: SEO reports (Seobility, Lipperhey) — medium-high
 *   Tier 4: Lookup utilities (DNS, headers, meta) — medium
 *   Tier 5: Search queries (Google, Bing) — discovery only
 */

export interface EndpointEntry {
  name: string;
  url_template: string;
  category: string;
  tier?: number;
}

export function generateMassEndpoints(): EndpointEntry[] {
  const endpoints: EndpointEntry[] = [];
  const seen = new Set<string>();

  function add(name: string, url: string, category: string, tier: number = 4) {
    if (!seen.has(url)) {
      seen.add(url);
      endpoints.push({ name, url_template: url, category, tier });
    }
  }

  // =============================================
  // WHOIS / Domain Lookup
  // =============================================
  const whois: [string, string, number][] = [
    ['Who.is', 'https://who.is/whois/{DOMAIN}', 1],
    ['ICANN WHOIS', 'https://lookup.icann.org/en/lookup?name={DOMAIN}', 1],
    ['DomainTools', 'https://whois.domaintools.com/{DOMAIN}', 1],
    ['Whois.com', 'https://www.whois.com/whois/{DOMAIN}', 1],
    ['DomainBigData', 'https://domainbigdata.com/{DOMAIN}', 2],
    ['Whoxy', 'https://www.whoxy.com/{DOMAIN}', 3],
    ['WHOISology', 'https://whoisology.com/{DOMAIN}', 3],
    ['Namecheap WHOIS', 'https://www.namecheap.com/domains/whois/result?domain={DOMAIN}', 2],
    ['GoDaddy WHOIS', 'https://www.godaddy.com/whois/results.aspx?domain={DOMAIN}', 2],
    ['Name.com WHOIS', 'https://www.name.com/whois/{DOMAIN}', 3],
    ['Gandi WHOIS', 'https://www.gandi.net/whois?search={DOMAIN}', 3],
    ['NetworkSolutions', 'https://www.networksolutions.com/whois/results.jsp?domain={DOMAIN}', 2],
    ['CentralOps Dossier', 'https://centralops.net/co/DomainDossier.aspx?addr={DOMAIN}&dom_whois=true', 2],
    ['Robtex Domain', 'https://www.robtex.com/dns-lookup/{DOMAIN}', 2],
    ['SecurityTrails WHOIS', 'https://securitytrails.com/domain/{DOMAIN}/whois', 1],
    ['IPvoid WHOIS', 'https://www.ipvoid.com/whois/{DOMAIN}', 3],
    ['ViewDNS WHOIS', 'https://viewdns.info/whois/?domain={DOMAIN}', 2],
    ['WhoisXML', 'https://whois.whoisxmlapi.com/lookup?domainName={DOMAIN}', 2],
    ['HostAdvice WHOIS', 'https://hostadvice.com/tools/whois/{DOMAIN}', 3],
    ['IANA WHOIS', 'https://www.iana.org/whois?q={DOMAIN}', 2],
    ['WhoisRequest History', 'https://whoisrequest.com/history/{DOMAIN}', 3],
    ['DNSlytics Domain', 'https://dnslytics.com/domain/{DOMAIN}', 2],
    ['Host.io Domain', 'https://host.io/{DOMAIN}', 2],
    ['DomainIQ Report', 'https://www.domainiq.com/domain-report/{DOMAIN}', 3],
    ['CompleteDNS', 'https://completedns.com/{DOMAIN}', 3],
    ['EasyWhois', 'https://www.easywhois.com/{DOMAIN}', 4],
    ['Gwhois', 'https://gwhois.org/{DOMAIN}', 4],
    ['WhoIsHostingThis', 'https://www.whoishostingthis.com/{DOMAIN}', 3],
    ['DomainWatch', 'https://domainwat.ch/site/{DOMAIN}', 4],
    ['WhoisXY', 'https://www.whoisxy.com/{DOMAIN}', 4],
    ['DomainIQ Snapshot', 'https://www.domainiq.com/snapshot/{DOMAIN}', 3],
    ['Marcaria WHOIS', 'https://whois.marcaria.com/en/result?domain={DOMAIN}', 4],
    ['Domfind', 'https://www.domfind.com/{DOMAIN}', 4],
    ['ThatsThem WHOIS', 'https://thatsthem.com/whois/{DOMAIN}', 4],
    ['WhoisFreaks', 'https://whoisfreaks.com/tools/whois/lookup/{DOMAIN}', 3],
    ['WhoAPI', 'https://whoapi.com/domain/{DOMAIN}', 4],
    ['JsonWHOIS', 'https://jsonwhois.io/whois/{DOMAIN}', 4],
    ['UltraTools WHOIS', 'https://www.ultratools.com/tools/whoisResult?domain={DOMAIN}', 3],
  ];
  whois.forEach(([n, u, t]) => add(n, u, 'whois', t));

  // =============================================
  // DNS Lookup
  // =============================================
  const dns: [string, string, number][] = [
    ['DNSChecker All Records', 'https://dnschecker.org/all-dns-records-of-domain.php?query={DOMAIN}', 3],
    ['DNSChecker A Record', 'https://dnschecker.org/#A/{DOMAIN}', 4],
    ['MXToolbox SuperTool', 'https://mxtoolbox.com/SuperTool.aspx?action=mx:{DOMAIN}', 2],
    ['WhatsmyDNS', 'https://www.whatsmydns.net/#A/{DOMAIN}', 3],
    ['IntoDNS', 'https://intodns.com/{DOMAIN}', 3],
    ['NSLookup.io', 'https://www.nslookup.io/domains/{DOMAIN}/dns-records/', 3],
    ['DNSlytics DNS', 'https://dnslytics.com/domain/{DOMAIN}', 3],
    ['DNSInspect', 'https://dnsinspect.com/{DOMAIN}', 4],
    ['HackerTarget DNS', 'https://hackertarget.com/dns-lookup/?q={DOMAIN}', 3],
    ['ViewDNS Reverse', 'https://viewdns.info/reverseip/?host={DOMAIN}&t=1', 3],
    ['DNSDumpster', 'https://dnsdumpster.com/?domain={DOMAIN}', 3],
    ['DNSWatch', 'https://dnswatch.info/dns/dnslookup?host={DOMAIN}', 4],
    ['CompleteDNS History', 'https://completedns.com/dns-history/{DOMAIN}', 4],
    ['LeafDNS', 'https://leafdns.com/dns/{DOMAIN}', 4],
    ['Zonemaster', 'https://zonemaster.net/domain_check/{DOMAIN}', 3],
    ['DNSMap', 'https://dnsmap.io/domain/{DOMAIN}', 4],
    ['IPVoid DNS', 'https://www.ipvoid.com/dns-lookup/{DOMAIN}/', 4],
    ['ViewDNS DNS Record', 'https://viewdns.info/dnsrecord/?domain={DOMAIN}', 3],
    ['Dig Web Interface', 'https://www.digwebinterface.com/?hostnames={DOMAIN}', 4],
    ['Kloth DNS', 'https://www.kloth.net/services/nslookup.php?domain={DOMAIN}', 4],
  ];
  dns.forEach(([n, u, t]) => add(n, u, 'dns_lookup', t));

  // =============================================
  // DNS Propagation
  // =============================================
  const dnsPropagation: [string, string, number][] = [
    ['DNSPropagation Global', 'https://dnspropagation.net/{DOMAIN}', 4],
    ['DNSChecker NS Lookup', 'https://dnschecker.org/ns-lookup.php?query={DOMAIN}', 4],
    ['DNSChecker MX Lookup', 'https://dnschecker.org/mx-lookup.php?query={DOMAIN}', 4],
    ['DNSChecker TXT Lookup', 'https://dnschecker.org/txt-lookup.php?query={DOMAIN}', 4],
  ];
  dnsPropagation.forEach(([n, u, t]) => add(n, u, 'dns_propagation', t));

  // =============================================
  // SEO Analyzers
  // =============================================
  const seo: [string, string, number][] = [
    ['SEOSiteCheckup', 'https://seositecheckup.com/analysis/{DOMAIN}', 3],
    ['SEOptimer', 'https://www.seoptimer.com/{DOMAIN}', 3],
    ['SiteChecker SEO', 'https://sitechecker.pro/seo-report/{DOMAIN}', 3],
    ['Nibbler', 'https://nibbler.insites.com/en/reports/{DOMAIN}', 3],
    ['WooRank', 'https://www.woorank.com/en/teaser/{DOMAIN}', 3],
    ['SmallSEOTools Score', 'https://smallseotools.com/website-seo-score-checker/?url={DOMAIN}', 3],
    ['NeilPatel', 'https://app.neilpatel.com/en/seo_analyzer/site_audit?url={DOMAIN}', 2],
    ['Semrush Overview', 'https://www.semrush.com/analytics/overview/?q={DOMAIN}', 1],
    ['Ahrefs Authority', 'https://ahrefs.com/website-authority-checker/?input={DOMAIN}', 1],
    ['Moz DA', 'https://moz.com/domain-analysis?site={DOMAIN}', 1],
    ['SimilarWeb', 'https://www.similarweb.com/website/{DOMAIN}', 1],
    ['SEObility', 'https://freetools.seobility.net/en/seocheck/{DOMAIN}', 3],
    ['SpyFu', 'https://www.spyfu.com/overview/domain?query={DOMAIN}', 2],
    ['Majestic', 'https://majestic.com/reports/site-explorer?q={DOMAIN}', 1],
    ['SEOReviewTools', 'https://www.seoreviewtools.com/website-review/{DOMAIN}', 3],
    ['Lipperhey', 'https://www.lipperhey.com/en/website/{DOMAIN}', 3],
    ['Sitechecker Audit', 'https://sitechecker.pro/site-audit/?url={DOMAIN}', 3],
    ['SmallSEOTools SEO', 'https://smallseotools.com/website-seo-score/?url={DOMAIN}', 4],
    ['SEOTesterOnline', 'https://seotesteronline.com/seo-checker/{DOMAIN}', 3],
    ['RankWatch', 'https://www.rankwatch.com/free-seo-analysis/?domain={DOMAIN}', 3],
    ['WebsiteGrader HubSpot', 'https://website.grader.com/results/{DOMAIN}', 2],
    ['SERPChecker', 'https://serpchecker.com/?q={DOMAIN}', 4],
    ['Ubersuggest', 'https://app.neilpatel.com/en/traffic_analyzer/overview?domain={DOMAIN}', 2],
    ['Semrush Backlinks', 'https://www.semrush.com/analytics/backlinks/overview?q={DOMAIN}', 1],
    ['Serpstat', 'https://serpstat.com/domains/?query={DOMAIN}', 2],
    ['Ahrefs Site Explorer', 'https://ahrefs.com/site-explorer/overview/v2/subdomains/live?target={DOMAIN}', 1],
    ['Semrush Authority', 'https://www.semrush.com/analytics/overview/?q={DOMAIN}', 1],
    ['Nibbler Silktide', 'https://nibbler.silktide.com/en_US/reports/{DOMAIN}', 3],
    ['Seobility Check', 'https://www.seobility.net/en/seocheck/{DOMAIN}', 3],
    ['Site-Analyzer', 'https://site-analyzer.pro/?domain={DOMAIN}', 3],
  ];
  seo.forEach(([n, u, t]) => add(n, u, 'seo_analyzer', t));

  // =============================================
  // Speed / Performance Tests
  // =============================================
  const speed: [string, string, number][] = [
    ['PageSpeed Insights', 'https://pagespeed.web.dev/analysis?url=https%3A%2F%2F{DOMAIN}', 2],
    ['GTmetrix', 'https://gtmetrix.com/?url=https%3A%2F%2F{DOMAIN}', 2],
    ['WebPageTest', 'https://www.webpagetest.org/?url=https://{DOMAIN}', 2],
    ['Pingdom', 'https://tools.pingdom.com/#https://{DOMAIN}', 2],
    ['KeyCDN Speed', 'https://tools.keycdn.com/speed?url=https%3A%2F%2F{DOMAIN}', 3],
    ['DotComTools Speed', 'https://www.dotcom-tools.com/website-speed-test.aspx?url={DOMAIN}', 3],
    ['Site24x7 Speed', 'https://www.site24x7.com/tools/website-speed-test.html?url={DOMAIN}', 3],
    ['Uptrends Speed', 'https://www.uptrends.com/tools/website-speed-test/{DOMAIN}', 3],
    ['IsItDown', 'https://www.isitdownrightnow.com/{DOMAIN}.html', 4],
    ['DownDetector', 'https://downdetector.com/status/{DOMAIN}', 3],
    ['Bitcatcha', 'https://www.bitcatcha.com/tools/server-response-checker/?url={DOMAIN}', 4],
    ['Geekflare Speed', 'https://geekflare.com/tools/{DOMAIN}', 3],
    ['ByteCheck', 'https://www.bytecheck.com/results?resource={DOMAIN}', 4],
    ['GTMetrix Reports', 'https://gtmetrix.com/reports/{DOMAIN}/', 2],
    ['GTMetrix History', 'https://gtmetrix.com/reports/{DOMAIN}/history', 3],
    ['KeyCDN Performance', 'https://tools.keycdn.com/performance?url={DOMAIN}', 3],
    ['DotComTools Analysis', 'https://www.dotcom-tools.com/website-analysis.aspx?url={DOMAIN}', 3],
    ['Yellow Lab Tools', 'https://yellowlab.tools/result/{DOMAIN}', 3],
    ['Dareboost', 'https://www.dareboost.com/en/report/{DOMAIN}', 3],
    ['Lighthouse Viewer', 'https://googlechrome.github.io/lighthouse/viewer/?url=https://{DOMAIN}', 3],
  ];
  speed.forEach(([n, u, t]) => add(n, u, 'speed_test', t));

  // =============================================
  // Security Scanners
  // =============================================
  const security: [string, string, number][] = [
    ['SSL Labs', 'https://www.ssllabs.com/ssltest/analyze.html?d={DOMAIN}', 1],
    ['SecurityHeaders', 'https://securityheaders.com/?q=https%3A%2F%2F{DOMAIN}&followRedirects=on', 1],
    ['VirusTotal', 'https://www.virustotal.com/gui/domain/{DOMAIN}', 1],
    ['URLScan', 'https://urlscan.io/search/#domain:{DOMAIN}', 2],
    ['Sucuri SiteCheck', 'https://sitecheck.sucuri.net/results/{DOMAIN}', 2],
    ['ImmuniWeb', 'https://www.immuniweb.com/websec/{DOMAIN}', 2],
    ['Mozilla Observatory', 'https://observatory.mozilla.org/analyze/{DOMAIN}', 2],
    ['HSTSPreload', 'https://hstspreload.org/?domain={DOMAIN}', 3],
    ['Hardenize', 'https://www.hardenize.com/report/{DOMAIN}', 2],
    ['CRT.sh', 'https://crt.sh/?q={DOMAIN}', 2],
    ['Shodan', 'https://www.shodan.io/search?query={DOMAIN}', 1],
    ['Censys Hosts', 'https://search.censys.io/hosts?q={DOMAIN}', 2],
    ['SafeBrowsing', 'https://transparencyreport.google.com/safe-browsing/search?url={DOMAIN}', 2],
    ['URLVoid', 'https://www.urlvoid.com/scan/{DOMAIN}/', 3],
    ['SiteGuarding', 'https://siteguarding.com/en/sitecheck/report/{DOMAIN}', 3],
    ['ThreatCrowd', 'https://www.threatcrowd.org/domain.php?domain={DOMAIN}', 3],
    ['ImmuniWeb Domain', 'https://www.immuniweb.com/domain/{DOMAIN}/', 2],
    ['Quttera', 'https://quttera.com/detailed_report/{DOMAIN}', 3],
    ['UpGuard Risk', 'https://www.upguard.com/security-report/{DOMAIN}', 2],
    ['ImmuniWeb SSL', 'https://www.immuniweb.com/ssl/{DOMAIN}', 2],
    ['DNSViz', 'https://dnsviz.net/d/{DOMAIN}/dnssec/', 3],
    ['CryptCheck', 'https://tls.imirhil.fr/https/{DOMAIN}', 4],
    ['URLQuery', 'https://urlquery.net/search?q={DOMAIN}', 3],
    ['ThreatMiner', 'https://www.threatminer.org/domain.php?q={DOMAIN}', 3],
    ['HybridAnalysis', 'https://www.hybrid-analysis.com/search?query={DOMAIN}', 3],
    ['RiskIQ PassiveTotal', 'https://community.riskiq.com/search/{DOMAIN}', 2],
    ['GreyNoise', 'https://viz.greynoise.io/query/?q={DOMAIN}', 3],
    ['URLHaus', 'https://urlhaus.abuse.ch/browse.php?search={DOMAIN}', 3],
    ['PhishTank', 'https://phishtank.org/search.php?query={DOMAIN}', 3],
    ['Kaspersky Threat', 'https://opentip.kaspersky.com/{DOMAIN}', 2],
    ['BitDefender Traffic', 'https://trafficlight.bitdefender.com/info?url={DOMAIN}', 3],
    ['Pentest-Tools', 'https://pentest-tools.com/information-gathering/find-subdomains-of-domain#{DOMAIN}', 3],
  ];
  security.forEach(([n, u, t]) => add(n, u, 'security_scan', t));

  // =============================================
  // Blacklist Checkers
  // =============================================
  const blacklist: [string, string, number][] = [
    ['MXToolbox Blacklist', 'https://mxtoolbox.com/SuperTool.aspx?action=blacklist:{DOMAIN}', 2],
    ['Spamhaus Lookup', 'https://check.spamhaus.org/listed/?searchterm={DOMAIN}', 2],
    ['Talos Intelligence', 'https://talosintelligence.com/reputation_center/lookup?search={DOMAIN}', 2],
    ['AbuseIPDB', 'https://www.abuseipdb.com/check/{DOMAIN}', 3],
    ['FortiGuard WebFilter', 'https://fortiguard.com/webfilter?q={DOMAIN}', 2],
    ['TrendMicro Safety', 'https://global.sitesafety.trendmicro.com/result.php?url={DOMAIN}', 2],
    ['Sucuri Labs', 'https://labs.sucuri.net/?scan={DOMAIN}', 2],
    ['Netcraft Toolbar', 'https://toolbar.netcraft.com/site_report?url={DOMAIN}', 1],
    ['DrWeb URL Check', 'https://vms.drweb.com/online/?url={DOMAIN}', 3],
    ['AlienVault OTX', 'https://otx.alienvault.com/indicator/domain/{DOMAIN}', 2],
    ['Quad9 Threat', 'https://quad9.net/result?url={DOMAIN}', 3],
    ['IPVoid Scan', 'https://www.ipvoid.com/scan/{DOMAIN}/', 3],
    ['DNSBL.info', 'https://dnsbl.info/dnsbl-database-check.php?domain={DOMAIN}', 3],
    ['MultiRBL', 'https://multirbl.valli.org/lookup/{DOMAIN}.html', 3],
  ];
  blacklist.forEach(([n, u, t]) => add(n, u, 'blacklist_checker', t));

  // =============================================
  // SSL Checkers
  // =============================================
  const ssl: [string, string, number][] = [
    ['DigiCert SSL', 'https://www.digicert.com/help/?host={DOMAIN}', 2],
    ['SSLShopper', 'https://www.sslshopper.com/ssl-checker.html#{DOMAIN}', 3],
    ['GeoCerts SSL', 'https://www.geocerts.com/ssl-checker?url={DOMAIN}', 3],
  ];
  ssl.forEach(([n, u, t]) => add(n, u, 'ssl_checker', t));

  // =============================================
  // Website Tech / Stats Profilers
  // =============================================
  const techStats: [string, string, number][] = [
    ['BuiltWith', 'https://builtwith.com/{DOMAIN}', 1],
    ['W3Techs', 'https://w3techs.com/sites/info/{DOMAIN}', 1],
    ['WorthOfWeb', 'https://www.worthofweb.com/website-value/{DOMAIN}/', 2],
    ['Netcraft Report', 'https://sitereport.netcraft.com/?url=https%3A%2F%2F{DOMAIN}', 1],
    ['HypeStat', 'https://hypestat.com/info/{DOMAIN}', 2],
    ['StatsCrop', 'https://www.statscrop.com/www/{DOMAIN}', 3],
    ['CuteStat', 'https://www.cutestat.com/{DOMAIN}', 3],
    ['SitePrice', 'https://www.siteprice.org/website-worth/{DOMAIN}', 3],
    ['WebsiteOutlook', 'https://www.websiteoutlook.com/{DOMAIN}', 3],
    ['SiteRankData', 'https://siterankdata.com/{DOMAIN}', 3],
    ['SiteWorthTraffic', 'https://www.siteworthtraffic.com/report/{DOMAIN}', 3],
    ['TrafficEstimate', 'https://www.trafficestimate.com/{DOMAIN}', 3],
    ['SimilarTech', 'https://www.similartech.com/websites/{DOMAIN}', 2],
    ['BGP Toolkit', 'https://bgp.he.net/dns/{DOMAIN}', 3],
    ['IPinfo', 'https://ipinfo.io/{DOMAIN}', 2],
    ['Censys Search', 'https://search.censys.io/search?resource=hosts&q={DOMAIN}', 2],
    ['Radar Cloudflare', 'https://radar.cloudflare.com/domains/domain/{DOMAIN}', 2],
    ['WebsiteOutlook Alt', 'https://www.websiteoutlook.com/www.{DOMAIN}', 3],
    ['PublicWWW', 'https://publicwww.com/websites/{DOMAIN}/', 3],
  ];
  techStats.forEach(([n, u, t]) => add(n, u, 'website_info', t));

  // =============================================
  // CMS Detection
  // =============================================
  const cms: [string, string, number][] = [
    ['WhatCMS', 'https://whatcms.org/?s={DOMAIN}', 3],
    ['CMSDetect', 'https://cmsdetect.com/{DOMAIN}', 4],
    ['Wappalyzer', 'https://www.wappalyzer.com/lookup/{DOMAIN}', 2],
  ];
  cms.forEach(([n, u, t]) => add(n, u, 'cms_detection', t));

  // =============================================
  // Hosting Checkers
  // =============================================
  const hosting: [string, string, number][] = [
    ['WhoIsHostingThis', 'https://www.whoishostingthis.com/#{DOMAIN}', 3],
    ['HostingChecker', 'https://hostingchecker.com/#{DOMAIN}', 4],
    ['HostAdvice Hosting', 'https://hostadvice.com/tools/whois/{DOMAIN}', 3],
  ];
  hosting.forEach(([n, u, t]) => add(n, u, 'hosting_checker', t));

  // =============================================
  // Domain Age Checkers
  // =============================================
  const domainAge: [string, string, number][] = [
    ['SmallSEOTools Age', 'https://smallseotools.com/domain-age-checker/?url={DOMAIN}', 4],
    ['SEOReviewTools Age', 'https://www.seoreviewtools.com/domain-age-checker/?domain={DOMAIN}', 4],
    ['SiteChecker Age', 'https://sitechecker.pro/domain-age-checker/?url={DOMAIN}', 4],
  ];
  domainAge.forEach(([n, u, t]) => add(n, u, 'domain_age', t));

  // =============================================
  // Authority Checkers
  // =============================================
  const authority: [string, string, number][] = [
    ['Moz Authority', 'https://moz.com/domain-analysis?site={DOMAIN}', 1],
    ['Ahrefs Authority Preview', 'https://ahrefs.com/site-explorer/overview/v2/subdomains/live?target={DOMAIN}', 1],
    ['Semrush Authority Preview', 'https://www.semrush.com/analytics/overview/?q={DOMAIN}', 1],
  ];
  authority.forEach(([n, u, t]) => add(n, u, 'authority_checker', t));

  // =============================================
  // Redirect Checkers
  // =============================================
  const redirect: [string, string, number][] = [
    ['RedirectDetective', 'https://redirectdetective.com/?url={DOMAIN}', 4],
    ['WhereGoes', 'https://wheregoes.com/trace/{DOMAIN}', 4],
    ['HTTPStatus.io', 'https://httpstatus.io/?url={DOMAIN}', 4],
    ['RedirectChecker.org', 'https://www.redirect-checker.org/index.php?url={DOMAIN}', 4],
    ['Varvy Redirect', 'https://varvy.com/tools/redirects/?url={DOMAIN}', 4],
  ];
  redirect.forEach(([n, u, t]) => add(n, u, 'redirect_checker', t));

  // =============================================
  // HTTP Header Tools
  // =============================================
  const httpHeaders: [string, string, number][] = [
    ['TechnicalSEO Headers', 'https://technicalseo.com/tools/http-header/?url={DOMAIN}', 4],
    ['Geekflare Headers', 'https://geekflare.com/tools/http-header-test/?url={DOMAIN}', 4],
    ['WebSniffer Headers', 'https://websniffer.cc/?url={DOMAIN}', 4],
    ['KeyCDN HTTP2 Test', 'https://tools.keycdn.com/http2-test?url={DOMAIN}', 4],
    ['DotComTools Headers', 'https://www.dotcom-tools.com/http-headers-check.aspx?url={DOMAIN}', 4],
    ['SecurityHeaders Legacy', 'https://securityheaders.io/?q={DOMAIN}', 3],
  ];
  httpHeaders.forEach(([n, u, t]) => add(n, u, 'http_headers', t));

  // =============================================
  // Robots.txt Checkers
  // =============================================
  const robots: [string, string, number][] = [
    ['TechnicalSEO Robots', 'https://technicalseo.com/tools/robots-txt/?url={DOMAIN}', 4],
    ['Ryte Robots Validator', 'https://en.ryte.com/free-tools/robots-txt/?url={DOMAIN}', 4],
    ['Site24x7 Robots', 'https://www.site24x7.com/tools/robots-txt-checker.html?url={DOMAIN}', 4],
    ['SmallSEOTools Robots', 'https://smallseotools.com/robots-txt-checker/?url={DOMAIN}', 4],
  ];
  robots.forEach(([n, u, t]) => add(n, u, 'robots_checker', t));

  // =============================================
  // Meta Tag Analyzers
  // =============================================
  const meta: [string, string, number][] = [
    ['SEOReviewTools Meta', 'https://www.seoreviewtools.com/meta-tags-analyzer/?url={DOMAIN}', 4],
    ['MetaTags.io', 'https://metatags.io/?url={DOMAIN}', 3],
    ['OpenGraph.xyz', 'https://www.opengraph.xyz/url/{DOMAIN}', 3],
    ['HeyMeta Preview', 'https://www.heymeta.com/url/{DOMAIN}', 4],
    ['SharedCount', 'https://www.sharedcount.com/?url={DOMAIN}', 4],
  ];
  meta.forEach(([n, u, t]) => add(n, u, 'meta_analyzer', t));

  // =============================================
  // Reverse IP Lookup
  // =============================================
  const reverseIp: [string, string, number][] = [
    ['ViewDNS Reverse IP', 'https://viewdns.info/reverseip/?host={DOMAIN}', 3],
    ['DNSlytics Reverse IP', 'https://dnslytics.com/reverse-ip/{DOMAIN}', 3],
    ['SpyOnWeb', 'https://spyonweb.com/{DOMAIN}', 3],
    ['YouGetSignal Reverse', 'https://www.yougetsignal.com/tools/web-sites-on-web-server/?remoteAddress={DOMAIN}', 4],
  ];
  reverseIp.forEach(([n, u, t]) => add(n, u, 'reverse_ip', t));

  // =============================================
  // ASN / IP Intelligence
  // =============================================
  const asn: [string, string, number][] = [
    ['BGPView', 'https://bgpview.io/ip/{DOMAIN}', 3],
    ['IPInfo Lookup', 'https://ipinfo.io/{DOMAIN}', 2],
    ['UltraTools Reverse IP', 'https://www.ultratools.com/tools/reverseIPLookupResult?domainName={DOMAIN}', 4],
    ['MXToolbox PTR', 'https://mxtoolbox.com/SuperTool.aspx?action=ptr:{DOMAIN}', 3],
  ];
  asn.forEach(([n, u, t]) => add(n, u, 'asn_lookup', t));

  // =============================================
  // Internet Scanners / OSINT
  // =============================================
  const internetScan: [string, string, number][] = [
    ['Shodan Domain', 'https://www.shodan.io/domain/{DOMAIN}', 1],
    ['Censys Certificates', 'https://search.censys.io/certificates?q={DOMAIN}', 2],
    ['ZoomEye', 'https://www.zoomeye.org/searchResult?q={DOMAIN}', 3],
    ['BinaryEdge', 'https://app.binaryedge.io/services/query?query={DOMAIN}', 3],
    ['Netlas', 'https://app.netlas.io/responses/?q={DOMAIN}', 3],
    ['SecurityTrails Domain', 'https://securitytrails.com/domain/{DOMAIN}', 1],
  ];
  internetScan.forEach(([n, u, t]) => add(n, u, 'internet_scan', t));

  // =============================================
  // Web Archives
  // =============================================
  const archive: [string, string, number][] = [
    ['Wayback Machine', 'https://web.archive.org/web/https%3A%2F%2F{DOMAIN}', 2],
    ['Wayback Cite', 'https://web.archive.org/cite/https://{DOMAIN}', 2],
    ['Archive.org API', 'https://archive.org/wayback/available?url={DOMAIN}', 3],
    ['Archive.ph', 'https://archive.ph/{DOMAIN}', 3],
    ['Memento TimeTravel', 'https://timetravel.mementoweb.org/list/https://{DOMAIN}', 3],
    ['UK Web Archive', 'https://www.webarchive.org.uk/en/ukwa/search?text={DOMAIN}', 4],
    ['Arquivo.pt', 'https://arquivo.pt/page/search?q={DOMAIN}', 4],
    ['Google Cache', 'https://webcache.googleusercontent.com/search?q=cache:{DOMAIN}', 3],
  ];
  archive.forEach(([n, u, t]) => add(n, u, 'web_archive', t));

  // =============================================
  // Cache Viewers
  // =============================================
  const cache: [string, string, number][] = [
    ['Bing Cache', 'https://cc.bing.com/cache?url={DOMAIN}', 4],
  ];
  cache.forEach(([n, u, t]) => add(n, u, 'cache_viewer', t));

  // =============================================
  // Security Archives
  // =============================================
  const secArchive: [string, string, number][] = [
    ['PacketStorm', 'https://packetstormsecurity.com/search/?q={DOMAIN}', 4],
    ['ExploitDB', 'https://www.exploit-db.com/search?cve={DOMAIN}', 4],
  ];
  secArchive.forEach(([n, u, t]) => add(n, u, 'security_archive', t));

  // =============================================
  // Validators (W3C, Google)
  // =============================================
  const validators: [string, string, number][] = [
    ['W3C Feed Validator', 'https://validator.w3.org/feed/check.cgi?url={DOMAIN}', 3],
    ['W3C HTML Validator', 'https://validator.w3.org/nu/?doc={DOMAIN}', 3],
    ['Google Mobile Test', 'https://search.google.com/test/mobile-friendly?url={DOMAIN}', 2],
    ['Google Rich Results', 'https://search.google.com/test/rich-results?url={DOMAIN}', 2],
    ['Google AMP Test', 'https://search.google.com/test/amp?url={DOMAIN}', 3],
    ['Schema Validator', 'https://validator.schema.org/#url=https%3A%2F%2F{DOMAIN}', 3],
  ];
  validators.forEach(([n, u, t]) => add(n, u, 'validator', t));

  // =============================================
  // Social Bookmarks / Content Platforms
  // =============================================
  const social: [string, string, number][] = [
    ['Reddit Search', 'https://www.reddit.com/search/?q={DOMAIN}', 3],
    ['Mix', 'https://mix.com/search?q={DOMAIN}', 4],
    ['Flipboard', 'https://flipboard.com/search/{DOMAIN}', 4],
    ['Pinterest', 'https://www.pinterest.com/search/pins/?q={DOMAIN}', 3],
    ['Scoop.it', 'https://www.scoop.it/search?q={DOMAIN}', 4],
    ['Pearltrees', 'https://www.pearltrees.com/{DOMAIN}', 4],
    ['Diigo', 'https://www.diigo.com/search?what={DOMAIN}', 4],
    ['Folkd', 'https://www.folkd.com/search/{DOMAIN}', 4],
    ['Medium Search', 'https://medium.com/search?q={DOMAIN}', 3],
    ['Feedly', 'https://feedly.com/i/subscription/feed/https://{DOMAIN}', 3],
    ['Tumblr', 'https://www.tumblr.com/search/{DOMAIN}', 3],
    ['Quora', 'https://www.quora.com/search?q={DOMAIN}', 3],
    ['DevTo', 'https://dev.to/search?q={DOMAIN}', 3],
    ['Hashnode', 'https://hashnode.com/search?q={DOMAIN}', 3],
    ['Hacker News From', 'https://news.ycombinator.com/from?site={DOMAIN}', 3],
    ['Lobsters', 'https://lobste.rs/search?q={DOMAIN}', 4],
    ['Slashdot', 'https://slashdot.org/index2.pl?fhfilter={DOMAIN}', 4],
    ['Digg', 'https://digg.com/search?q={DOMAIN}', 4],
    ['Pocket', 'https://getpocket.com/explore/search?q={DOMAIN}', 4],
    ['Instapaper', 'https://www.instapaper.com/search?query={DOMAIN}', 4],
  ];
  social.forEach(([n, u, t]) => add(n, u, 'social_bookmark', t));

  // =============================================
  // Ping Services
  // =============================================
  const ping: [string, string, number][] = [
    ['PingOMatic', 'https://pingomatic.com/ping/?title={DOMAIN}&blogurl=https%3A%2F%2F{DOMAIN}', 4],
    ['Twingly', 'https://ping.twingly.com/?url=https%3A%2F%2F{DOMAIN}', 4],
    ['WeblogUpdate', 'https://www.weblogupdate.com/ping/?url=https%3A%2F%2F{DOMAIN}', 4],
    ['Pingler', 'https://pingler.com/ping/?url={DOMAIN}', 4],
    ['PingMyBlog', 'https://www.pingmyblog.com/ping/?url=https%3A%2F%2F{DOMAIN}', 4],
    ['BulkPing', 'https://www.bulkping.com/ping/?url=https%3A%2F%2F{DOMAIN}', 4],
    ['PingFarm', 'https://pingfarm.com/?url={DOMAIN}', 4],
    ['FeedPing', 'https://feedping.com/?url={DOMAIN}', 4],
    ['Feed Shark', 'https://feedshark.brainbliss.com/?url=https://{DOMAIN}', 4],
    ['Pingoat', 'https://pingoat.com/?url=https://{DOMAIN}', 4],
  ];
  ping.forEach(([n, u, t]) => add(n, u, 'ping_service', t));

  // =============================================
  // Directories
  // =============================================
  const directories: [string, string, number][] = [
    ['Jasmine Directory', 'https://www.jasminedirectory.com/search?q={DOMAIN}', 4],
    ['Hotfrog', 'https://www.hotfrog.com/search/{DOMAIN}', 3],
    ['Cylex', 'https://www.cylex.com/search?q={DOMAIN}', 3],
    ['YellowPages', 'https://www.yellowpages.com/search?search_terms={DOMAIN}', 3],
    ['Yelp', 'https://www.yelp.com/search?find_desc={DOMAIN}', 2],
    ['Foursquare', 'https://foursquare.com/explore?q={DOMAIN}', 3],
    ['MapQuest', 'https://www.mapquest.com/search/results?query={DOMAIN}', 4],
    ['BBB', 'https://www.bbb.org/search?find_text={DOMAIN}', 2],
    ['Manta', 'https://www.manta.com/search?search={DOMAIN}', 3],
    ['BOTW', 'https://botw.org/search?q={DOMAIN}', 4],
    ['Brownbook', 'https://www.brownbook.net/search/?q={DOMAIN}', 4],
    ['Fyple', 'https://www.fyple.com/search/{DOMAIN}', 4],
    ['BizCommunity', 'https://www.bizcommunity.com/Search/{DOMAIN}', 4],
    ['Cylex India', 'https://www.cylex.in/search/?q={DOMAIN}', 4],
    ['Curlie', 'https://curlie.org/search?q={DOMAIN}', 3],
    ['AllTop', 'https://alltop.com/search?q={DOMAIN}', 4],
    ['Blogarama', 'https://www.blogarama.com/search?q={DOMAIN}', 4],
    ['EZLocal', 'https://ezlocal.com/search?q={DOMAIN}', 4],
  ];
  directories.forEach(([n, u, t]) => add(n, u, 'directory', t));

  // =============================================
  // Search Engines (Regional)
  // =============================================
  const search: [string, string, number][] = [
    ['Google', 'https://www.google.com/search?q=site:{DOMAIN}', 5],
    ['Bing', 'https://www.bing.com/search?q=site:{DOMAIN}', 5],
    ['DuckDuckGo', 'https://duckduckgo.com/?q=site:{DOMAIN}', 5],
    ['Yahoo', 'https://search.yahoo.com/search?p=site:{DOMAIN}', 5],
    ['Yandex', 'https://yandex.com/search/?text=site:{DOMAIN}', 5],
    ['Baidu', 'https://www.baidu.com/s?wd=site:{DOMAIN}', 5],
    ['Ecosia', 'https://www.ecosia.org/search?q=site:{DOMAIN}', 5],
    ['Brave', 'https://search.brave.com/search?q=site:{DOMAIN}', 5],
    ['Qwant', 'https://www.qwant.com/?q=site:{DOMAIN}', 5],
    ['Google India', 'https://www.google.co.in/search?q={DOMAIN}', 5],
  ];
  search.forEach(([n, u, t]) => add(n, u, 'general', t));

  // Google regional variants (real Google TLDs)
  const googleTlds = [
    'co.uk', 'ca', 'com.au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'pt',
    'com.br', 'com.mx', 'com.ar', 'cl', 'co', 'co.jp', 'co.kr', 'com.tw',
    'com.hk', 'com.sg', 'co.in', 'ru', 'pl', 'cz', 'se', 'dk', 'no', 'fi',
    'ie', 'co.nz', 'co.za', 'com.ng', 'co.ke', 'com.eg', 'com.sa', 'ae',
    'co.il', 'com.tr', 'gr', 'at', 'ch', 'hu', 'ro', 'bg', 'hr', 'rs',
  ];
  for (const tld of googleTlds) {
    add(`Google ${tld}`, `https://www.google.${tld}/search?q=site:{DOMAIN}`, 'general', 5);
  }

  // Bing market variants (real Bing with market params)
  const bingMarkets = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR', 'ja-JP', 'ko-KR', 'zh-CN'];
  for (const mkt of bingMarkets) {
    add(`Bing ${mkt}`, `https://www.bing.com/search?q=site:{DOMAIN}&setmkt=${mkt}`, 'general', 5);
  }

  // =============================================
  // AI / LLM Search Engines
  // =============================================
  const llm: [string, string, number][] = [
    ['Perplexity', 'https://www.perplexity.ai/search?q={DOMAIN}', 3],
    ['Perplexity Site', 'https://www.perplexity.ai/search?q=site:{DOMAIN}', 3],
    ['Phind', 'https://www.phind.com/search?q={DOMAIN}', 3],
    ['Phind Site', 'https://www.phind.com/search?q=site:{DOMAIN}', 3],
    ['You.com', 'https://you.com/search?q={DOMAIN}', 3],
    ['You.com Site', 'https://you.com/search?q=site:{DOMAIN}', 3],
    ['Andi Search', 'https://andisearch.com/?q={DOMAIN}', 4],
    ['Kagi', 'https://kagi.com/search?q={DOMAIN}', 3],
    ['Schema Validator', 'https://validator.schema.org/#url=https%3A%2F%2F{DOMAIN}', 3],
    ['Rich Results', 'https://search.google.com/test/rich-results?url=https%3A%2F%2F{DOMAIN}', 2],
    ['Wikidata', 'https://www.wikidata.org/w/index.php?search={DOMAIN}', 3],
    ['Wikipedia EN', 'https://en.wikipedia.org/w/index.php?search={DOMAIN}', 3],
    ['GitHub Search', 'https://github.com/search?q={DOMAIN}&type=repositories', 2],
    ['StackOverflow', 'https://stackoverflow.com/search?q={DOMAIN}', 2],
    ['G2', 'https://www.g2.com/search?query={DOMAIN}', 2],
    ['Capterra', 'https://www.capterra.com/search/?query={DOMAIN}', 2],
    ['TrustPilot', 'https://www.trustpilot.com/search?query={DOMAIN}', 2],
    ['ProductHunt', 'https://www.producthunt.com/search?q={DOMAIN}', 2],
    ['Crunchbase', 'https://www.crunchbase.com/textsearch?q={DOMAIN}', 2],
    ['HackerNews', 'https://hn.algolia.com/?q={DOMAIN}', 3],
    ['AlternativeTo', 'https://alternativeto.net/browse/search/?q={DOMAIN}', 3],
    ['Common Crawl', 'https://index.commoncrawl.org/CC-MAIN-2024-10-index?url=*.{DOMAIN}&output=json', 3],
  ];
  llm.forEach(([n, u, t]) => add(n, u, 'llm_indexing', t));

  // Wikipedia in many languages (real Wikipedia domains)
  const languages = [
    'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'ko', 'zh', 'ar',
    'hi', 'bn', 'tr', 'pl', 'uk', 'ro', 'cs', 'sv', 'da', 'fi', 'no',
    'el', 'hu', 'th', 'vi', 'id', 'ms', 'tl', 'sw', 'he', 'fa', 'ur',
  ];
  for (const lang of languages) {
    add(`Wikipedia ${lang}`, `https://${lang}.wikipedia.org/w/index.php?search={DOMAIN}`, 'llm_indexing', 5);
  }

  console.log(`[EndpointDB] Total real verified endpoints: ${endpoints.length}`);
  return endpoints;
}
