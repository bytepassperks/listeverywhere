'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Company } from '@/lib/api';

export default function SubmissionsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [submissions, setSubmissions] = useState<Array<{
    id: string; directory_name: string; status: string; submission_type: string;
    attempt_count: number; submit_url: string; error_log: string | null; updated_at: string;
  }>>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadCompanies = useCallback(async () => {
    try {
      const data = await api.getCompanies();
      setCompanies(data.companies);
      if (data.companies.length > 0) {
        setSelectedCompany(data.companies[0].id);
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const loadSubmissions = useCallback(async () => {
    if (!selectedCompany) return;
    try {
      const data = await api.getSubmissions(selectedCompany);
      setSubmissions(data.submissions);
      setStatusCounts(data.statusCounts);
    } catch { /* ignore */ }
  }, [selectedCompany]);

  useEffect(() => { loadSubmissions(); }, [loadSubmissions]);

  const filtered = filterStatus === 'all'
    ? submissions
    : submissions.filter(s => s.status === filterStatus);

  const statusColors: Record<string, string> = {
    queued: '#f59e0b', auto_submitted: '#22c55e', manual_ready: '#3b82f6',
    email_ready: '#8b5cf6', submitted: '#06b6d4', approved: '#22c55e',
    rejected: '#ef4444', retrying: '#f59e0b', manual_required: '#ef4444',
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>Submissions</h1>

      <div className="flex gap-4 mb-6">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        >
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm"
          style={{ borderColor: 'var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        >
          <option value="all">All Statuses</option>
          {Object.keys(statusCounts).map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')} ({statusCounts[s]})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
            className="p-3 rounded-lg border text-center transition-all"
            style={{
              borderColor: filterStatus === status ? statusColors[status] : 'var(--border)',
              background: 'var(--card)',
            }}
          >
            <div className="text-xl font-bold" style={{ color: statusColors[status] || 'var(--foreground)' }}>{count}</div>
            <div className="text-xs capitalize" style={{ color: 'var(--muted-foreground)' }}>{status.replace(/_/g, ' ')}</div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(sub => (
          <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex-1">
              <span className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{sub.directory_name}</span>
              <span className="text-xs ml-2 px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>
                {sub.submission_type}
              </span>
              {sub.error_log && (
                <p className="text-xs mt-1 truncate max-w-md" style={{ color: 'var(--destructive)' }}>{sub.error_log}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full text-white font-medium"
                style={{ background: statusColors[sub.status] || '#64748b' }}>
                {sub.status.replace(/_/g, ' ')}
              </span>
              <a href={sub.submit_url} target="_blank" rel="noopener noreferrer"
                className="text-xs px-2 py-1 rounded border"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                Open
              </a>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            No submissions found {filterStatus !== 'all' ? `with status "${filterStatus}"` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
