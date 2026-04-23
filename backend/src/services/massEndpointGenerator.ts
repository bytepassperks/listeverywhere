/**
 * Mass Endpoint Generator
 * Programmatically generates 100,000+ backlink endpoint URLs from patterns.
 * This runs in-memory at seed time — no large JSON file needed.
 */

export interface EndpointEntry {
  name: string;
  url_template: string;
  category: string;
}

const countries = [
  'us', 'uk', 'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'pt', 'br',
  'mx', 'ar', 'cl', 'co', 'pe', 'jp', 'kr', 'cn', 'tw', 'hk', 'sg', 'my',
  'th', 'vn', 'id', 'ph', 'in', 'pk', 'bd', 'lk', 'np', 'ru', 'ua', 'pl',
  'cz', 'sk', 'hu', 'ro', 'bg', 'hr', 'rs', 'si', 'at', 'ch', 'dk', 'se',
  'no', 'fi', 'ie', 'nz', 'za', 'ng', 'ke', 'gh', 'eg', 'ma', 'tn', 'sa',
  'ae', 'il', 'tr', 'gr', 'cy', 'mt', 'is', 'ee', 'lv', 'lt', 'lu', 'li',
  'mc', 'ad', 'sm', 'al', 'ba', 'mk', 'me', 'md', 'by', 'ge',
  'am', 'az', 'kz', 'uz', 'kg', 'tj', 'mn', 'la', 'kh', 'mm', 'bn',
  'tl', 'pg', 'fj', 'ws', 'to', 'vu', 'sb', 'ki', 'tv', 'nr', 'pw', 'fm',
  'mh', 'ck', 'nu', 'tk', 'pr', 'cu', 'jm', 'do', 'tt', 'bb', 'bs', 'bz',
  'gy', 'sr', 'aw', 'gl', 'fo',
];

const extensions = ['com', 'net', 'org', 'info', 'co', 'io', 'me', 'biz'];

const languages = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'ru', 'ja', 'ko', 'zh', 'ar',
  'hi', 'bn', 'tr', 'pl', 'uk', 'ro', 'cs', 'sv', 'da', 'fi', 'no', 'el',
  'hu', 'th', 'vi', 'id', 'ms', 'tl', 'sw', 'he', 'fa', 'ur',
];

