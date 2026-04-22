export interface EndpointEntry {
  name: string;
  url_template: string;
  category: string;
}

export function getAllEndpoints(): EndpointEntry[] {
  return [
    ...getWhoisEndpoints(),
    ...getDnsEndpoints(),
    ...getSeoAnalyzerEndpoints(),
    ...getSpeedTestEndpoints(),
    ...getSecurityEndpoints(),
    ...getWebArchiveEndpoints(),
    ...getWebsiteInfoEndpoints(),
    ...getPingEndpoints(),
    ...getSocialBookmarkEndpoints(),
    ...getDirectoryEndpoints(),
    ...getGeneralEndpoints(),
  ];
}

function getWhoisEndpoints(): EndpointEntry[] {
  return [
    { name: 'Who.is', url_template: 'https://who.is/whois/{DOMAIN}', category: 'whois' },
    { name: 'WhoisRequest', url_template: 'https://whoisrequest.com/whois/{DOMAIN}', category: 'whois' },
    { name: 'ICANN WHOIS', url_template: 'https://lookup.icann.org/en/lookup?name={DOMAIN}', category: 'whois' },
    { name: 'DomainTools', url_template: 'https://whois.domaintools.com/{DOMAIN}', category: 'whois' },
    { name: 'Whois.com', url_template: 'https://www.whois.com/whois/{DOMAIN}', category: 'whois' },
    { name: 'DomainBigData', url_template: 'https://domainbigdata.com/{DOMAIN}', category: 'whois' },
    { name: 'Whoxy', url_template: 'https://www.whoxy.com/{DOMAIN}', category: 'whois' },
    { name: 'EasyWhois', url_template: 'https://www.easywhois.com/{DOMAIN}', category: 'whois' },
    { name: 'Gwhois', url_template: 'https://gwhois.org/{DOMAIN}', category: 'whois' },
    { name: 'WhoisHosting', url_template: 'https://www.whoishostingthis.com/{DOMAIN}', category: 'whois' },
    { name: 'HostAdvice WHOIS', url_template: 'https://hostadvice.com/tools/whois/{DOMAIN}', category: 'whois' },
    { name: 'WHOISology', url_template: 'https://whoisology.com/{DOMAIN}', category: 'whois' },
    { name: 'DomainWatch', url_template: 'https://domainwat.ch/site/{DOMAIN}', category: 'whois' },
    { name: 'WhoisXY', url_template: 'https://www.whoisxy.com/{DOMAIN}', category: 'whois' },
    { name: 'DomainIQ', url_template: 'https://www.domainiq.com/snapshot/{DOMAIN}', category: 'whois' },
    { name: 'Marcaria WHOIS', url_template: 'https://whois.marcaria.com/en/result?domain={DOMAIN}', category: 'whois' },
    { name: 'IANA WHOIS', url_template: 'https://www.iana.org/whois?q={DOMAIN}', category: 'whois' },
    { name: 'Domfind', url_template: 'https://www.domfind.com/{DOMAIN}', category: 'whois' },
    { name: 'ThatsThem WHOIS', url_template: 'https://thatsthem.com/whois/{DOMAIN}', category: 'whois' },
    { name: 'WhoisFreaks', url_template: 'https://whoisfreaks.com/tools/whois/lookup/{DOMAIN}', category: 'whois' },
    { name: 'WhoAPI', url_template: 'https://whoapi.com/domain/{DOMAIN}', category: 'whois' },
    { name: 'Namecheap WHOIS', url_template: 'https://www.namecheap.com/domains/whois/result?domain={DOMAIN}', category: 'whois' },
    { name: 'GoDaddy WHOIS', url_template: 'https://www.godaddy.com/whois/results.aspx?domain={DOMAIN}', category: 'whois' },
    { name: 'Google Admin WHOIS', url_template: 'https://domains.google.com/registrar?s={DOMAIN}', category: 'whois' },
    { name: 'Register.com WHOIS', url_template: 'https://www.register.com/whois.rcmx?domain={DOMAIN}', category: 'whois' },
    { name: 'Name.com WHOIS', url_template: 'https://www.name.com/whois/{DOMAIN}', category: 'whois' },
    { name: 'Dynadot WHOIS', url_template: 'https://www.dynadot.com/domain/search?domain={DOMAIN}', category: 'whois' },
    { name: 'Porkbun WHOIS', url_template: 'https://porkbun.com/products/domains?search={DOMAIN}', category: 'whois' },
    { name: 'Hover WHOIS', url_template: 'https://www.hover.com/domains/results?q={DOMAIN}', category: 'whois' },
    { name: 'Gandi WHOIS', url_template: 'https://www.gandi.net/whois?search={DOMAIN}', category: 'whois' },
  ];
}

