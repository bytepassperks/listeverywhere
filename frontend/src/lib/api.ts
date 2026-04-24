const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('le_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('le_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('le_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error((err as { error: string }).error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async signup(email: string, password: string) {
    const data = await this.request<{ token: string; user: { id: string; email: string; plan: string; role: string } }>(
      '/api/auth/signup',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: { id: string; email: string; plan: string; role: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST', body: JSON.stringify({}) }).catch(() => {});
    this.clearToken();
  }

  async getMe() {
    return this.request<{ user: { id: string; email: string; plan: string; role: string; created_at: string } }>('/api/auth/me');
  }

  async createCompany(website: string, supportEmail: string) {
    return this.request<{ message: string; job_id: string }>('/api/companies', {
      method: 'POST',
      body: JSON.stringify({ website, support_email: supportEmail }),
    });
  }

  async getCompanies() {
    return this.request<{ companies: Company[] }>('/api/companies');
  }

  async getCompany(id: string) {
    return this.request<{ company: Company; screenshots: Screenshot[] }>(`/api/companies/${id}`);
  }

  async getCompanyPayloads(id: string) {
    return this.request<{ payloads: SubmissionPayload[] }>(`/api/companies/${id}/payloads`);
  }

  async resubmitFailed(companyId: string) {
    return this.request<{ message: string }>(`/api/companies/${companyId}/resubmit`, { method: 'POST', body: JSON.stringify({}) });
  }

  async getSubmissions(companyId: string, page: number = 1, limit: number = 50, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'all') params.set('status', status);
    return this.request<{
      submissions: Submission[];
      statusCounts: Record<string, number>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/submissions/${companyId}?${params.toString()}`);
  }

  async updateSubmissionStatus(submissionId: string, status: string) {
    return this.request<{ message: string }>(`/api/submissions/${submissionId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getManualKit(submissionId: string) {
    return this.request<{ kit: ManualKit }>(`/api/submissions/${submissionId}/manual-kit`);
  }

  async getEmailKit(submissionId: string) {
    return this.request<{ kit: EmailKit }>(`/api/submissions/${submissionId}/email-kit`);
  }

  async getDirectories() {
    return this.request<{ directories: Directory[] }>('/api/directories');
  }

  async getDirectoryStats() {
    return this.request<{ directories: Directory[]; byType: Record<string, number>; total: number }>(
      '/api/directories/stats'
    );
  }

  async uploadBulkCSV(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<{ message: string; job_id: string; total: number }>('/api/bulk/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getBulkJobs() {
    return this.request<{ jobs: Job[] }>('/api/bulk/jobs');
  }

  async getJob(id: string) {
    return this.request<{ job: Job }>(`/api/jobs/${id}`);
  }

  async backfillSubmissions(companyId: string) {
    return this.request<{ message: string; created: number }>(`/api/companies/${companyId}/backfill-submissions`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async aiAssist(submissionId: string, question: string, history?: Array<{ role: string; content: string }>) {
    return this.request<{ answer: string }>(`/api/submissions/${submissionId}/ai-assist`, {
      method: 'POST',
      body: JSON.stringify({ question, history }),
    });
  }

  // ==========================================
  // INDEXER MODULE
  // ==========================================

  async getIndexerStats() {
    return this.request<IndexerStats>('/api/indexer/stats');
  }

  async getIndexerProjects() {
    return this.request<{ projects: IndexerProject[] }>('/api/indexer/projects');
  }

  async getIndexerProject(id: string) {
    return this.request<{ project: IndexerProject; urlStats: Array<{ index_status: string; count: string }>; activity: IndexerActivity[] }>(`/api/indexer/projects/${id}`);
  }

  async createIndexerProject(domain: string) {
    return this.request<{ project: IndexerProject; sitemap_found: boolean; urls_discovered: number; indexnow_key: string }>('/api/indexer/projects', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  async deleteIndexerProject(id: string) {
    return this.request<{ message: string }>(`/api/indexer/projects/${id}`, { method: 'DELETE' });
  }

  async getIndexerUrls(projectId: string, page: number = 1, limit: number = 50, status?: string, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'all') params.set('status', status);
    if (search) params.set('search', search);
    return this.request<{
      urls: IndexerUrl[];
      statusCounts: Record<string, number>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/indexer/projects/${projectId}/urls?${params.toString()}`);
  }

  async addIndexerUrls(projectId: string, urls: string[]) {
    return this.request<{ added: number; total_submitted: number }>(`/api/indexer/projects/${projectId}/urls`, {
      method: 'POST',
      body: JSON.stringify({ urls }),
    });
  }

  async syncSitemap(projectId: string) {
    return this.request<{ message: string; added: number; total: number }>(`/api/indexer/projects/${projectId}/sync-sitemap`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async checkIndexStatus(projectId: string, urlIds?: string[], checkAll?: boolean) {
    return this.request<{ message: string; checked: number; indexed: number; notIndexed: number }>(`/api/indexer/projects/${projectId}/check-index`, {
      method: 'POST',
      body: JSON.stringify({ url_ids: urlIds, check_all: checkAll }),
    });
  }

  async submitIndexNow(projectId: string, urlIds?: string[], submitAllUnindexed?: boolean) {
    return this.request<{ message: string; submitted: number; errors: string[] }>(`/api/indexer/projects/${projectId}/submit-indexnow`, {
      method: 'POST',
      body: JSON.stringify({ url_ids: urlIds, submit_all_unindexed: submitAllUnindexed }),
    });
  }

  async submitPing(projectId: string, urlIds?: string[]) {
    return this.request<{ message: string; sitemap_pinged: number; urls_pinged: number; errors: string[] }>(`/api/indexer/projects/${projectId}/submit-ping`, {
      method: 'POST',
      body: JSON.stringify({ url_ids: urlIds }),
    });
  }

  async seedBacklinkEndpoints() {
    return this.request<{ message: string }>('/api/indexer/backlinks/seed', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getBacklinkEndpoints(category?: string) {
    const params = category ? `?category=${category}` : '';
    return this.request<{ endpoints: BacklinkEndpoint[]; total: number; byCategory: Record<string, number> }>(`/api/indexer/backlinks/endpoints${params}`);
  }

  async buildBacklinks(projectId: string, categories?: string[]) {
    return this.request<{ message: string; submitted: number; errors: string[] }>(`/api/indexer/projects/${projectId}/build-backlinks`, {
      method: 'POST',
      body: JSON.stringify({ categories }),
    });
  }

  async getBacklinkStats(projectId: string) {
    return this.request<{ total: number; submitted: number; verified: number; dead: number; byCategory: Record<string, number> }>(`/api/indexer/projects/${projectId}/backlink-stats`);
  }

  async getBacklinks(projectId: string, page: number = 1, limit: number = 50, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'all') params.set('status', status);
    return this.request<{
      backlinks: BacklinkResult[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/indexer/projects/${projectId}/backlinks?${params.toString()}`);
  }

  async analyzeMetaTags(url: string) {
    return this.request<MetaTagsAnalysis>('/api/indexer/tools/meta-analyzer', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async checkGoogleIndex(url: string) {
    return this.request<{ indexed: boolean; status: string }>('/api/indexer/tools/index-checker', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async analyzeRobotsTxt(domain: string) {
    return this.request<RobotsTxtAnalysis>('/api/indexer/tools/robots-analyzer', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  // Drip-feed campaigns
  async createCampaign(projectId: string, config: { daily_limit?: number; duration_days?: number; categories?: string[] } = {}) {
    return this.request<{ campaignId: string; totalEndpoints: number; estimatedDays: number }>(`/api/indexer/projects/${projectId}/campaigns`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getCampaigns(projectId: string) {
    return this.request<{ campaigns: Campaign[] }>(`/api/indexer/projects/${projectId}/campaigns`);
  }

  async processCampaignBatch(campaignId: string) {
    return this.request<{ processed: number; succeeded: number; failed: number; remaining: number; paused: boolean; processing?: boolean }>(`/api/indexer/campaigns/${campaignId}/process`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async pauseCampaign(campaignId: string) {
    return this.request<{ message: string }>(`/api/indexer/campaigns/${campaignId}/pause`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async resumeCampaign(campaignId: string) {
    return this.request<{ message: string }>(`/api/indexer/campaigns/${campaignId}/resume`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  // LLM Indexing
  async submitLLMIndex(projectId: string) {
    return this.request<{ results: Array<{ engine: string; status: string; method: string }> }>(`/api/indexer/projects/${projectId}/llm-index`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async checkLLMVisibility(domain: string) {
    return this.request<{ checks: LLMVisibilityCheck[] }>('/api/indexer/tools/llm-visibility', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  async getLLMEngines() {
    return this.request<{ engines: LLMEngine[] }>('/api/indexer/llm-engines');
  }

  // Alerts & Discovery
  async getAlerts(projectId: string, unreadOnly = false) {
    return this.request<{ alerts: IndexerAlert[]; unreadCount: number }>(
      `/api/indexer/projects/${projectId}/alerts?unread_only=${unreadOnly}`
    );
  }

  async markAlertRead(alertId: string) {
    return this.request<{ message: string }>(`/api/indexer/alerts/${alertId}/read`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async markAllAlertsRead(projectId: string) {
    return this.request<{ message: string }>(`/api/indexer/projects/${projectId}/alerts/read-all`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getDiscoveryStats() {
    return this.request<DiscoveryStats>('/api/indexer/discovery/stats');
  }

  async triggerDiscovery() {
    return this.request<{ message: string }>('/api/indexer/discovery/run', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async triggerAutoSubmit(batchSize = 50) {
    return this.request<{ message: string }>('/api/indexer/auto-submit/run', {
      method: 'POST',
      body: JSON.stringify({ batch_size: batchSize }),
    });
  }

  async generateWeeklyDigest() {
    return this.request<{ message: string }>('/api/indexer/alerts/generate-digest', {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getEndpointStats() {
    return this.request<EndpointStats>('/api/indexer/endpoints/stats');
  }

  // === Backlink Enhancement APIs ===

  // 1. Verify backlinks
  async verifyBacklinks(projectId: string, batchSize = 50) {
    return this.request<{ verified: number; dead: number; pending: number; errors: number }>(
      `/api/indexer/projects/${projectId}/backlinks/verify`,
      { method: 'POST', body: JSON.stringify({ batch_size: batchSize }) }
    );
  }

  // 2. Score DA
  async scoreEndpointDA() {
    return this.request<{ message: string }>('/api/indexer/endpoints/score-da', {
      method: 'POST', body: JSON.stringify({}),
    });
  }

  async getDADistribution() {
    return this.request<{ distribution: Array<{ range: string; count: number }> }>('/api/indexer/endpoints/da-distribution');
  }

  // 3. Anchor texts
  async generateAnchorTexts(projectId: string, data: { domain: string; companyName: string; description: string; keywords: string[] }) {
    return this.request<{ anchors: Array<{ type: string; text: string }> }>(
      `/api/indexer/projects/${projectId}/anchor-texts`,
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  // 4. Competitor analysis
  async analyzeCompetitor(projectId: string, competitorDomain: string) {
    return this.request<{
      domain: string; backlinksFound: number; matchingEndpoints: number;
      newEndpoints: number; sources: Array<{ url: string; type: string; da: number }>;
    }>(
      `/api/indexer/projects/${projectId}/competitor-analysis`,
      { method: 'POST', body: JSON.stringify({ competitor_domain: competitorDomain }) }
    );
  }

  // 5. Health check
  async runHealthCheck(projectId: string) {
    return this.request<{ checked: number; healthy: number; dead: number; degraded: number }>(
      `/api/indexer/projects/${projectId}/backlinks/health-check`,
      { method: 'POST', body: JSON.stringify({}) }
    );
  }

  async getHealthSummary(projectId: string) {
    return this.request<{
      total: number; verified: number; dead: number; submitted: number; pending: number;
      recentChecks: Array<{ date: string; healthy: number; dead: number }>;
    }>(`/api/indexer/projects/${projectId}/backlinks/health-summary`);
  }

  // 6. Geo endpoints
  async getGeoEndpoints(region: string, category?: string, limit = 100) {
    const params = new URLSearchParams({ region, limit: String(limit) });
    if (category) params.set('category', category);
    return this.request<{
      endpoints: Array<{ id: string; name: string; url_template: string; category: string; domain_authority: number | null }>;
      total: number;
    }>(`/api/indexer/endpoints/geo?${params.toString()}`);
  }

  async getAvailableRegions() {
    return this.request<{ regions: Array<{ code: string; name: string; tlds: string[] }> }>('/api/indexer/endpoints/regions');
  }

  // 7. Tier 2
  async buildTier2Links(projectId: string, backlinkIds: string[], maxPerBacklink = 20) {
    return this.request<{
      totalSubmitted: number; results: Array<{ tier1Url: string; tier2Count: number }>;
    }>(
      `/api/indexer/projects/${projectId}/backlinks/tier2`,
      { method: 'POST', body: JSON.stringify({ backlink_ids: backlinkIds, max_per_backlink: maxPerBacklink }) }
    );
  }

  // 8. Export
  getExportUrl(projectId: string, format: 'csv' | 'json' = 'csv') {
    return `${API_BASE}/api/indexer/projects/${projectId}/backlinks/export?format=${format}`;
  }

  // 9. Smart schedule
  async getSmartSchedule(projectId: string, domainAge?: string, targetRegion?: string) {
    return this.request<{
      dailyLimit: number; durationDays: number;
      schedule: Array<{ day: number; count: number; categories: string[]; timeSlots: string[] }>;
      reasoning: string;
    }>(
      `/api/indexer/projects/${projectId}/smart-schedule`,
      { method: 'POST', body: JSON.stringify({ domain_age: domainAge, target_region: targetRegion }) }
    );
  }

  // 10. Disavow
  async getDisavowList(projectId: string) {
    return this.request<{
      disavowContent: string; filename: string; totalDisavowed: number;
      domains: string[]; reasons: Array<{ domain: string; reason: string }>;
    }>(`/api/indexer/projects/${projectId}/disavow`);
  }

  getDownloadDisavowUrl(projectId: string) {
    return `${API_BASE}/api/indexer/projects/${projectId}/disavow?download=true`;
  }
}

export const api = new ApiClient();

export interface Company {
  id: string;
  user_id: string;
  name: string;
  website: string;
  support_email: string;
  tagline: string;
  description_short: string;
  description_long: string;
  logo_url: string;
  categories: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  founded_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Screenshot {
  type: string;
  file_url: string;
}

export interface Directory {
  id: string;
  name: string;
  submit_url: string;
  submission_type: string;
  title_limit: number | null;
  desc_limit: number | null;
  requires_logo: boolean;
  requires_screenshot: boolean;
  requires_category: boolean;
  notes: string | null;
  active: boolean;
}

export interface Submission {
  id: string;
  company_id: string;
  directory_id: string;
  status: string;
  payload: Record<string, unknown>;
  attempt_count: number;
  last_attempt_at: string | null;
  error_log: string | null;
  created_at: string;
  updated_at: string;
  directory_name: string;
  submit_url: string;
  submission_type: string;
}

export interface SubmissionPayload {
  title: string;
  tagline: string;
  description: string;
  description_long: string;
  website: string;
  email: string;
  categories: string[];
  logo_url: string;
  screenshots: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  founded_year: number | null;
  submit_url: string;
  directory_name: string;
  submission_type: string;
}

export interface FormField {
  field_name: string;
  value: string;
  required: boolean;
  char_limit: number | null;
  copy_ready: boolean;
}

export interface DirectoryRequirements {
  title_limit: number | null;
  desc_limit: number | null;
  requires_logo: boolean;
  requires_screenshot: boolean;
  requires_category: boolean;
}

export interface ManualKit {
  directory_name: string;
  submit_url: string;
  title: string;
  tagline: string;
  description: string;
  description_long: string;
  categories: string[];
  website: string;
  email: string;
  logo_url: string;
  logo_download_url: string;
  screenshots: string[];
  screenshot_download_urls: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  instructions: string[];
  directory_requirements: DirectoryRequirements;
  form_fields: FormField[];
}

export interface EmailKit {
  directory_name: string;
  to_email: string;
  email_subject: string;
  email_body: string;
  attachments: string[];
  gmail_draft_url: string;
}

export interface Job {
  id: string;
  job_type: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

// ==========================================
// INDEXER INTERFACES
// ==========================================

export interface IndexerStats {
  projects: number;
  totalUrls: number;
  indexedUrls: number;
  notIndexedUrls: number;
  backlinkEndpoints: number;
  totalBacklinks: number;
}

export interface IndexerProject {
  id: string;
  user_id: string;
  domain: string;
  sitemap_url: string | null;
  gsc_property_id: string | null;
  gsc_access_token: string | null;
  gsc_refresh_token: string | null;
  indexnow_key: string | null;
  auto_index: boolean;
  sync_frequency: string;
  last_sitemap_sync: string | null;
  last_index_check: string | null;
  total_urls: number;
  indexed_count: number;
  not_indexed_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface IndexerUrl {
  id: string;
  project_id: string;
  url: string;
  index_status: string;
  last_checked: string | null;
  last_submitted: string | null;
  last_crawled: string | null;
  submit_count: number;
  source: string;
  canonical_url: string | null;
  error_detail: string | null;
  created_at: string;
  updated_at: string;
}

export interface IndexerActivity {
  id: string;
  project_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface BacklinkEndpoint {
  id: string;
  name: string;
  url_template: string;
  category: string;
  domain_authority: number | null;
  is_dofollow: boolean;
  active: boolean;
  success_rate: number;
}

export interface BacklinkResult {
  id: string;
  project_id: string;
  endpoint_id: string;
  target_url: string;
  backlink_url: string | null;
  status: string;
  http_status: number | null;
  submitted_at: string;
  verified_at: string | null;
  endpoint_name: string;
  endpoint_category: string;
}

export interface MetaTagsAnalysis {
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

export interface RobotsTxtAnalysis {
  found: boolean;
  content: string;
  sitemaps: string[];
  disallowedPaths: string[];
  allowedPaths: string[];
  crawlDelay: number | null;
}

export interface Campaign {
  id: string;
  project_id: string;
  daily_limit: number;
  duration_days: number;
  categories: string[];
  total_endpoints: number;
  processed_count: number;
  status: string;
  pending_count: string;
  submitted_count: string;
  failed_count: string;
  created_at: string;
  updated_at: string;
}

export interface LLMVisibilityCheck {
  platform: string;
  found: boolean;
  url: string;
}

export interface LLMEngine {
  name: string;
  type: string;
  description: string;
}

export interface IndexerAlert {
  id: string;
  project_id: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface DiscoveryStats {
  totalEndpoints: number;
  lastDiscovery: string | null;
  newThisWeek: number;
  totalDiscovered: number;
}

export interface EndpointStats {
  totalEndpoints: number;
  byCategory: Array<{ category: string; count: string }>;
  recentDiscoveries: Array<{ id: string; discovered_count: number; verified_count: number; added_count: number; created_at: string }>;
  dailyGrowth: Array<{ day: string; endpoints_added: string }>;
}
