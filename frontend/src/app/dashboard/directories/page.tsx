'use client';

import { useState, useEffect } from 'react';
import { api, Directory } from '@/lib/api';

const TYPE_COLORS: Record<string, string> = {
  api: '#22c55e',
  auto_form: '#3b82f6',
  manual: '#f59e0b',
  editorial_email: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
  api: 'API',
  auto_form: 'Auto Form',
  manual: 'Manual',
  editorial_email: 'Email',
};

export default function DirectoriesPage() {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [byType, setByType] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDirectoryStats();
        setDirectories(data.directories);
        setByType(data.byType);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'all'
    ? directories
    : directories.filter(d => d.submission_type === filter);

  if (loading) {
    return <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted-foreground)' }}>Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>Directories</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        {directories.length} directories configured across {Object.keys(byType).length} submission types
      </p>

      <div className="flex gap-3 mb-6">
        <button onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border"
          style={{ borderColor: filter === 'all' ? 'var(--primary)' : 'var(--border)', color: filter === 'all' ? 'var(--primary)' : 'var(--muted-foreground)' }}>
          All ({directories.length})
        </button>
        {Object.entries(byType).map(([type, count]) => (
          <button key={type} onClick={() => setFilter(filter === type ? 'all' : type)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{ borderColor: filter === type ? TYPE_COLORS[type] : 'var(--border)', color: filter === type ? TYPE_COLORS[type] : 'var(--muted-foreground)' }}>
            {TYPE_LABELS[type] || type} ({count})
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.map(dir => (
          <div key={dir.id} className="p-4 rounded-lg border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{dir.name}</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                  {dir.notes || dir.submit_url}
                </p>
                <div className="flex gap-2 mt-2">
                  {dir.requires_logo && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>Logo</span>}
                  {dir.requires_screenshot && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>Screenshot</span>}
                  {dir.requires_category && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>Category</span>}
                  {dir.title_limit && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>Title: {dir.title_limit}ch</span>}
                  {dir.desc_limit && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--secondary)', color: 'var(--muted-foreground)' }}>Desc: {dir.desc_limit}ch</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full text-white font-medium"
                  style={{ background: TYPE_COLORS[dir.submission_type] || '#64748b' }}>
                  {TYPE_LABELS[dir.submission_type] || dir.submission_type}
                </span>
                <a href={dir.submit_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded border"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                  Visit
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
