'use client';

import { useState, useEffect } from 'react';
import { api, Job } from '@/lib/api';

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await api.getBulkJobs();
        setJobs(data.jobs);
      } catch { /* ignore */ }
    }
    loadJobs();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage('');

    try {
      const result = await api.uploadBulkCSV(file);
      setMessage(`${result.message}. Job ID: ${result.job_id}`);
      setFile(null);

      const data = await api.getBulkJobs();
      setJobs(data.jobs);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Bulk Upload</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        Upload a CSV file with multiple companies to process them all at once. Agency mode.
      </p>

      <div className="p-6 rounded-xl border mb-8" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>CSV Format</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
          Your CSV file must have these columns:
        </p>
        <div className="p-3 rounded-lg text-sm font-mono mb-4" style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
          website,support_email<br />
          https://example1.com,hello@example1.com<br />
          https://example2.com,hello@example2.com
        </div>

        <form onSubmit={handleUpload} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
              style={{ color: 'var(--foreground)' }}
            />
          </div>
          <button
            type="submit"
            disabled={!file || uploading}
            className="px-6 py-2 rounded-lg font-semibold text-white text-sm disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: 'var(--secondary)', color: 'var(--foreground)' }}>
            {message}
          </div>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Recent Bulk Jobs</h2>
      {jobs.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No bulk jobs yet</p>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="p-4 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {(job.payload as Record<string, number>).count || '?'} companies
                  </span>
                  <span className="text-xs ml-2" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(job.created_at).toLocaleString()}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium text-white`}
                  style={{ background: job.status === 'completed' ? '#22c55e' : job.status === 'failed' ? '#ef4444' : '#f59e0b' }}>
                  {job.status}
                </span>
              </div>
              {job.result && Object.keys(job.result).length > 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                  Processed: {(job.result as Record<string, number>).processed || 0} ·
                  Failed: {(job.result as Record<string, number>).failed || 0} ·
                  Total: {(job.result as Record<string, number>).total || 0}
                </p>
              )}
              {job.error && (
                <p className="text-xs mt-1" style={{ color: 'var(--destructive)' }}>{job.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
