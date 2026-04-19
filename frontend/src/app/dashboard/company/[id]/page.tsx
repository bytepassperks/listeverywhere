'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { api, Company, Screenshot, Submission } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  queued: '#f59e0b',
  auto_submitted: '#22c55e',
  manual_ready: '#3b82f6',
  email_ready: '#8b5cf6',
  submitted: '#06b6d4',
  approved: '#22c55e',
  rejected: '#ef4444',
  retrying: '#f59e0b',
  manual_required: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  auto_submitted: 'Auto Submitted',
  manual_ready: 'Manual Ready',
  email_ready: 'Email Ready',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  retrying: 'Retrying',
  manual_required: 'Manual Required',
};

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeKit, setActiveKit] = useState<{ type: string; data: Record<string, unknown> } | null>(null);
  const [resubmitting, setResubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [companyData, submissionData] = await Promise.all([
        api.getCompany(id),
        api.getSubmissions(id),
      ]);
      setCompany(companyData.company);
      setScreenshots(companyData.screenshots);
      setSubmissions(submissionData.submissions);
      setStatusCounts(submissionData.statusCounts);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleManualKit(submissionId: string) {
    try {
      const data = await api.getManualKit(submissionId);
      setActiveKit({ type: 'manual', data: data.kit as unknown as Record<string, unknown> });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load kit');
    }
  }

  async function handleEmailKit(submissionId: string) {
    try {
      const data = await api.getEmailKit(submissionId);
      setActiveKit({ type: 'email', data: data.kit as unknown as Record<string, unknown> });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load kit');
    }
  }

  async function handleStatusUpdate(submissionId: string, status: string) {
    try {
      await api.updateSubmissionStatus(submissionId, status);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  async function handleResubmit() {
    setResubmitting(true);
    try {
      const result = await api.resubmitFailed(id);
      alert(result.message);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resubmit');
    } finally {
      setResubmitting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>;
  }

  if (!company) return null;

  return (
    <div>
      <button onClick={() => router.push('/dashboard')} className="text-sm mb-4 inline-block" style={{ color: 'var(--primary)' }}>
        &larr; Back to Dashboard
      </button>

      <div className="p-6 rounded-xl border mb-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-4">
          {company.logo_url && (
            <img src={company.logo_url} alt={company.name} className="w-16 h-16 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{company.name}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>{company.tagline}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
              {company.website} · {company.support_email} · {company.pricing_model}
            </p>
          </div>
        </div>
        <p className="text-sm mt-4" style={{ color: 'var(--foreground)' }}>{company.description_short}</p>
        {company.categories && Array.isArray(company.categories) && company.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {(company.categories as string[]).map((cat) => (
              <span key={cat} className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {screenshots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Screenshots</h2>
          <div className="grid grid-cols-3 gap-4">
            {screenshots.map((s) => (
              <div key={s.type} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${s.file_url}`} alt={s.type}
                  className="w-full h-48 object-cover" />
                <div className="p-2 text-xs text-center capitalize" style={{ color: 'var(--muted-foreground)' }}>{s.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Submission Progress</h2>
          <button onClick={handleResubmit} disabled={resubmitting}
            className="px-3 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--primary)' }}>
            {resubmitting ? 'Resubmitting...' : 'Retry Failed'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="p-3 rounded-lg border text-center" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              <div className="text-2xl font-bold" style={{ color: STATUS_COLORS[status] || 'var(--foreground)' }}>{count}</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{STATUS_LABELS[status] || status}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {submissions.map((sub) => (
          <div key={sub.id} className="p-4 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{sub.directory_name}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {sub.submission_type} · Attempts: {sub.attempt_count}
                  {sub.error_log && <span style={{ color: 'var(--destructive)' }}> · {sub.error_log}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full font-medium text-white"
                  style={{ background: STATUS_COLORS[sub.status] || '#64748b' }}>
                  {STATUS_LABELS[sub.status] || sub.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {(sub.status === 'manual_ready' || sub.status === 'manual_required') && (
                <button onClick={() => handleManualKit(sub.id)}
                  className="text-xs px-3 py-1 rounded border font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                  Open Manual Kit
                </button>
              )}
              {sub.status === 'email_ready' && (
                <button onClick={() => handleEmailKit(sub.id)}
                  className="text-xs px-3 py-1 rounded border font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                  Open Email Kit
                </button>
              )}
              <a href={sub.submit_url} target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1 rounded border font-medium"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                Open Page
              </a>
              {['manual_ready', 'email_ready', 'manual_required'].includes(sub.status) && (
                <>
                  <button onClick={() => handleStatusUpdate(sub.id, 'submitted')}
                    className="text-xs px-3 py-1 rounded font-medium text-white" style={{ background: '#06b6d4' }}>
                    Mark Submitted
                  </button>
                  <button onClick={() => handleStatusUpdate(sub.id, 'approved')}
                    className="text-xs px-3 py-1 rounded font-medium text-white" style={{ background: '#22c55e' }}>
                    Mark Approved
                  </button>
                  <button onClick={() => handleStatusUpdate(sub.id, 'rejected')}
                    className="text-xs px-3 py-1 rounded font-medium text-white" style={{ background: '#ef4444' }}>
                    Mark Rejected
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl p-6" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {activeKit.type === 'manual' ? 'Manual Submission Kit' : 'Email Submission Kit'}
              </h2>
              <button onClick={() => setActiveKit(null)} className="text-xl" style={{ color: 'var(--muted-foreground)' }}>&times;</button>
            </div>

            {activeKit.type === 'manual' && (
              <div className="space-y-3">
                {(['title', 'tagline', 'description', 'description_long', 'website', 'email'] as const).map((field) => {
                  const val = String(activeKit.data[field] || '');
                  if (!val) return null;
                  return (
                    <div key={field}>
                      <label className="text-xs font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>{field}</label>
                      <div className="flex items-start gap-2 mt-1">
                        <div className="flex-1 p-2 rounded text-sm border" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                          {val}
                        </div>
                        <button onClick={() => copyToClipboard(val)}
                          className="px-2 py-1 text-xs rounded border shrink-0"
                          style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                          Copy
                        </button>
                      </div>
                    </div>
                  );
                })}
                {Array.isArray(activeKit.data.instructions) && (
                  <div>
                    <label className="text-xs font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Steps</label>
                    <ol className="list-decimal list-inside space-y-1 mt-1 text-sm" style={{ color: 'var(--foreground)' }}>
                      {(activeKit.data.instructions as string[]).map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                <a href={String(activeKit.data.submit_url)} target="_blank" rel="noopener noreferrer"
                  className="block text-center py-2 rounded-lg font-semibold text-white text-sm mt-4"
                  style={{ background: 'var(--primary)' }}>
                  Open Submission Page
                </a>
              </div>
            )}

            {activeKit.type === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Subject</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 p-2 rounded text-sm border" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                      {String(activeKit.data.email_subject)}
                    </div>
                    <button onClick={() => copyToClipboard(String(activeKit.data.email_subject))}
                      className="px-2 py-1 text-xs rounded border shrink-0"
                      style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Body</label>
                  <div className="flex items-start gap-2 mt-1">
                    <pre className="flex-1 p-2 rounded text-sm border whitespace-pre-wrap font-sans"
                      style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                      {String(activeKit.data.email_body)}
                    </pre>
                    <button onClick={() => copyToClipboard(String(activeKit.data.email_body))}
                      className="px-2 py-1 text-xs rounded border shrink-0"
                      style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                      Copy
                    </button>
                  </div>
                </div>
                <a href={String(activeKit.data.gmail_draft_url)} target="_blank" rel="noopener noreferrer"
                  className="block text-center py-2 rounded-lg font-semibold text-white text-sm mt-4"
                  style={{ background: 'var(--primary)' }}>
                  Open Gmail Draft
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
