'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { api, Company, Screenshot, Submission, FormField, DirectoryRequirements } from '@/lib/api';
import { CompanyLogo } from '@/components/CompanyLogo';

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
  const [activeKit, setActiveKit] = useState<{ type: string; data: Record<string, unknown>; submissionId?: string } | null>(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const PAGE_SIZE = 50;

  const load = useCallback(async (page = currentPage, status = statusFilter) => {
    try {
      const [companyData, submissionData] = await Promise.all([
        api.getCompany(id),
        api.getSubmissions(id, page, PAGE_SIZE, status !== 'all' ? status : undefined),
      ]);
      setCompany(companyData.company);
      setScreenshots(companyData.screenshots);
      setSubmissions(submissionData.submissions);
      setStatusCounts(submissionData.statusCounts);
      if (submissionData.pagination) {
        setTotalPages(submissionData.pagination.totalPages);
        setTotalSubmissions(submissionData.pagination.total);
        setCurrentPage(submissionData.pagination.page);
      }
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, router, currentPage, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleManualKit(submissionId: string) {
    try {
      const data = await api.getManualKit(submissionId);
      setActiveKit({ type: 'manual', data: data.kit as unknown as Record<string, unknown>, submissionId });
      setAiMessages([]);
      setAiChatOpen(false);
      setAiInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load kit');
    }
  }

  async function handleAiSend() {
    if (!aiInput.trim() || aiLoading || !activeKit?.submissionId) return;
    const question = aiInput.trim();
    setAiInput('');
    const newMessages = [...aiMessages, { role: 'user', content: question }];
    setAiMessages(newMessages);
    setAiLoading(true);
    try {
      const { answer } = await api.aiAssist(activeKit.submissionId, question, aiMessages);
      setAiMessages([...newMessages, { role: 'assistant', content: answer }]);
    } catch (err) {
      setAiMessages([...newMessages, { role: 'assistant', content: `Error: ${err instanceof Error ? err.message : 'Failed to get AI response'}` }]);
    } finally {
      setAiLoading(false);
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

  async function handleBackfill() {
    setBackfilling(true);
    try {
      const result = await api.backfillSubmissions(id);
      alert(result.message);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to backfill submissions');
    } finally {
      setBackfilling(false);
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
          <CompanyLogo name={company.name} website={company.website} logoUrl={company.logo_url} size="lg" />
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

      <div className="mb-6">
        <button
          onClick={() => router.push(`/dashboard/demo-video?company=${id}`)}
          className="w-full p-4 rounded-xl border text-left flex items-center gap-4 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', borderColor: 'transparent' }}
        >
          <span className="text-3xl">🎬</span>
          <div>
            <div className="text-white font-semibold">Generate Demo Video</div>
            <div className="text-white/70 text-sm">Create a professional 3D animated demo video with floating effects &amp; annotations</div>
          </div>
          <span className="ml-auto text-white text-xl">&rarr;</span>
        </button>
      </div>

      {screenshots.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Screenshots</h2>
          <div className="grid grid-cols-3 gap-4">
            {screenshots.map((s) => (
              <div key={s.type} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <img src={s.file_url.startsWith('http') ? s.file_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${s.file_url}`} alt={s.type}
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
          <div className="flex gap-2">
            <button onClick={handleBackfill} disabled={backfilling}
              className="px-3 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-50"
              style={{ background: '#22c55e' }}>
              {backfilling ? 'Backfilling...' : 'Backfill All Directories'}
            </button>
            <button onClick={handleResubmit} disabled={resubmitting}
              className="px-3 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}>
              {resubmitting ? 'Resubmitting...' : 'Retry Failed'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button onClick={() => { setStatusFilter('all'); setCurrentPage(1); load(1, 'all'); }}
            className="p-3 rounded-lg border text-center cursor-pointer transition-all"
            style={{ borderColor: statusFilter === 'all' ? 'var(--primary)' : 'var(--border)', background: 'var(--card)', outline: statusFilter === 'all' ? '2px solid var(--primary)' : 'none' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{Object.values(statusCounts).reduce((a, b) => a + b, 0)}</div>
            <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>All</div>
          </button>
          {Object.entries(statusCounts).map(([status, count]) => (
            <button key={status} onClick={() => { setStatusFilter(status); setCurrentPage(1); load(1, status); }}
              className="p-3 rounded-lg border text-center cursor-pointer transition-all"
              style={{ borderColor: statusFilter === status ? STATUS_COLORS[status] || 'var(--primary)' : 'var(--border)', background: 'var(--card)', outline: statusFilter === status ? `2px solid ${STATUS_COLORS[status] || 'var(--primary)'}` : 'none' }}>
              <div className="text-2xl font-bold" style={{ color: STATUS_COLORS[status] || 'var(--foreground)' }}>{count}</div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{STATUS_LABELS[status] || status}</div>
            </button>
          ))}
        </div>
        <div className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
          Showing {submissions.length} of {totalSubmissions} submissions (page {currentPage} of {totalPages})
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 mb-6">
          <button
            onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); load(p, statusFilter); }}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
            style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
            &larr; Previous
          </button>
          <div className="flex gap-1">
            {currentPage > 3 && (
              <>
                <button onClick={() => { setCurrentPage(1); load(1, statusFilter); }}
                  className="w-8 h-8 rounded-lg text-xs" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>1</button>
                {currentPage > 4 && <span className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: 'var(--muted-foreground)' }}>...</span>}
              </>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (page > totalPages) return null;
              return (
                <button key={page} onClick={() => { setCurrentPage(page); load(page, statusFilter); }}
                  className="w-8 h-8 rounded-lg text-xs font-medium"
                  style={{
                    background: page === currentPage ? 'var(--primary)' : 'var(--secondary)',
                    color: page === currentPage ? 'white' : 'var(--secondary-foreground)',
                  }}>{page}</button>
              );
            })}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && <span className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: 'var(--muted-foreground)' }}>...</span>}
                <button onClick={() => { setCurrentPage(totalPages); load(totalPages, statusFilter); }}
                  className="w-8 h-8 rounded-lg text-xs" style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>{totalPages}</button>
              </>
            )}
          </div>
          <button
            onClick={() => { const p = Math.min(totalPages, currentPage + 1); setCurrentPage(p); load(p, statusFilter); }}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
            style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)' }}>
            Next &rarr;
          </button>
        </div>
      )}

      {activeKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-auto rounded-xl p-6" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>
                {activeKit.type === 'manual' ? 'Manual Submission Kit' : 'Email Submission Kit'}
              </h2>
              <button onClick={() => setActiveKit(null)} className="text-xl" style={{ color: 'var(--muted-foreground)' }}>&times;</button>
            </div>

            {activeKit.type === 'manual' && (() => {
              const kit = activeKit.data as unknown as import('@/lib/api').ManualKit;
              return (
              <div className="space-y-4">
                {kit.directory_requirements && (
                  <div className="p-3 rounded-lg border text-xs" style={{ background: 'var(--secondary)', borderColor: 'var(--border)' }}>
                    <div className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                      {kit.directory_name} — Form Requirements
                    </div>
                    <div className="flex flex-wrap gap-3" style={{ color: 'var(--muted-foreground)' }}>
                      {kit.directory_requirements.title_limit && (
                        <span>Title: max {kit.directory_requirements.title_limit} chars</span>
                      )}
                      {kit.directory_requirements.desc_limit && (
                        <span>Description: max {kit.directory_requirements.desc_limit} chars</span>
                      )}
                      <span style={{ color: kit.directory_requirements.requires_logo ? '#22c55e' : 'var(--muted-foreground)' }}>
                        Logo: {kit.directory_requirements.requires_logo ? 'Required' : 'Optional'}
                      </span>
                      <span style={{ color: kit.directory_requirements.requires_screenshot ? '#22c55e' : 'var(--muted-foreground)' }}>
                        Screenshot: {kit.directory_requirements.requires_screenshot ? 'Required' : 'Optional'}
                      </span>
                      <span style={{ color: kit.directory_requirements.requires_category ? '#22c55e' : 'var(--muted-foreground)' }}>
                        Category: {kit.directory_requirements.requires_category ? 'Required' : 'Optional'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Form Fields — each with copy button and char count */}
                {kit.form_fields && kit.form_fields.map((field: FormField, i: number) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-1">
                      <label className="text-xs font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>
                        {field.field_name}
                      </label>
                      {field.required && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: '#ef4444', color: 'white' }}>Required</span>
                      )}
                      {field.char_limit && (
                        <span className="text-xs" style={{ color: field.value.length > field.char_limit ? '#ef4444' : 'var(--muted-foreground)' }}>
                          {field.value.length}/{field.char_limit}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 p-2 rounded text-sm border" style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}>
                        {field.value}
                      </div>
                      <button onClick={() => copyToClipboard(field.value)}
                        className="px-2 py-1 text-xs rounded border shrink-0"
                        style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                        Copy
                      </button>
                    </div>
                  </div>
                ))}

                {/* Logo Download */}
                {kit.logo_download_url && (
                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                    <label className="text-xs font-medium uppercase mb-2 block" style={{ color: 'var(--muted-foreground)' }}>
                      Logo {kit.directory_requirements?.requires_logo ? '(Required)' : '(Optional)'}
                    </label>
                    <div className="flex items-center gap-3">
                      <img
                        src={kit.logo_download_url}
                        alt="Logo"
                        className="w-16 h-16 rounded-lg object-contain border"
                        style={{ borderColor: 'var(--border)', background: '#fff' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <a
                        href={kit.logo_download_url}
                        download={`${(kit.directory_name || 'logo').replace(/\s+/g, '-').toLowerCase()}-logo.png`}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-white inline-flex items-center gap-1"
                        style={{ background: '#6366f1' }}
                      >
                        Download Logo PNG
                      </a>
                      <button onClick={() => copyToClipboard(kit.logo_url)}
                        className="px-2 py-1 text-xs rounded border"
                        style={{ borderColor: 'var(--border)', color: 'var(--primary)' }}>
                        Copy URL
                      </button>
                    </div>
                  </div>
                )}

                {/* Screenshot Downloads */}
                {kit.screenshot_download_urls && kit.screenshot_download_urls.length > 0 && (
                  <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                    <label className="text-xs font-medium uppercase mb-2 block" style={{ color: 'var(--muted-foreground)' }}>
                      Screenshots {kit.directory_requirements?.requires_screenshot ? '(Required)' : '(Optional)'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {kit.screenshot_download_urls.map((url: string, idx: number) => (
                        <div key={idx} className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                          <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-24 object-cover" />
                          <a
                            href={url}
                            download={`screenshot-${idx + 1}.png`}
                            className="block text-center py-1 text-xs font-medium"
                            style={{ background: 'var(--secondary)', color: 'var(--primary)' }}
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step-by-step Instructions */}
                {kit.instructions && kit.instructions.length > 0 && (
                  <div>
                    <label className="text-xs font-medium uppercase" style={{ color: 'var(--muted-foreground)' }}>Step-by-step Instructions</label>
                    <ol className="list-decimal list-inside space-y-1 mt-1 text-sm" style={{ color: 'var(--foreground)' }}>
                      {kit.instructions.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <a href={kit.submit_url} target="_blank" rel="noopener noreferrer"
                  className="block text-center py-2 rounded-lg font-semibold text-white text-sm mt-4"
                  style={{ background: 'var(--primary)' }}>
                  Open Submission Page &rarr;
                </a>

                {/* AI Chat Assistant */}
                <div className="mt-4 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => setAiChatOpen(!aiChatOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}
                  >
                    <span>🤖 AI Form Assistant — Ask anything about this submission</span>
                    <span>{aiChatOpen ? '▲' : '▼'}</span>
                  </button>

                  {aiChatOpen && (
                    <div style={{ background: 'var(--background)' }}>
                      <div className="px-4 py-3 space-y-3 max-h-64 overflow-auto" id="ai-chat-messages">
                        {aiMessages.length === 0 && (
                          <div className="text-xs text-center py-4" style={{ color: 'var(--muted-foreground)' }}>
                            Ask me anything! Examples:<br />
                            &quot;What&apos;s the phone number?&quot; · &quot;Write a 50-word description&quot; · &quot;This form asks for founder name&quot;
                          </div>
                        )}
                        {aiMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className="rounded-xl px-3 py-2 text-sm max-w-[85%]"
                              style={{
                                background: msg.role === 'user' ? '#6366f1' : 'var(--secondary)',
                                color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                              }}
                            >
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                              {msg.role === 'assistant' && (
                                <button
                                  onClick={() => copyToClipboard(msg.content)}
                                  className="mt-1 text-xs opacity-60 hover:opacity-100"
                                >
                                  📋 Copy
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="flex justify-start">
                            <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                              {aiMessages.length === 1 ? '🔍 Scraping website & analyzing...' : '💭 Thinking...'}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
                        <input
                          type="text"
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
                          placeholder="Ask about form fields, descriptions, phone numbers..."
                          className="flex-1 px-3 py-2 rounded-lg border text-sm"
                          style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)' }}
                          disabled={aiLoading}
                        />
                        <button
                          onClick={handleAiSend}
                          disabled={aiLoading || !aiInput.trim()}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40"
                          style={{ background: '#6366f1' }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })()}

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
