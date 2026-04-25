'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, IndexerProject, IndexerStats } from '@/lib/api';

export default function IndexerPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<IndexerProject[]>([]);
  const [stats, setStats] = useState<IndexerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'tools'>('projects');
  const [toolUrl, setToolUrl] = useState('');
  const [toolLoading, setToolLoading] = useState(false);
  const [metaResult, setMetaResult] = useState<Record<string, unknown> | null>(null);
  const [indexResult, setIndexResult] = useState<{ indexed: boolean; status: string } | null>(null);
  const [robotsResult, setRobotsResult] = useState<Record<string, unknown> | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [seedingEndpoints, setSeedingEndpoints] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectsData, statsData] = await Promise.all([
        api.getIndexerProjects(),
        api.getIndexerStats(),
      ]);
      setProjects(projectsData.projects);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load indexer data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newDomain.trim()) return;
    setCreating(true);
    setCreateResult(null);
    try {
      const result = await api.createIndexerProject(newDomain.trim());
      setCreateResult(
        `Project created! Sitemap ${result.sitemap_found ? 'found' : 'not found'}. ${result.urls_discovered} URLs discovered.`
      );
      setNewDomain('');
      setShowCreate(false);
      await loadData();
    } catch (err) {
      setCreateResult(`Error: ${err instanceof Error ? err.message : 'Failed to create project'}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project and all its data?')) return;
    try {
      await api.deleteIndexerProject(id);
      await loadData();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete'}`);
    }
  }

  async function handleSeedEndpoints() {
    setSeedingEndpoints(true);
    try {
      const result = await api.seedBacklinkEndpoints();
      alert(result.message);
      await loadData();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to seed'}`);
    } finally {
      setSeedingEndpoints(false);
    }
  }

  async function runTool(tool: string) {
    if (!toolUrl.trim()) return;
    setToolLoading(true);
    setActiveTool(tool);
    setMetaResult(null);
    setIndexResult(null);
    setRobotsResult(null);
    try {
      if (tool === 'meta') {
        const url = toolUrl.startsWith('http') ? toolUrl : `https://${toolUrl}`;
        const result = await api.analyzeMetaTags(url);
        setMetaResult(result as unknown as Record<string, unknown>);
      } else if (tool === 'index') {
        const url = toolUrl.startsWith('http') ? toolUrl : `https://${toolUrl}`;
        const result = await api.checkGoogleIndex(url);
        setIndexResult(result);
      } else if (tool === 'robots') {
        const domain = toolUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
        const result = await api.analyzeRobotsTxt(domain);
        setRobotsResult(result as unknown as Record<string, unknown>);
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Tool failed'}`);
    } finally {
      setToolLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--muted-foreground)' }}>Loading Indexer...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            Indexer & Backlink Builder
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginTop: 4 }}>
            Index your URLs on Google, Bing & Yandex. Build backlinks across thousands of sites.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSeedEndpoints}
            disabled={seedingEndpoints}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--card)', color: 'var(--foreground)', fontSize: 13, cursor: 'pointer',
            }}
          >
            {seedingEndpoints ? 'Seeding...' : 'Seed Endpoints'}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: 'var(--primary)', color: 'var(--primary-foreground)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Add Website
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Projects', value: stats.projects, color: '#6366f1' },
            { label: 'Total URLs', value: stats.totalUrls, color: '#8b5cf6' },
            { label: 'Indexed', value: stats.indexedUrls, color: '#22c55e' },
            { label: 'Not Indexed', value: stats.notIndexedUrls, color: '#ef4444' },
            { label: 'BL Endpoints', value: stats.backlinkEndpoints, color: '#f59e0b' },
            { label: 'Backlinks Built', value: stats.totalBacklinks, color: '#06b6d4' },
          ].map((s) => (
            <div key={s.label} style={{
              padding: 16, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50,
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 32, width: 450,
            border: '1px solid var(--border)',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', marginBottom: 16 }}>Add Website</h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 16 }}>
              Enter a domain to start indexing. We&apos;ll auto-discover the sitemap and scan for URLs.
            </p>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. brandingforge.net"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
                border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)',
                boxSizing: 'border-box',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            {createResult && (
              <div style={{
                marginTop: 12, padding: 10, borderRadius: 8, fontSize: 13,
                background: createResult.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
                color: createResult.startsWith('Error') ? '#dc2626' : '#16a34a',
              }}>
                {createResult}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleCreate} disabled={creating} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', color: 'var(--primary-foreground)',
                fontWeight: 600, cursor: 'pointer', opacity: creating ? 0.5 : 1,
              }}>{creating ? 'Creating...' : 'Add Website'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {(['projects', 'tools'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: activeTab === tab ? 'var(--primary)' : 'var(--muted-foreground)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            {tab === 'projects' ? 'My Websites' : 'SEO Tools'}
          </button>
        ))}
      </div>

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div>
          {projects.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 60, background: 'var(--card)',
              borderRadius: 12, border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>
                No websites added yet
              </h3>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginBottom: 20 }}>
                Add a website to start indexing URLs and building backlinks.
              </p>
              <button onClick={() => setShowCreate(true)} style={{
                padding: '10px 24px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', color: 'var(--primary-foreground)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>+ Add Website</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {projects.map((project) => {
                const indexRate = project.total_urls > 0
                  ? Math.round((project.indexed_count / project.total_urls) * 100)
                  : 0;
                return (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/dashboard/indexer/${project.id}`)}
                    style={{
                      padding: 20, borderRadius: 12, background: 'var(--card)',
                      border: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                            {project.domain}
                          </h3>
                          <span style={{
                            padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                            background: project.status === 'active' ? '#dcfce7' : '#fef9c3',
                            color: project.status === 'active' ? '#16a34a' : '#ca8a04',
                          }}>
                            {project.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                          {project.sitemap_url ? 'Sitemap found' : 'No sitemap'} &middot; Added {new Date(project.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                        style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca',
                          background: '#fef2f2', color: '#dc2626', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Total URLs</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)' }}>{project.total_urls.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Indexed</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{project.indexed_count.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Not Indexed</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>{project.not_indexed_count.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Index Rate</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>{indexRate}%</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {project.total_urls > 0 && (
                      <div style={{
                        marginTop: 12, height: 6, borderRadius: 3,
                        background: 'var(--border)', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 3, transition: 'width 0.5s',
                          background: 'linear-gradient(90deg, #22c55e, #6366f1)',
                          width: `${indexRate}%`,
                        }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SEO Tools Tab */}
      {activeTab === 'tools' && (
        <div>
          <div style={{
            padding: 20, borderRadius: 12, background: 'var(--card)',
            border: '1px solid var(--border)', marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 12 }}>
              Enter URL or Domain
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={toolUrl}
                onChange={(e) => setToolUrl(e.target.value)}
                placeholder="e.g. https://brandingforge.net or brandingforge.net"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, fontSize: 14,
                  border: '1px solid var(--border)', background: 'var(--background)',
                  color: 'var(--foreground)',
                }}
                onKeyDown={(e) => e.key === 'Enter' && activeTool && runTool(activeTool)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {[
                { id: 'meta', label: 'Analyze Meta Tags', icon: '🏷' },
                { id: 'index', label: 'Check Index Status', icon: '📊' },
                { id: 'robots', label: 'Analyze robots.txt', icon: '🤖' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => runTool(tool.id)}
                  disabled={toolLoading || !toolUrl.trim()}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                    background: activeTool === tool.id && toolLoading ? 'var(--primary)' : 'var(--card)',
                    color: activeTool === tool.id && toolLoading ? 'var(--primary-foreground)' : 'var(--foreground)',
                    fontSize: 13, cursor: 'pointer', opacity: toolLoading ? 0.6 : 1,
                  }}
                >
                  {tool.icon} {toolLoading && activeTool === tool.id ? 'Analyzing...' : tool.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta Tags Result */}
          {metaResult && activeTool === 'meta' && (
            <div style={{
              padding: 20, borderRadius: 12, background: 'var(--card)',
              border: '1px solid var(--border)', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>Meta Tags Analysis</h3>
                <div style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 14, fontWeight: 700,
                  background: (metaResult.score as number) >= 80 ? '#dcfce7' : (metaResult.score as number) >= 50 ? '#fef9c3' : '#fef2f2',
                  color: (metaResult.score as number) >= 80 ? '#16a34a' : (metaResult.score as number) >= 50 ? '#ca8a04' : '#dc2626',
                }}>
                  Score: {metaResult.score as number}/100
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Title', value: metaResult.title },
                  { label: 'Description', value: metaResult.description },
                  { label: 'OG Title', value: metaResult.ogTitle },
                  { label: 'OG Description', value: metaResult.ogDescription },
                  { label: 'OG Image', value: metaResult.ogImage },
                  { label: 'Twitter Card', value: metaResult.twitterCard },
                  { label: 'Canonical', value: metaResult.canonical },
                  { label: 'Robots', value: metaResult.robots },
                  { label: 'Viewport', value: metaResult.viewport },
                  { label: 'Load Time', value: `${metaResult.loadTimeMs}ms` },
                  { label: 'Word Count', value: metaResult.wordCount },
                  { label: 'Images', value: metaResult.imageCount },
                  { label: 'Links', value: metaResult.linkCount },
                  { label: 'SSL', value: metaResult.hasSSL ? 'Yes' : 'No' },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: 10, borderRadius: 8, background: 'var(--background)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 2 }}>{item.label}</div>
                    <div style={{
                      fontSize: 13, color: 'var(--foreground)', wordBreak: 'break-all',
                      maxHeight: 60, overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.value as string || <span style={{ color: 'var(--muted-foreground)', fontStyle: 'italic' }}>Not set</span>}
                    </div>
                  </div>
                ))}
              </div>

              {(metaResult.issues as string[])?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>Issues Found</div>
                  {(metaResult.issues as string[]).map((issue, i) => (
                    <div key={i} style={{
                      padding: '6px 10px', fontSize: 13, color: '#dc2626',
                      background: '#fef2f2', borderRadius: 6, marginBottom: 4,
                    }}>
                      {issue}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Index Check Result */}
          {indexResult && activeTool === 'index' && (
            <div style={{
              padding: 20, borderRadius: 12, background: 'var(--card)',
              border: '1px solid var(--border)', marginBottom: 16,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 12 }}>Google Index Check</h3>
              <div style={{
                padding: 16, borderRadius: 8, textAlign: 'center',
                background: indexResult.indexed ? '#dcfce7' : '#fef2f2',
                border: `1px solid ${indexResult.indexed ? '#bbf7d0' : '#fecaca'}`,
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{indexResult.indexed ? '🟢' : '🔴'}</div>
                <div style={{
                  fontSize: 16, fontWeight: 700,
                  color: indexResult.indexed ? '#16a34a' : '#dc2626',
                }}>
                  {indexResult.indexed ? 'Indexed on Google' : 'Not Indexed on Google'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                  Status: {indexResult.status}
                </div>
              </div>
            </div>
          )}

          {/* Robots.txt Result */}
          {robotsResult && activeTool === 'robots' && (
            <div style={{
              padding: 20, borderRadius: 12, background: 'var(--card)',
              border: '1px solid var(--border)', marginBottom: 16,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--foreground)', marginBottom: 12 }}>Robots.txt Analysis</h3>
              {robotsResult.found ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--background)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Sitemaps</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{(robotsResult.sitemaps as string[])?.length || 0}</div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 8, background: 'var(--background)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Disallowed Paths</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{(robotsResult.disallowedPaths as string[])?.length || 0}</div>
                    </div>
                  </div>
                  {(robotsResult.sitemaps as string[])?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>Sitemaps:</div>
                      {(robotsResult.sitemaps as string[]).map((s, i) => (
                        <div key={i} style={{ fontSize: 12, color: 'var(--primary)', wordBreak: 'break-all', marginBottom: 2 }}>{s}</div>
                      ))}
                    </div>
                  )}
                  <details>
                    <summary style={{ fontSize: 13, cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                      View raw robots.txt
                    </summary>
                    <pre style={{
                      marginTop: 8, padding: 12, borderRadius: 8, fontSize: 12,
                      background: 'var(--background)', border: '1px solid var(--border)',
                      overflow: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap',
                    }}>
                      {robotsResult.content as string}
                    </pre>
                  </details>
                </>
              ) : (
                <div style={{ padding: 16, textAlign: 'center', color: '#dc2626', background: '#fef2f2', borderRadius: 8 }}>
                  No robots.txt found for this domain
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