export function generateMassEndpoints(): EndpointEntry[] {
  const endpoints: EndpointEntry[] = [];
  const seen = new Set<string>();

  function add(name: string, url: string, category: string) {
    if (!seen.has(url)) {
      seen.add(url);
      endpoints.push({ name, url_template: url, category });
    }
  }

  // ========== CURATED REAL ENDPOINTS ==========

  // WHOIS
  const whoisReal: [string, string][] = [
    ['Who.is', 'https://who.is/whois/{DOMAIN}'],
    ['ICANN WHOIS', 'https://lookup.icann.org/en/lookup?name={DOMAIN}'],
    ['DomainTools', 'https://whois.domaintools.com/{DOMAIN}'],
    ['Whois.com', 'https://www.whois.com/whois/{DOMAIN}'],
    ['DomainBigData', 'https://domainbigdata.com/{DOMAIN}'],
    ['Whoxy', 'https://www.whoxy.com/{DOMAIN}'],
    ['WHOISology', 'https://whoisology.com/{DOMAIN}'],
    ['Namecheap', 'https://www.namecheap.com/domains/whois/result?domain={DOMAIN}'],
    ['GoDaddy', 'https://www.godaddy.com/whois/results.aspx?domain={DOMAIN}'],
    ['Name.com', 'https://www.name.com/whois/{DOMAIN}'],
    ['Gandi', 'https://www.gandi.net/whois?search={DOMAIN}'],
    ['NetworkSolutions', 'https://www.networksolutions.com/whois/results.jsp?domain={DOMAIN}'],
    ['Centralops', 'https://centralops.net/co/DomainDossier.aspx?addr={DOMAIN}&dom_whois=true'],
    ['Robtex', 'https://www.robtex.com/dns-lookup/{DOMAIN}'],
    ['SecurityTrails', 'https://securitytrails.com/domain/{DOMAIN}/whois'],
    ['IPvoid', 'https://www.ipvoid.com/whois/{DOMAIN}'],
    ['ViewDNS', 'https://viewdns.info/whois/?domain={DOMAIN}'],
    ['WhoisXML', 'https://whois.whoisxmlapi.com/lookup?domainName={DOMAIN}'],
    ['HostAdvice', 'https://hostadvice.com/tools/whois/{DOMAIN}'],
    ['IANA', 'https://www.iana.org/whois?q={DOMAIN}'],
  ];
  whoisReal.forEach(([n, u]) => add(n, u, 'whois'));

  // DNS
  const dnsReal: [string, string][] = [
    ['DNSChecker', 'https://dnschecker.org/#A/{DOMAIN}'],
    ['MXToolbox', 'https://mxtoolbox.com/SuperTool.aspx?action=dns%3a{DOMAIN}&run=toolpage'],
    ['WhatsmyDNS', 'https://www.whatsmydns.net/#A/{DOMAIN}'],
    ['IntoDNS', 'https://intodns.com/{DOMAIN}'],
    ['NSLookup.io', 'https://www.nslookup.io/domains/{DOMAIN}/dns-records/'],
    ['DNSlytics', 'https://dnslytics.com/domain/{DOMAIN}'],
    ['DNSInspect', 'https://dnsinspect.com/{DOMAIN}'],
    ['HackerTarget', 'https://hackertarget.com/dns-lookup/?q={DOMAIN}'],
    ['ViewDNS', 'https://viewdns.info/reverseip/?host={DOMAIN}&t=1'],
    ['DNSDumpster', 'https://dnsdumpster.com/?domain={DOMAIN}'],
    ['DNSWatch', 'https://www.dnswatch.info/dns/dnslookup?la=en&host={DOMAIN}'],
    ['CompleteDNS', 'https://completedns.com/dns-history/{DOMAIN}'],
    ['LeafDNS', 'https://leafdns.com/dns/{DOMAIN}'],
    ['Zonemaster', 'https://zonemaster.net/domain_check/{DOMAIN}'],
  ];
  dnsReal.forEach(([n, u]) => add(n, u, 'dns_lookup'));

  // SEO
  const seoReal: [string, string][] = [
    ['SEOSiteCheckup', 'https://seositecheckup.com/analysis/{DOMAIN}'],
    ['SEOptimer', 'https://www.seoptimer.com/{DOMAIN}'],
    ['SiteChecker', 'https://sitechecker.pro/seo-report/{DOMAIN}'],
    ['Nibbler', 'https://nibbler.insites.com/en/reports/{DOMAIN}'],
    ['WooRank', 'https://www.woorank.com/en/teaser/{DOMAIN}'],
    ['SmallSEOTools', 'https://smallseotools.com/website-seo-score-checker/?url={DOMAIN}'],
    ['NeilPatel', 'https://app.neilpatel.com/en/seo_analyzer/site_audit?url={DOMAIN}'],
    ['Semrush', 'https://www.semrush.com/analytics/overview/?q={DOMAIN}'],
    ['Ahrefs', 'https://ahrefs.com/website-authority-checker/?input={DOMAIN}'],
    ['Moz', 'https://moz.com/domain-analysis?site={DOMAIN}'],
    ['SimilarWeb', 'https://www.similarweb.com/website/{DOMAIN}'],
    ['SEObility', 'https://freetools.seobility.net/en/seocheck/{DOMAIN}'],
    ['SpyFu', 'https://www.spyfu.com/overview/domain?query={DOMAIN}'],
    ['Majestic', 'https://majestic.com/reports/site-explorer?q={DOMAIN}'],
  ];
  seoReal.forEach(([n, u]) => add(n, u, 'seo_analyzer'));

  // Speed
  const speedReal: [string, string][] = [
    ['PageSpeed', 'https://pagespeed.web.dev/analysis?url=https%3A%2F%2F{DOMAIN}'],
    ['GTmetrix', 'https://gtmetrix.com/?url=https%3A%2F%2F{DOMAIN}'],
    ['WebPageTest', 'https://www.webpagetest.org/result/?url=https%3A%2F%2F{DOMAIN}'],
    ['Pingdom', 'https://tools.pingdom.com/#!{DOMAIN}'],
    ['KeyCDN', 'https://tools.keycdn.com/speed?url=https%3A%2F%2F{DOMAIN}'],
    ['DotComTools', 'https://www.dotcom-tools.com/website-speed-test?url={DOMAIN}'],
    ['Site24x7', 'https://www.site24x7.com/tools/website-speed-test?url={DOMAIN}'],
    ['Uptrends', 'https://www.uptrends.com/tools/website-speed-test?url={DOMAIN}'],
    ['IsItDown', 'https://www.isitdownrightnow.com/{DOMAIN}.html'],
    ['DownDetector', 'https://downdetector.com/status/{DOMAIN}'],
    ['Bitcatcha', 'https://www.bitcatcha.com/tools/server-response-checker/?url={DOMAIN}'],
  ];
  speedReal.forEach(([n, u]) => add(n, u, 'speed_test'));

  // Security
  const securityReal: [string, string][] = [
    ['SSL Labs', 'https://www.ssllabs.com/ssltest/analyze.html?d={DOMAIN}'],
    ['SecurityHeaders', 'https://securityheaders.com/?q=https%3A%2F%2F{DOMAIN}&followRedirects=on'],
    ['VirusTotal', 'https://www.virustotal.com/gui/domain/{DOMAIN}'],
    ['URLScan', 'https://urlscan.io/search/#{DOMAIN}'],
    ['Sucuri', 'https://sitecheck.sucuri.net/results/{DOMAIN}'],
    ['ImmuniWeb', 'https://www.immuniweb.com/websec/{DOMAIN}'],
    ['Mozilla Observatory', 'https://observatory.mozilla.org/analyze/{DOMAIN}'],
    ['HSTSPreload', 'https://hstspreload.org/?domain={DOMAIN}'],
    ['Hardenize', 'https://www.hardenize.com/report/{DOMAIN}'],
    ['CRT.sh', 'https://crt.sh/?q={DOMAIN}'],
    ['Shodan', 'https://www.shodan.io/search?query={DOMAIN}'],
    ['Censys', 'https://search.censys.io/hosts?q={DOMAIN}'],
    ['SafeBrowsing', 'https://transparencyreport.google.com/safe-browsing/search?url={DOMAIN}'],
  ];
  securityReal.forEach(([n, u]) => add(n, u, 'security_scan'));

  // Website Info
  const infoReal: [string, string][] = [
    ['BuiltWith', 'https://builtwith.com/{DOMAIN}'],
    ['W3Techs', 'https://w3techs.com/sites/info/{DOMAIN}'],
    ['WorthOfWeb', 'https://www.worthofweb.com/website-value/{DOMAIN}/'],
    ['Netcraft', 'https://sitereport.netcraft.com/?url=https%3A%2F%2F{DOMAIN}'],
    ['HypeStat', 'https://hypestat.com/info/{DOMAIN}'],
    ['StatsCrop', 'https://www.statscrop.com/www/{DOMAIN}'],
    ['CuteStat', 'https://www.cutestat.com/{DOMAIN}'],
    ['SitePrice', 'https://www.siteprice.org/website-worth/{DOMAIN}'],
    ['WebsiteOutlook', 'https://www.websiteoutlook.com/{DOMAIN}'],
    ['SiteRankData', 'https://siterankdata.com/{DOMAIN}'],
  ];
  infoReal.forEach(([n, u]) => add(n, u, 'website_info'));

  // Web Archive
  const archiveReal: [string, string][] = [
    ['Wayback Machine', 'https://web.archive.org/web/https%3A%2F%2F{DOMAIN}'],
    ['Archive.org API', 'https://archive.org/wayback/available?url={DOMAIN}'],
    ['Memento', 'https://timetravel.mementoweb.org/list/20200101000000*/https://{DOMAIN}'],
    ['UK Web Archive', 'https://www.webarchive.org.uk/en/ukwa/search?text={DOMAIN}'],
    ['Arquivo.pt', 'https://arquivo.pt/page/search?q={DOMAIN}'],
  ];
  archiveReal.forEach(([n, u]) => add(n, u, 'web_archive'));

  // Social Bookmarks
  const socialReal: [string, string][] = [
    ['Reddit', 'https://www.reddit.com/search/?q={DOMAIN}'],
    ['Mix', 'https://mix.com/search?q={DOMAIN}'],
    ['Flipboard', 'https://flipboard.com/search/{DOMAIN}'],
    ['Pinterest', 'https://www.pinterest.com/search/pins/?q={DOMAIN}'],
    ['Scoop.it', 'https://www.scoop.it/search?q={DOMAIN}'],
    ['Pearltrees', 'https://www.pearltrees.com/{DOMAIN}'],
    ['Diigo', 'https://www.diigo.com/search?what={DOMAIN}'],
    ['Folkd', 'https://www.folkd.com/search/{DOMAIN}'],
    ['Medium', 'https://medium.com/search?q={DOMAIN}'],
    ['Feedly', 'https://feedly.com/i/subscription/feed/https://{DOMAIN}'],
  ];
  socialReal.forEach(([n, u]) => add(n, u, 'social_bookmark'));

  // Ping Services
  const pingReal: [string, string][] = [
    ['PingOMatic', 'https://pingomatic.com/ping/?title={DOMAIN}&blogurl=https%3A%2F%2F{DOMAIN}'],
    ['Twingly', 'https://ping.twingly.com/?url=https%3A%2F%2F{DOMAIN}'],
    ['WeblogUpdate', 'https://www.weblogupdate.com/ping/?url=https%3A%2F%2F{DOMAIN}'],
    ['Pingler', 'https://pingler.com/ping/?url=https%3A%2F%2F{DOMAIN}'],
    ['PingMyBlog', 'https://www.pingmyblog.com/ping/?url=https%3A%2F%2F{DOMAIN}'],
    ['BulkPing', 'https://www.bulkping.com/ping/?url=https%3A%2F%2F{DOMAIN}'],
  ];
  pingReal.forEach(([n, u]) => add(n, u, 'ping_service'));

  // Directories
  const dirReal: [string, string][] = [
    ['Jasmine', 'https://www.jasminedirectory.com/search?q={DOMAIN}'],
    ['Hotfrog', 'https://www.hotfrog.com/search/{DOMAIN}'],
    ['Cylex', 'https://www.cylex.com/search?q={DOMAIN}'],
    ['YellowPages', 'https://www.yellowpages.com/search?search_terms={DOMAIN}'],
    ['Yelp', 'https://www.yelp.com/search?find_desc={DOMAIN}'],
    ['Foursquare', 'https://foursquare.com/explore?q={DOMAIN}'],
    ['MapQuest', 'https://www.mapquest.com/search/results?query={DOMAIN}'],
    ['BBB', 'https://www.bbb.org/search?find_text={DOMAIN}'],
    ['Manta', 'https://www.manta.com/search?search={DOMAIN}'],
    ['BOTW', 'https://botw.org/search?q={DOMAIN}'],
  ];
  dirReal.forEach(([n, u]) => add(n, u, 'directory'));

  // General/Search
  const generalReal: [string, string][] = [
    ['Google', 'https://www.google.com/search?q=site:{DOMAIN}'],
    ['Bing', 'https://www.bing.com/search?q=site:{DOMAIN}'],
    ['DuckDuckGo', 'https://duckduckgo.com/?q=site:{DOMAIN}'],
    ['Yahoo', 'https://search.yahoo.com/search?p=site:{DOMAIN}'],
    ['Yandex', 'https://yandex.com/search/?text=site:{DOMAIN}'],
    ['Baidu', 'https://www.baidu.com/s?wd=site:{DOMAIN}'],
    ['Ecosia', 'https://www.ecosia.org/search?q=site:{DOMAIN}'],
    ['Brave', 'https://search.brave.com/search?q=site:{DOMAIN}'],
    ['Qwant', 'https://www.qwant.com/?q=site:{DOMAIN}'],
  ];
  generalReal.forEach(([n, u]) => add(n, u, 'general'));

  // LLM Indexing
  const llmReal: [string, string][] = [
    ['Schema Validator', 'https://validator.schema.org/#url=https%3A%2F%2F{DOMAIN}'],
    ['Rich Results', 'https://search.google.com/test/rich-results?url=https%3A%2F%2F{DOMAIN}'],
    ['Wikidata', 'https://www.wikidata.org/w/index.php?search={DOMAIN}'],
    ['Wikipedia', 'https://en.wikipedia.org/w/index.php?search={DOMAIN}'],
    ['GitHub', 'https://github.com/search?q={DOMAIN}&type=repositories'],
    ['StackOverflow', 'https://stackoverflow.com/search?q={DOMAIN}'],
    ['G2', 'https://www.g2.com/search?query={DOMAIN}'],
    ['Capterra', 'https://www.capterra.com/search/?query={DOMAIN}'],
    ['TrustPilot', 'https://www.trustpilot.com/search?query={DOMAIN}'],
    ['ProductHunt', 'https://www.producthunt.com/search?q={DOMAIN}'],
    ['Crunchbase', 'https://www.crunchbase.com/textsearch?q={DOMAIN}'],
    ['HackerNews', 'https://hn.algolia.com/?q={DOMAIN}'],
    ['AlternativeTo', 'https://alternativeto.net/browse/search/?q={DOMAIN}'],
    ['Perplexity', 'https://www.perplexity.ai/search?q={DOMAIN}'],
    ['Phind', 'https://www.phind.com/search?q={DOMAIN}'],
  ];
  llmReal.forEach(([n, u]) => add(n, u, 'llm_indexing'));

  console.log(`[MassGen] Curated real endpoints: ${endpoints.length}`);

  // ========== MASS GENERATION ==========

  const categoryConfig: Record<string, { subdomains: string[]; paths: string[] }> = {
    whois: {
      subdomains: ['whois', 'lookup', 'domain', 'who', 'registrar', 'registration', 'domaininfo', 'whois-lookup', 'domain-whois', 'domain-lookup'],
      paths: ['/whois/{DOMAIN}', '/lookup/{DOMAIN}', '/domain/{DOMAIN}', '/search?domain={DOMAIN}', '/{DOMAIN}', '/check/{DOMAIN}', '/info/{DOMAIN}', '/query/{DOMAIN}', '/result?domain={DOMAIN}', '/whois/result/{DOMAIN}'],
    },
    dns_lookup: {
      subdomains: ['dns', 'nslookup', 'dig', 'dnscheck', 'dnslookup', 'dns-lookup', 'dnsquery', 'resolver', 'nameserver', 'dns-tools'],
      paths: ['/lookup/{DOMAIN}', '/check/{DOMAIN}', '/{DOMAIN}', '/query/{DOMAIN}', '/dns/{DOMAIN}', '/resolve/{DOMAIN}', '/dig/{DOMAIN}', '/test/{DOMAIN}', '/scan/{DOMAIN}', '/analyze/{DOMAIN}'],
    },
    seo_analyzer: {
      subdomains: ['seo', 'audit', 'analyzer', 'checker', 'grader', 'score', 'review', 'seo-check', 'website-audit', 'seo-analyzer'],
      paths: ['/analyze/{DOMAIN}', '/audit/{DOMAIN}', '/check/{DOMAIN}', '/report/{DOMAIN}', '/score/{DOMAIN}', '/grade/{DOMAIN}', '/review/{DOMAIN}', '/{DOMAIN}', '/scan/{DOMAIN}', '/test/{DOMAIN}'],
    },
    speed_test: {
      subdomains: ['speed', 'pagespeed', 'performance', 'loadtime', 'speedtest', 'website-speed', 'page-speed', 'speed-test', 'fast', 'benchmark'],
      paths: ['/test/{DOMAIN}', '/check/{DOMAIN}', '/analyze/{DOMAIN}', '/{DOMAIN}', '/speed/{DOMAIN}', '/performance/{DOMAIN}', '/report/{DOMAIN}', '/result/{DOMAIN}', '/measure/{DOMAIN}', '/scan/{DOMAIN}'],
    },
    security_scan: {
      subdomains: ['security', 'ssl', 'safe', 'secure', 'scan', 'malware', 'vulnerability', 'firewall', 'protection', 'safety'],
      paths: ['/scan/{DOMAIN}', '/check/{DOMAIN}', '/analyze/{DOMAIN}', '/{DOMAIN}', '/test/{DOMAIN}', '/report/{DOMAIN}', '/audit/{DOMAIN}', '/verify/{DOMAIN}', '/inspect/{DOMAIN}', '/monitor/{DOMAIN}'],
    },
    website_info: {
      subdomains: ['info', 'stats', 'traffic', 'value', 'rank', 'worth', 'data', 'profile', 'metrics', 'analytics'],
      paths: ['/site/{DOMAIN}', '/info/{DOMAIN}', '/{DOMAIN}', '/stats/{DOMAIN}', '/report/{DOMAIN}', '/analysis/{DOMAIN}', '/profile/{DOMAIN}', '/data/{DOMAIN}', '/overview/{DOMAIN}', '/details/{DOMAIN}'],
    },
    social_bookmark: {
      subdomains: ['bookmark', 'save', 'share', 'link', 'social', 'mark', 'clip', 'keep', 'store', 'collect'],
      paths: ['/submit/{DOMAIN}', '/add/{DOMAIN}', '/save/{DOMAIN}', '/share/{DOMAIN}', '/{DOMAIN}', '/bookmark/{DOMAIN}', '/link/{DOMAIN}', '/new/{DOMAIN}', '/post/{DOMAIN}', '/entry/{DOMAIN}'],
    },
    directory: {
      subdomains: ['directory', 'list', 'catalog', 'index', 'listing', 'register', 'submit', 'web-directory', 'site-list', 'business'],
      paths: ['/submit/{DOMAIN}', '/add/{DOMAIN}', '/list/{DOMAIN}', '/{DOMAIN}', '/register/{DOMAIN}', '/entry/{DOMAIN}', '/site/{DOMAIN}', '/directory/{DOMAIN}', '/search?q={DOMAIN}', '/new/{DOMAIN}'],
    },
    web_archive: {
      subdomains: ['archive', 'cache', 'wayback', 'snapshot', 'history', 'web-archive', 'cached', 'mirror', 'backup', 'preserved'],
      paths: ['/web/{DOMAIN}', '/view/{DOMAIN}', '/{DOMAIN}', '/cache/{DOMAIN}', '/snapshot/{DOMAIN}', '/history/{DOMAIN}', '/page/{DOMAIN}', '/archive/{DOMAIN}', '/search?q={DOMAIN}', '/lookup/{DOMAIN}'],
    },
    ping_service: {
      subdomains: ['ping', 'notify', 'update', 'xmlrpc', 'rpc', 'blog-ping', 'site-ping', 'web-ping', 'pinger', 'ping-service'],
      paths: ['/ping/{DOMAIN}', '/submit/{DOMAIN}', '/notify/{DOMAIN}', '/{DOMAIN}', '/update/{DOMAIN}', '/send/{DOMAIN}', '/process/{DOMAIN}', '/request/{DOMAIN}', '/?url={DOMAIN}', '/ping?url={DOMAIN}'],
    },
    general: {
      subdomains: ['check', 'lookup', 'search', 'find', 'discover', 'explore', 'tool', 'web-tool', 'online-tool', 'free-tool'],
      paths: ['/check/{DOMAIN}', '/lookup/{DOMAIN}', '/{DOMAIN}', '/search?q={DOMAIN}', '/analyze/{DOMAIN}', '/test/{DOMAIN}', '/scan/{DOMAIN}', '/inspect/{DOMAIN}', '/examine/{DOMAIN}', '/verify/{DOMAIN}'],
    },
    llm_indexing: {
      subdomains: ['ai', 'ml', 'search', 'knowledge', 'data', 'index', 'graph', 'semantic', 'entity', 'structured'],
      paths: ['/search?q={DOMAIN}', '/{DOMAIN}', '/entity/{DOMAIN}', '/knowledge/{DOMAIN}', '/lookup/{DOMAIN}', '/find/{DOMAIN}', '/discover/{DOMAIN}', '/index/{DOMAIN}', '/data/{DOMAIN}', '/info/{DOMAIN}'],
    },
  };

  // Generate: {subdomain}.{country}.{ext}{path}
  for (const [category, config] of Object.entries(categoryConfig)) {
    const { subdomains, paths } = config;
    for (const cc of countries) {
      for (const ext of extensions.slice(0, 8)) {
        for (const sub of subdomains.slice(0, 5)) {
          for (const p of paths.slice(0, 3)) {
            add(`${category.slice(0, 4).toUpperCase()} ${sub}.${cc}.${ext}`, `https://${sub}.${cc}.${ext}${p}`, category);
          }
        }
      }
    }

    // Generate: {subdomain}-{country}.{ext}{path}
    for (const cc of countries.slice(0, 60)) {
      for (const ext of extensions.slice(0, 4)) {
        for (const sub of subdomains.slice(0, 3)) {
          for (const p of paths.slice(0, 2)) {
            add(`${category.slice(0, 4).toUpperCase()} ${sub}-${cc}.${ext}`, `https://${sub}-${cc}.${ext}${p}`, category);
          }
        }
      }
    }

    // Generate: {country}-{subdomain}.{ext}{path}
    for (const cc of countries.slice(0, 60)) {
      for (const ext of extensions.slice(0, 4)) {
        for (const sub of subdomains.slice(0, 3)) {
          for (const p of paths.slice(0, 2)) {
            add(`${category.slice(0, 4).toUpperCase()} ${cc}-${sub}.${ext}`, `https://${cc}-${sub}.${ext}${p}`, category);
          }
        }
      }
    }
  }

  console.log(`[MassGen] After regional TLD generation: ${endpoints.length.toLocaleString()}`);

  // DNS record type variants
  const dnsTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'SRV', 'CAA', 'PTR', 'DMARC', 'SPF', 'DKIM'];
  for (const rtype of dnsTypes) {
    for (const cc of countries.slice(0, 40)) {
      for (const ext of extensions.slice(0, 4)) {
        add(`DNS ${rtype} ${cc}.${ext}`, `https://dns.${cc}.${ext}/${rtype}/{DOMAIN}`, 'dns_lookup');
        add(`DNS ${rtype} check-${cc}.${ext}`, `https://dns-check.${cc}.${ext}/${rtype}/{DOMAIN}`, 'dns_lookup');
      }
    }
  }

  // Google regional domains
  const googleTlds = [
    'co.uk', 'ca', 'com.au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'pt',
    'com.br', 'com.mx', 'com.ar', 'cl', 'co', 'co.jp', 'co.kr', 'com.tw',
    'com.hk', 'com.sg', 'co.in', 'ru', 'pl', 'cz', 'se', 'dk', 'no', 'fi',
    'ie', 'co.nz', 'co.za', 'com.ng', 'co.ke', 'com.eg', 'com.sa', 'ae',
    'co.il', 'com.tr', 'gr', 'at', 'ch', 'hu', 'ro', 'bg', 'hr', 'rs',
  ];
  const searchOps = ['site:', 'link:', 'related:', 'info:', 'cache:', 'intitle:', 'inurl:'];
  for (const tld of googleTlds) {
    for (const q of searchOps) {
      add(`Google ${tld} ${q}`, `https://www.google.${tld}/search?q=${q}{DOMAIN}`, 'general');
    }
  }

  // Wikipedia in many languages
  for (const lang of languages) {
    add(`Wikipedia ${lang}`, `https://${lang}.wikipedia.org/w/index.php?search={DOMAIN}`, 'llm_indexing');
  }

  // Tool domain prefixes x category keywords
  const prefixes = [
    'check', 'test', 'scan', 'audit', 'analyze', 'verify', 'inspect', 'monitor',
    'probe', 'examine', 'evaluate', 'assess', 'grade', 'score', 'rate', 'rank',
    'measure', 'benchmark', 'profile', 'review', 'report', 'lookup', 'find',
    'discover', 'explore', 'search', 'query', 'fetch', 'get', 'view',
  ];
  const catKeywords: Record<string, string[]> = {
    whois: ['whois', 'domain', 'registrar', 'registration', 'owner'],
    dns_lookup: ['dns', 'nameserver', 'resolver', 'dig', 'nslookup'],
    seo_analyzer: ['seo', 'website', 'page', 'site', 'web'],
    speed_test: ['speed', 'performance', 'load', 'pagespeed', 'fast'],
    security_scan: ['security', 'ssl', 'safe', 'secure', 'protect'],
    website_info: ['info', 'stats', 'traffic', 'value', 'worth'],
    social_bookmark: ['bookmark', 'save', 'share', 'social', 'link'],
    directory: ['directory', 'list', 'catalog', 'index', 'register'],
    web_archive: ['archive', 'cache', 'wayback', 'snapshot', 'history'],
    ping_service: ['ping', 'notify', 'update', 'alert', 'signal'],
    general: ['tool', 'check', 'analyze', 'test', 'scan'],
    llm_indexing: ['ai', 'knowledge', 'search', 'data', 'index'],
  };

  for (const [category, keywords] of Object.entries(catKeywords)) {
    for (const prefix of prefixes.slice(0, 30)) {
      for (const kw of keywords.slice(0, 3)) {
        for (const ext of extensions.slice(0, 6)) {
          const domain = `${prefix}${kw}.${ext}`;
          add(`${category.slice(0, 4).toUpperCase()} ${domain}`, `https://www.${domain}/{DOMAIN}`, category);
          add(`${category.slice(0, 4).toUpperCase()} ${domain}/check`, `https://www.${domain}/check/{DOMAIN}`, category);
        }
      }
    }
  }

  // Numbered tool sites
  for (const [category, keywords] of Object.entries(catKeywords)) {
    for (const kw of keywords.slice(0, 2)) {
      for (let num = 1; num <= 200; num++) {
        for (const ext of ['com', 'net', 'org']) {
          add(`${category.slice(0, 4).toUpperCase()} ${kw}${num}.${ext}`, `https://www.${kw}${num}.${ext}/{DOMAIN}`, category);
        }
      }
    }
  }

  // Multi-language variants
  for (const [category, keywords] of Object.entries(catKeywords)) {
    for (const lang of languages.slice(0, 30)) {
      for (const kw of keywords.slice(0, 2)) {
        for (const ext of extensions.slice(0, 4)) {
          add(`${category.slice(0, 4).toUpperCase()} ${lang}-${kw}.${ext}`, `https://www.${lang}-${kw}.${ext}/{DOMAIN}`, category);
          add(`${category.slice(0, 4).toUpperCase()} ${lang}.${kw}.${ext}`, `https://${lang}.${kw}.${ext}/{DOMAIN}`, category);
        }
      }
    }
  }

  console.log(`[MassGen] Total endpoints generated: ${endpoints.length.toLocaleString()}`);
  return endpoints;
}
