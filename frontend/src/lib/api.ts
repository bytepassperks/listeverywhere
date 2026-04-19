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
    const data = await this.request<{ token: string; user: { id: string; email: string; plan: string } }>(
      '/api/auth/signup',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: { id: string; email: string; plan: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request('/api/auth/logout', { method: 'POST' }).catch(() => {});
    this.clearToken();
  }

  async getMe() {
    return this.request<{ user: { id: string; email: string; plan: string; created_at: string } }>('/api/auth/me');
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
    return this.request<{ message: string }>(`/api/companies/${companyId}/resubmit`, { method: 'POST' });
  }

  async getSubmissions(companyId: string) {
    return this.request<{ submissions: Submission[]; statusCounts: Record<string, number> }>(
      `/api/submissions/${companyId}`
    );
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
  screenshots: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  instructions: string[];
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