function getDnsEndpoints(): EndpointEntry[] {
  return [
    { name: 'WhoisXML DNS', url_template: 'https://dns-lookup.whoisxmlapi.com/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS', url_template: 'https://viewdns.info/whois/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSlytics', url_template: 'https://dnslytics.com/domain/{DOMAIN}', category: 'dns_lookup' },
    { name: 'SecurityTrails', url_template: 'https://securitytrails.com/domain/{DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSdumpster', url_template: 'https://dnsdumpster.com/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'MXToolbox DNS', url_template: 'https://mxtoolbox.com/SuperTool.aspx?action=dns:{DOMAIN}', category: 'dns_lookup' },
    { name: 'IntoDNS', url_template: 'https://intodns.com/{DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSChecker', url_template: 'https://dnschecker.org/all-dns-records-of-domain.php?query={DOMAIN}', category: 'dns_lookup' },
    { name: 'WhatMyDNS', url_template: 'https://www.whatsmydns.net/#A/{DOMAIN}', category: 'dns_lookup' },
    { name: 'NSLookup.io', url_template: 'https://www.nslookup.io/domains/{DOMAIN}/dns-records/', category: 'dns_lookup' },
    { name: 'DNSWatch', url_template: 'https://www.dnswatch.info/dns/dnslookup?la=en&host={DOMAIN}', category: 'dns_lookup' },
    { name: 'LeafDNS', url_template: 'https://leafdns.com/lookup/{DOMAIN}', category: 'dns_lookup' },
    { name: 'Kloth DNS', url_template: 'http://www.kloth.net/services/nslookup.php?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSQuery', url_template: 'https://dnsquery.org/dnsquery/{DOMAIN}/A/', category: 'dns_lookup' },
    { name: 'NsLookup Tool', url_template: 'https://nslookup.io/domains/{DOMAIN}/', category: 'dns_lookup' },
    { name: 'MXToolbox MX', url_template: 'https://mxtoolbox.com/SuperTool.aspx?action=mx:{DOMAIN}', category: 'dns_lookup' },
    { name: 'MXToolbox SPF', url_template: 'https://mxtoolbox.com/SuperTool.aspx?action=spf:{DOMAIN}', category: 'dns_lookup' },
    { name: 'MXToolbox DMARC', url_template: 'https://mxtoolbox.com/SuperTool.aspx?action=dmarc:{DOMAIN}', category: 'dns_lookup' },
    { name: 'MXToolbox Blacklist', url_template: 'https://mxtoolbox.com/SuperTool.aspx?action=blacklist:{DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS Reverse', url_template: 'https://viewdns.info/reverseip/?host={DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS Propagation', url_template: 'https://viewdns.info/propagation/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS Port', url_template: 'https://viewdns.info/portscan/?host={DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS Location', url_template: 'https://viewdns.info/iplocation/?ip={DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS Chinese', url_template: 'https://viewdns.info/chinesefirewall/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'ViewDNS Traceroute', url_template: 'https://viewdns.info/traceroute/?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'Robtex', url_template: 'https://www.robtex.com/dns-lookup/{DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSStuff', url_template: 'https://www.dnsstuff.com/tools#dns/{DOMAIN}', category: 'dns_lookup' },
    { name: 'HackerTarget DNS', url_template: 'https://hackertarget.com/dns-lookup/?q={DOMAIN}', category: 'dns_lookup' },
    { name: 'HackerTarget Zone', url_template: 'https://hackertarget.com/zone-transfer/?q={DOMAIN}', category: 'dns_lookup' },
    { name: 'HackerTarget Reverse', url_template: 'https://hackertarget.com/reverse-dns-lookup/?q={DOMAIN}', category: 'dns_lookup' },
    { name: 'DNSViz', url_template: 'https://dnsviz.net/d/{DOMAIN}/dnssec/', category: 'dns_lookup' },
    { name: 'CentralOps', url_template: 'https://centralops.net/co/DomainDossier.aspx?addr={DOMAIN}&dom_whois=true&dom_dns=true&net_whois=true', category: 'dns_lookup' },
    { name: 'UltraTools DNS', url_template: 'https://www.ultratools.com/tools/dnsLookupResult?domain={DOMAIN}', category: 'dns_lookup' },
    { name: 'Network-Tools', url_template: 'https://network-tools.com/nslookup/{DOMAIN}/', category: 'dns_lookup' },
    { name: 'DNSMap', url_template: 'https://dnsmap.io/#A/{DOMAIN}', category: 'dns_lookup' },
  ];
}

function getSeoAnalyzerEndpoints(): EndpointEntry[] {
  return [
    { name: 'Nibbler', url_template: 'https://nibbler.insites.com/en/reports/{DOMAIN}', category: 'seo_analyzer' },
    { name: 'SEOptimer', url_template: 'https://www.seoptimer.com/{DOMAIN}', category: 'seo_analyzer' },
    { name: 'SiteChecker', url_template: 'https://sitechecker.pro/app/main/project?input={URL}', category: 'seo_analyzer' },
    { name: 'SEOSiteCheckup', url_template: 'https://seositecheckup.com/analysis/{URL}', category: 'seo_analyzer' },
    { name: 'WooRank', url_template: 'https://www.woorank.com/en/teaser/{DOMAIN}', category: 'seo_analyzer' },
    { name: 'Ahrefs Checker', url_template: 'https://ahrefs.com/website-authority-checker/?input={DOMAIN}', category: 'seo_analyzer' },
    { name: 'Neil Patel', url_template: 'https://neilpatel.com/seo-analyzer/result/?url={URL}', category: 'seo_analyzer' },
    { name: 'SEO Review Tools', url_template: 'https://www.seoreviewtools.com/seo-authority-checker/?url={URL}', category: 'seo_analyzer' },
    { name: 'SEMrush Site Audit', url_template: 'https://www.semrush.com/analytics/overview/?q={DOMAIN}', category: 'seo_analyzer' },
    { name: 'Moz DA Checker', url_template: 'https://moz.com/domain-analysis?site={DOMAIN}', category: 'seo_analyzer' },
    { name: 'SmallSEOTools', url_template: 'https://smallseotools.com/website-seo-score-checker/?url={URL}', category: 'seo_analyzer' },
    { name: 'SEOquake', url_template: 'https://www.seoquake.com/tools/?url={URL}', category: 'seo_analyzer' },
    { name: 'Ubersuggest', url_template: 'https://app.neilpatel.com/en/traffic_analyzer/overview?domain={DOMAIN}', category: 'seo_analyzer' },
    { name: 'SpyFu', url_template: 'https://www.spyfu.com/overview/domain?query={DOMAIN}', category: 'seo_analyzer' },
    { name: 'SERPstat', url_template: 'https://serpstat.com/domains/?query={DOMAIN}', category: 'seo_analyzer' },
    { name: 'Majestic', url_template: 'https://majestic.com/reports/site-explorer?q={DOMAIN}', category: 'seo_analyzer' },
    { name: 'SEO PowerSuite', url_template: 'https://www.link-assistant.com/seo-tools/check-domain-authority/?url={DOMAIN}', category: 'seo_analyzer' },
    { name: 'RankWatch', url_template: 'https://www.rankwatch.com/tools/free-backlink-checker.html?url={DOMAIN}', category: 'seo_analyzer' },
    { name: 'Searchmetrics', url_template: 'https://suite.searchmetrics.com/en/research/domains/organic?url={DOMAIN}', category: 'seo_analyzer' },
    { name: 'WebCEO', url_template: 'https://www.webceo.com/seo-tools/quick-domain-analysis-tool/?domain={DOMAIN}', category: 'seo_analyzer' },
    { name: 'SEOProfiler', url_template: 'https://www.seoprofiler.com/analyze/{DOMAIN}', category: 'seo_analyzer' },
    { name: 'MonitorBacklinks', url_template: 'https://monitorbacklinks.com/seo-tools/free-backlink-checker/?url={DOMAIN}', category: 'seo_analyzer' },
    { name: 'LinkMiner', url_template: 'https://linkminer.com/check?url={DOMAIN}', category: 'seo_analyzer' },
    { name: 'SEranking', url_template: 'https://seranking.com/research.html?source=main&input={DOMAIN}', category: 'seo_analyzer' },
    { name: 'CognitiveSEO', url_template: 'https://cognitiveseo.com/site-explorer.php?q={DOMAIN}', category: 'seo_analyzer' },
  ];
}

function getSpeedTestEndpoints(): EndpointEntry[] {
  return [
    { name: 'WebPageTest', url_template: 'https://www.webpagetest.org/?url={URL}', category: 'speed_test' },
    { name: 'GTmetrix', url_template: 'https://gtmetrix.com/?url={URL}', category: 'speed_test' },
    { name: 'PageSpeed Insights', url_template: 'https://pagespeed.web.dev/analysis?url={URL}', category: 'speed_test' },
    { name: 'Pingdom', url_template: 'https://tools.pingdom.com/#!{URL}', category: 'speed_test' },
    { name: 'Uptrends Speed', url_template: 'https://www.uptrends.com/tools/website-speed-test?url={URL}', category: 'speed_test' },
    { name: 'DareBoost', url_template: 'https://www.dareboost.com/en/report/{URL}', category: 'speed_test' },
    { name: 'KeyCDN Speed', url_template: 'https://tools.keycdn.com/speed?url={URL}', category: 'speed_test' },
    { name: 'Dotcom Monitor', url_template: 'https://www.dotcom-monitor.com/free-website-speed-test/?url={URL}', category: 'speed_test' },
    { name: 'GiftOfSpeed', url_template: 'https://www.giftofspeed.com/?url={URL}', category: 'speed_test' },
    { name: 'WebPageAnalyzer', url_template: 'https://www.websiteoptimization.com/services/analyze/?url={URL}', category: 'speed_test' },
    { name: 'Varvy Speed', url_template: 'https://varvy.com/pagespeed/?url={URL}', category: 'speed_test' },
    { name: 'ByteCheck', url_template: 'https://www.bytecheck.com/results?resource={URL}', category: 'speed_test' },
    { name: 'Geekflare Speed', url_template: 'https://gf.dev/website-audit?url={URL}', category: 'speed_test' },
    { name: 'DebugBear', url_template: 'https://www.debugbear.com/test/website-speed/{URL}', category: 'speed_test' },
    { name: 'Yellow Lab Tools', url_template: 'https://yellowlab.tools/?url={URL}', category: 'speed_test' },
    { name: 'Lighthouse Report', url_template: 'https://googlechrome.github.io/lighthouse/viewer/?psiurl={URL}', category: 'speed_test' },
    { name: 'Cloudflare Speed', url_template: 'https://speed.cloudflare.com/test?url={URL}', category: 'speed_test' },
    { name: 'Load Impact', url_template: 'https://loadimpact.com/load-test/{URL}', category: 'speed_test' },
    { name: 'Chrome UX Report', url_template: 'https://developers.google.com/speed/docs/insights/v5/get-started?url={URL}', category: 'speed_test' },
    { name: 'Web Vitals Checker', url_template: 'https://web-vitals-checker.com/?url={URL}', category: 'speed_test' },
  ];
}

function getSecurityEndpoints(): EndpointEntry[] {
  return [
    { name: 'SSL Labs', url_template: 'https://www.ssllabs.com/ssltest/analyze.html?d={DOMAIN}', category: 'security_scan' },
    { name: 'SecurityHeaders', url_template: 'https://securityheaders.com/?q={URL}&followRedirects=on', category: 'security_scan' },
    { name: 'Mozilla Observatory', url_template: 'https://observatory.mozilla.org/analyze/{DOMAIN}', category: 'security_scan' },
    { name: 'VirusTotal', url_template: 'https://www.virustotal.com/gui/domain/{DOMAIN}', category: 'security_scan' },
    { name: 'Sucuri SiteCheck', url_template: 'https://sitecheck.sucuri.net/results/{URL}', category: 'security_scan' },
    { name: 'URLVoid', url_template: 'https://www.urlvoid.com/scan/{DOMAIN}/', category: 'security_scan' },
    { name: 'ImmuniWeb SSLTest', url_template: 'https://www.immuniweb.com/ssl/{DOMAIN}/', category: 'security_scan' },
    { name: 'CryptCheck', url_template: 'https://tls.imirhil.fr/https/{DOMAIN}', category: 'security_scan' },
    { name: 'Hardenize', url_template: 'https://www.hardenize.com/report/{DOMAIN}', category: 'security_scan' },
    { name: 'CSP Evaluator', url_template: 'https://csp-evaluator.withgoogle.com/?url={URL}', category: 'security_scan' },
    { name: 'Pentest Tools SSL', url_template: 'https://pentest-tools.com/network-vulnerability-scanning/ssl-tls-scanner?target={DOMAIN}', category: 'security_scan' },
    { name: 'Quttera Scan', url_template: 'https://quttera.com/detailed_report/{DOMAIN}', category: 'security_scan' },
    { name: 'SiteGuarding', url_template: 'https://www.siteguarding.com/en/sitecheck/{DOMAIN}', category: 'security_scan' },
    { name: 'Web Inspector', url_template: 'https://app.webinspector.com/public/reports/scan/{DOMAIN}', category: 'security_scan' },
    { name: 'Google Safe Browsing', url_template: 'https://transparencyreport.google.com/safe-browsing/search?url={URL}', category: 'security_scan' },
    { name: 'Norton Safe Web', url_template: 'https://safeweb.norton.com/report?url={DOMAIN}', category: 'security_scan' },
    { name: 'McAfee SiteAdvisor', url_template: 'https://www.siteadvisor.com/sitereport.html?url={DOMAIN}', category: 'security_scan' },
    { name: 'BitDefender TrafficLight', url_template: 'https://trafficlight.bitdefender.com/info?url={URL}', category: 'security_scan' },
    { name: 'PhishTank', url_template: 'https://www.phishtank.com/target_search.php?target_url={URL}', category: 'security_scan' },
    { name: 'URLScan.io', url_template: 'https://urlscan.io/search/#domain:{DOMAIN}', category: 'security_scan' },
    { name: 'Shodan', url_template: 'https://www.shodan.io/search?query=hostname:{DOMAIN}', category: 'security_scan' },
    { name: 'Censys', url_template: 'https://search.censys.io/hosts/{DOMAIN}', category: 'security_scan' },
    { name: 'ThreatCrowd', url_template: 'https://threatcrowd.org/domain.php?domain={DOMAIN}', category: 'security_scan' },
    { name: 'HostedScan', url_template: 'https://hostedscan.com/scan/{DOMAIN}', category: 'security_scan' },
    { name: 'Detectify', url_template: 'https://detectify.com/external-scan?url={DOMAIN}', category: 'security_scan' },
  ];
}

function getWebArchiveEndpoints(): EndpointEntry[] {
  return [
    { name: 'Wayback Machine', url_template: 'https://web.archive.org/web/{URL}', category: 'web_archive' },
    { name: 'Archive.today', url_template: 'https://archive.ph/?url={URL}', category: 'web_archive' },
    { name: 'Google Cache', url_template: 'https://webcache.googleusercontent.com/search?q=cache:{URL}', category: 'web_archive' },
    { name: 'CachedView', url_template: 'https://cachedview.nl/#{URL}', category: 'web_archive' },
    { name: 'Wayback CDX', url_template: 'https://web.archive.org/cdx/search/cdx?url={DOMAIN}&output=text', category: 'web_archive' },
    { name: 'CommonCrawl', url_template: 'https://index.commoncrawl.org/CC-MAIN-2024-10-index?url={DOMAIN}&output=json', category: 'web_archive' },
    { name: 'Timetravel', url_template: 'https://timetravel.mementoweb.org/list/20240101000000/{URL}', category: 'web_archive' },
    { name: 'Archive.org Search', url_template: 'https://archive.org/search?query={DOMAIN}', category: 'web_archive' },
    { name: 'Webcite', url_template: 'https://www.webcitation.org/query?url={URL}', category: 'web_archive' },
    { name: 'Perma.cc Lookup', url_template: 'https://perma.cc/search?q={URL}', category: 'web_archive' },
  ];
}

function getWebsiteInfoEndpoints(): EndpointEntry[] {
  return [
    { name: 'SimilarWeb', url_template: 'https://www.similarweb.com/website/{DOMAIN}/', category: 'website_info' },
    { name: 'BuiltWith', url_template: 'https://builtwith.com/{DOMAIN}', category: 'website_info' },
    { name: 'W3Techs', url_template: 'https://w3techs.com/sites/info/{DOMAIN}', category: 'website_info' },
    { name: 'Netcraft', url_template: 'https://sitereport.netcraft.com/?url={URL}', category: 'website_info' },
    { name: 'Wappalyzer', url_template: 'https://www.wappalyzer.com/lookup/{DOMAIN}/', category: 'website_info' },
    { name: 'HypeStat', url_template: 'https://hypestat.com/info/{DOMAIN}', category: 'website_info' },
    { name: 'StatShow', url_template: 'https://www.statshow.com/www/{DOMAIN}', category: 'website_info' },
    { name: 'SitePriceChecker', url_template: 'https://www.siteprice.org/website-worth/{DOMAIN}', category: 'website_info' },
    { name: 'WorthOfWeb', url_template: 'https://www.worthofweb.com/website-value/{DOMAIN}/', category: 'website_info' },
    { name: 'WebsiteOutlook', url_template: 'https://www.websiteoutlook.com/{DOMAIN}', category: 'website_info' },
    { name: 'Cutestat', url_template: 'https://www.cutestat.com/{DOMAIN}', category: 'website_info' },
    { name: 'Statvoo', url_template: 'https://statvoo.com/website/{DOMAIN}', category: 'website_info' },
    { name: 'Alexa Archive', url_template: 'https://web.archive.org/web/2022/https://www.alexa.com/siteinfo/{DOMAIN}', category: 'website_info' },
    { name: 'Serpstat Domain', url_template: 'https://serpstat.com/domains/?query={DOMAIN}', category: 'website_info' },
    { name: 'WebsiteIQ', url_template: 'https://website.informer.com/{DOMAIN}', category: 'website_info' },
    { name: 'SiteWorthTraffic', url_template: 'https://www.siteworthtraffic.com/report/{DOMAIN}', category: 'website_info' },
    { name: 'EstiBot', url_template: 'https://www.estibot.com/appraisal.php?domain={DOMAIN}', category: 'website_info' },
    { name: 'SitePrice', url_template: 'https://www.siteprice.org/website-worth/{DOMAIN}', category: 'website_info' },
    { name: 'WorthBlogger', url_template: 'https://www.worthblogger.com/check/{DOMAIN}', category: 'website_info' },
    { name: 'YourWebsiteValue', url_template: 'https://www.yourwebsitevalue.com/{DOMAIN}', category: 'website_info' },
    { name: 'AinuPage', url_template: 'https://www.ainupage.com/{DOMAIN}', category: 'website_info' },
    { name: 'Sitescout', url_template: 'https://sitescout.com/report/{DOMAIN}', category: 'website_info' },
    { name: 'WebStatsDomain', url_template: 'https://www.webstatsdomain.com/d/{DOMAIN}', category: 'website_info' },
    { name: 'Statscrop', url_template: 'https://www.statscrop.com/www/{DOMAIN}', category: 'website_info' },
    { name: 'SiteTrail', url_template: 'https://www.sitetrail.com/{DOMAIN}', category: 'website_info' },
    { name: 'WhoIsLinkCount', url_template: 'https://www.whoislinkcount.com/{DOMAIN}', category: 'website_info' },
    { name: 'Compete', url_template: 'https://siteanalytics.compete.com/{DOMAIN}', category: 'website_info' },
    { name: 'Quantcast', url_template: 'https://www.quantcast.com/{DOMAIN}', category: 'website_info' },
    { name: 'Web Archive Profile', url_template: 'https://web.archive.org/web/20230101000000*/{DOMAIN}', category: 'website_info' },
    { name: 'RankSignals', url_template: 'https://www.ranksignals.com/{DOMAIN}', category: 'website_info' },
    { name: 'SiteGur', url_template: 'https://sitegur.com/{DOMAIN}', category: 'website_info' },
    { name: 'FreeWebAnalytics', url_template: 'https://www.freewebanalytics.com/{DOMAIN}', category: 'website_info' },
    { name: 'IPAddress.com', url_template: 'https://www.ipaddress.com/website/{DOMAIN}', category: 'website_info' },
    { name: 'WebsiteSEOChecker', url_template: 'https://www.websiteseochecker.com/audit/{DOMAIN}', category: 'website_info' },
    { name: 'PageGlimpse', url_template: 'http://www.pageglimpse.com/{DOMAIN}', category: 'website_info' },
  ];
}

function getPingEndpoints(): EndpointEntry[] {
  return [
    { name: 'Google Ping', url_template: 'https://www.google.com/ping?sitemap={URL}', category: 'ping_service' },
    { name: 'Bing Ping', url_template: 'https://www.bing.com/ping?sitemap={URL}', category: 'ping_service' },
    { name: 'Pingomatic', url_template: 'http://pingomatic.com/ping/?title=Page&blogurl={URL}&rssurl=&chk_weblogscom=on&chk_blogs=on&chk_feedburner=on&chk_newsgator=on&chk_myyahoo=on&chk_pubsubcom=on&chk_blogdigger=on&chk_weblogalot=on&chk_newsisfree=on&chk_topicexchange=on&chk_google=on&chk_tailrank=on&chk_bloglines=on&chk_postrank=on&chk_skygrid=on&chk_collecta=on&chk_superfeedr=on', category: 'ping_service' },
    { name: 'Twingly Ping', url_template: 'https://rpc.twingly.com/ping', category: 'ping_service' },
    { name: 'FeedBurner Ping', url_template: 'https://feedburner.google.com/fb/a/pingSubmit?bloglink={URL}', category: 'ping_service' },
    { name: 'Ping.Blo.gs', url_template: 'https://ping.blo.gs/rest/notify/{URL}', category: 'ping_service' },
    { name: 'BlogPing', url_template: 'http://www.blogping.com/index.php?url={URL}', category: 'ping_service' },
    { name: 'PingMyBlog', url_template: 'http://pingmyblog.com/ping?url={URL}', category: 'ping_service' },
    { name: 'AutoPinger', url_template: 'http://www.autopinger.com/?url={URL}', category: 'ping_service' },
    { name: 'ICerocket Ping', url_template: 'https://www.icerocket.com/c?p=ping&blogurl={URL}', category: 'ping_service' },
  ];
}

function getSocialBookmarkEndpoints(): EndpointEntry[] {
  return [
    { name: 'Reddit Submit', url_template: 'https://www.reddit.com/submit?url={URL}', category: 'social_bookmark' },
    { name: 'Pinterest Pin', url_template: 'https://www.pinterest.com/pin/create/button/?url={URL}', category: 'social_bookmark' },
    { name: 'LinkedIn Share', url_template: 'https://www.linkedin.com/sharing/share-offsite/?url={URL}', category: 'social_bookmark' },
    { name: 'Facebook Share', url_template: 'https://www.facebook.com/sharer/sharer.php?u={URL}', category: 'social_bookmark' },
    { name: 'Twitter Share', url_template: 'https://twitter.com/intent/tweet?url={URL}', category: 'social_bookmark' },
    { name: 'Tumblr Share', url_template: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={URL}', category: 'social_bookmark' },
    { name: 'Pocket Save', url_template: 'https://getpocket.com/save?url={URL}', category: 'social_bookmark' },
    { name: 'Mix StumbleUpon', url_template: 'https://mix.com/add?url={URL}', category: 'social_bookmark' },
    { name: 'Diigo Bookmark', url_template: 'https://www.diigo.com/post?url={URL}', category: 'social_bookmark' },
    { name: 'Flipboard', url_template: 'https://share.flipboard.com/bookmarklet/popout?v=2&url={URL}', category: 'social_bookmark' },
    { name: 'Blogger Post', url_template: 'https://www.blogger.com/blog-this.g?u={URL}', category: 'social_bookmark' },
    { name: 'WordPress Press', url_template: 'https://wordpress.com/press-this.php?u={URL}', category: 'social_bookmark' },
    { name: 'Evernote Clip', url_template: 'https://www.evernote.com/clip.action?url={URL}', category: 'social_bookmark' },
    { name: 'Buffer Share', url_template: 'https://bufferapp.com/add?url={URL}', category: 'social_bookmark' },
    { name: 'HackerNews', url_template: 'https://news.ycombinator.com/submitlink?u={URL}', category: 'social_bookmark' },
    { name: 'Slashdot', url_template: 'https://slashdot.org/bookmark.pl?url={URL}', category: 'social_bookmark' },
    { name: 'VK Share', url_template: 'https://vk.com/share.php?url={URL}', category: 'social_bookmark' },
    { name: 'Telegram Share', url_template: 'https://t.me/share/url?url={URL}', category: 'social_bookmark' },
    { name: 'WhatsApp Share', url_template: 'https://api.whatsapp.com/send?text={URL}', category: 'social_bookmark' },
    { name: 'Line Share', url_template: 'https://social-plugins.line.me/lineit/share?url={URL}', category: 'social_bookmark' },
    { name: 'Weibo Share', url_template: 'https://service.weibo.com/share/share.php?url={URL}', category: 'social_bookmark' },
    { name: 'Xing Share', url_template: 'https://www.xing.com/spi/shares/new?url={URL}', category: 'social_bookmark' },
    { name: 'Hacker News Fire', url_template: 'https://news.ycombinator.com/from?site={DOMAIN}', category: 'social_bookmark' },
    { name: 'Instapaper', url_template: 'https://www.instapaper.com/hello2?url={URL}', category: 'social_bookmark' },
    { name: 'Delicious', url_template: 'https://del.icio.us/save?url={URL}', category: 'social_bookmark' },
    { name: 'Folkd', url_template: 'http://www.folkd.com/submit/{URL}', category: 'social_bookmark' },
    { name: 'BibSonomy', url_template: 'https://www.bibsonomy.org/BibtexHandler?requTask=upload&url={URL}', category: 'social_bookmark' },
    { name: 'Newsvine', url_template: 'http://www.newsvine.com/_tools/seed&save?u={URL}', category: 'social_bookmark' },
    { name: 'Scoopit', url_template: 'https://www.scoop.it/bookmarklet?url={URL}', category: 'social_bookmark' },
    { name: 'Plurk', url_template: 'https://www.plurk.com/?qualifier=shares&status={URL}', category: 'social_bookmark' },
  ];
}

function getDirectoryEndpoints(): EndpointEntry[] {
  return [
    { name: 'DMOZ Mirror', url_template: 'https://dmoz-odp.org/search?q={DOMAIN}', category: 'directory' },
    { name: 'Jasmine Dir', url_template: 'https://www.jasminedirectory.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'Alive Dir', url_template: 'https://www.alivedirectory.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'SoMuch Dir', url_template: 'https://www.somuch.com/search/?q={DOMAIN}', category: 'directory' },
    { name: 'ABLocal', url_template: 'https://www.ablocal.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'Spoke', url_template: 'https://www.spoke.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'HotFrog', url_template: 'https://www.hotfrog.com/search/{DOMAIN}', category: 'directory' },
    { name: 'Brownbook', url_template: 'https://www.brownbook.net/search/?q={DOMAIN}', category: 'directory' },
    { name: 'CitySquares', url_template: 'https://citysquares.com/s/{DOMAIN}', category: 'directory' },
    { name: 'EZLocal', url_template: 'https://ezlocal.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'Fyple', url_template: 'https://www.fyple.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'Cylex', url_template: 'https://www.cylex.us.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'Tupalo', url_template: 'https://www.tupalo.co/search?q={DOMAIN}', category: 'directory' },
    { name: 'Wand Dir', url_template: 'https://www.wand.com/search?q={DOMAIN}', category: 'directory' },
    { name: 'FreeListingUSA', url_template: 'https://www.freelistingusa.com/search?q={DOMAIN}', category: 'directory' },
  ];
}

function getGeneralEndpoints(): EndpointEntry[] {
  return [
    // Accessibility checkers
    { name: 'WAVE A11y', url_template: 'https://wave.webaim.org/report#/{URL}', category: 'general' },
    { name: 'AChecker', url_template: 'https://achecker.ca/checker/index.php?uri={URL}', category: 'general' },
    { name: 'Tenon A11y', url_template: 'https://tenon.io/testNow.php?url={URL}', category: 'general' },
    // HTML/CSS validators
    { name: 'W3C HTML Validator', url_template: 'https://validator.w3.org/nu/?doc={URL}', category: 'general' },
    { name: 'W3C CSS Validator', url_template: 'https://jigsaw.w3.org/css-validator/validator?uri={URL}', category: 'general' },
    { name: 'W3C Link Checker', url_template: 'https://validator.w3.org/checklink?uri={URL}', category: 'general' },
    // Mobile friendly
    { name: 'Google Mobile Test', url_template: 'https://search.google.com/test/mobile-friendly?url={URL}', category: 'general' },
    { name: 'Responsive Checker', url_template: 'https://responsivedesignchecker.com/checker.php?url={URL}', category: 'general' },
    // Structured data
    { name: 'Schema Validator', url_template: 'https://validator.schema.org/?url={URL}', category: 'general' },
    { name: 'Google Rich Results', url_template: 'https://search.google.com/test/rich-results?url={URL}', category: 'general' },
    // Performance & tech
    { name: 'CarbonBadge', url_template: 'https://www.websitecarbon.com/website/{DOMAIN}/', category: 'general' },
    { name: 'GreenWebCheck', url_template: 'https://www.thegreenwebfoundation.org/green-web-check/?url={DOMAIN}', category: 'general' },
    { name: 'Is It Down', url_template: 'https://www.isitdownrightnow.com/{DOMAIN}.html', category: 'general' },
    { name: 'Down For Everyone', url_template: 'https://downforeveryoneorjustme.com/{DOMAIN}', category: 'general' },
    { name: 'HTTP Status', url_template: 'https://httpstatus.io/{URL}', category: 'general' },
    // Social & engagement
    { name: 'SharedCount', url_template: 'https://www.sharedcount.com/?url={URL}', category: 'general' },
    { name: 'BuzzSumo', url_template: 'https://app.buzzsumo.com/research/content?q={URL}', category: 'general' },
    { name: 'Facebook Debugger', url_template: 'https://developers.facebook.com/tools/debug/?q={URL}', category: 'general' },
    { name: 'Twitter Card Validator', url_template: 'https://cards-dev.twitter.com/validator?url={URL}', category: 'general' },
    { name: 'LinkedIn Inspector', url_template: 'https://www.linkedin.com/post-inspector/inspect/{URL}', category: 'general' },
    // Tech stack
    { name: 'WhatRuns', url_template: 'https://www.whatruns.com/website/{DOMAIN}', category: 'general' },
    { name: 'StackShare', url_template: 'https://stackshare.io/stacks/search?q={DOMAIN}', category: 'general' },
    { name: 'SimilarTech', url_template: 'https://www.similartech.com/websites/{DOMAIN}', category: 'general' },
    { name: 'Datanyze', url_template: 'https://www.datanyze.com/companies/{DOMAIN}', category: 'general' },
    { name: 'SpyOnWeb', url_template: 'https://spyonweb.com/{DOMAIN}', category: 'general' },
  ];
}
