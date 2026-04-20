'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Company } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [website, setWebsite] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  const loadCompanies = useCallback(async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data.companies);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!api.getToken()) {
      router.push('/login');
      return;
    }
    loadCompanies();
  }, [router, loadCompanies]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg('');

    try {
      const result = await api.createCompany(website, supportEmail);
      setSubmitMsg(`Crawl started! Job ID: ${result.job_id}. The system is crawling your website, extracting metadata, generating screenshots, and queuing submissions to all directories. This may take a few minutes.`);
      setWebsite('');
      setSupportEmail('');
      setShowForm(false);
      setTimeout(() => loadCompanies(), 10000);
    } catch (err) {
      setSubmitMsg(err instanceof Error ? err.message : 'Failed to start crawl');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {companies.length} {companies.length === 1 ? 'company' : 'companies'} registered
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg font-semibold text-white text-sm"
          style={{ background: 'var(--primary)' }}
        >
          + Add Company
        </button>
      </div>

      {submitMsg && (
        <div className="mb-6 p-4 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--secondary)', color: 'var(--foreground)' }}>
          {submitMsg}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Submit New Company</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Enter your website URL and support email. We&apos;ll automatically crawl your site, extract metadata using AI, generate screenshots, and submit to all directories.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                placeholder="https://yourproduct.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                placeholder="support@yourproduct.com"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-lg font-semibold text-white text-sm disabled:opacity-50"
              style={{ background: 'var(--primary)' }}
            >
              {submitting ? 'Starting crawl...' : 'Start Crawl & Submit'}
            </button>
          </form>
        </div>
      )}

      {companies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg mb-2" style={{ color: 'var(--muted-foreground)' }}>No companies yet</p>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Click &quot;Add Company&quot; to crawl your website and start submitting to directories.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/dashboard/company/${company.id}`}
              className="block p-6 rounded-xl border transition-all hover:shadow-md"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start gap-4">
                <img
                  src={company.logo_url || (() => { try { return `https://logo.clearbit.com/${new URL(company.website).hostname}`; } catch { return ''; } })()}
                  alt={company.name}
                  className="w-12 h-12 rounded-lg object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{company.name}</h3>
                  <p className="text-sm mt-1 truncate" style={{ color: 'var(--muted-foreground)' }}>
                    {company.tagline || company.website}
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                    {company.website} · {company.pricing_model || 'Unknown pricing'}
                    {company.categories && Array.isArray(company.categories) && company.categories.length > 0 && (
                      <> · {(company.categories as string[]).slice(0, 3).join(', ')}</>
                    )}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                  View
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
