'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, IndexerProject, IndexerUrl, IndexerActivity, BacklinkResult, Campaign, IndexerAlert, EndpointStats } from '@/lib/api';

type Tab = 'urls' | 'backlinks' | 'campaigns' | 'llm' | 'alerts' | 'activity';

export default function IndexerProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<IndexerProject | null>(null);
  const [urlStats, setUrlStats] = useState<Array<{ index_status: string; count: string }>>([]);
  const [activity, setActivity] = useState<IndexerActivity[]>([]);
  const [urls, setUrls] = useState<IndexerUrl[]>([]);
  const [urlStatusCounts, setUrlStatusCounts] = useState<Record<string, number>>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('urls');

  // Backlinks state
  const [backlinks, setBacklinks] = useState<BacklinkResult[]>([]);
  const [backlinkPagination, setBacklinkPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [backlinkStats, setBacklinkStats] = useState<{ total: number; submitted: number; verified: number; dead: number; byCategory: Record<string, number> } | null>(null);

  // Action states
  const [syncing, setSyncing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submittingIndexNow, setSubmittingIndexNow] = useState(false);
  const [submittingPing, setSubmittingPing] = useState(false);
  const [buildingBacklinks, setBuildingBacklinks] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  // Add URLs modal
  const [showAddUrls, setShowAddUrls] = useState(false);
  const [newUrlsText, setNewUrlsText] = useState('');

  // Campaign state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [processingCampaign, setProcessingCampaign] = useState<string | null>(null);

  // LLM indexing state
  const [submittingLLM, setSubmittingLLM] = useState(false);
  const [llmResults, setLlmResults] = useState<Array<{ engine: string; status: string; method: string }> | null>(null);

  // Alerts & Discovery state
  const [alerts, setAlerts] = useState<IndexerAlert[]>([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);
  const [endpointStats, setEndpointStats] = useState<EndpointStats | null>(null);
  const [runningDiscovery, setRunningDiscovery] = useState(false);
  const [runningAutoSubmit, setRunningAutoSubmit] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const data = await api.getIndexerProject(projectId);
      setProject(data.project);
      setUrlStats(data.urlStats);
      setActivity(data.activity);
    } catch {
      router.push('/dashboard/indexer');
    }
  }, [projectId, router]);

  const loadUrls = useCallback(async (page = 1) => {
    try {
      const data = await api.getIndexerUrls(projectId, page, 50, statusFilter, searchQuery);
      setUrls(data.urls);
      setUrlStatusCounts(data.statusCounts);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to load URLs:', err);
    }
  }, [projectId, statusFilter, searchQuery]);

  const loadBacklinks = useCallback(async (page = 1) => {
    try {
      const [blData, statsData] = await Promise.all([
        api.getBacklinks(projectId, page),
        api.getBacklinkStats(projectId),
      ]);
      setBacklinks(blData.backlinks);
      setBacklinkPagination(blData.pagination);
      setBacklinkStats(statsData);
    } catch (err) {
      console.error('Failed to load backlinks:', err);
    }
  }, [projectId]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await loadProject();
      setLoading(false);
    }
    init();
  }, [loadProject]);

  useEffect(() => {
    if (!loading) loadUrls();
  }, [loading, statusFilter, searchQuery, loadUrls]);

  useEffect(() => {
    if (!loading && activeTab === 'backlinks') loadBacklinks();
  }, [loading, activeTab, loadBacklinks]);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await api.getCampaigns(projectId);
      setCampaigns(data.campaigns);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  }, [projectId]);

  useEffect(() => {
    if (!loading && activeTab === 'campaigns') loadCampaigns();
  }, [loading, activeTab, loadCampaigns]);

  const loadAlerts = useCallback(async () => {
    try {
      const data = await api.getAlerts(projectId);
      setAlerts(data.alerts);
      setUnreadAlertCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  }, [projectId]);

  const loadEndpointStats = useCallback(async () => {
    try {
      const data = await api.getEndpointStats();
      setEndpointStats(data);
    } catch (err) {
      console.error('Failed to load endpoint stats:', err);
    }
  }, []);

  useEffect(() => {
    if (!loading && activeTab === 'alerts') {
      loadAlerts();
      loadEndpointStats();
    }
  }, [loading, activeTab, loadAlerts, loadEndpointStats]);

  // Load unread alert count on mount
  useEffect(() => {
    if (!loading) {
      api.getAlerts(projectId).then(data => {
        setUnreadAlertCount(data.unreadCount);
      }).catch(() => {});
    }
  }, [loading, projectId]);

  function showResult(msg: string) {
    setActionResult(msg);
    setTimeout(() => setActionResult(null), 5000);
  }

  async function handleSyncSitemap() {
    setSyncing(true);
    try {
      const result = await api.syncSitemap(projectId);
      showResult(`Sitemap synced: ${result.added} new URLs added (${result.total} total in sitemap)`);
      await Promise.all([loadProject(), loadUrls()]);
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Sync failed'}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleCheckIndex() {
    setChecking(true);
    try {
      const result = await api.checkIndexStatus(projectId, undefined, true);
      showResult(`Checked ${result.checked} URLs: ${result.indexed} indexed, ${result.notIndexed} not indexed`);
      await Promise.all([loadProject(), loadUrls()]);
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Check failed'}`);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmitIndexNow() {
    setSubmittingIndexNow(true);
    try {
      const result = await api.submitIndexNow(projectId, undefined, true);
      showResult(`IndexNow: Submitted ${result.submitted} URLs to Bing/Yandex. ${result.errors.length ? `Errors: ${result.errors.length}` : ''}`);
      await loadProject();
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Submit failed'}`);
    } finally {
      setSubmittingIndexNow(false);
    }
  }

  async function handleSubmitPing() {
    setSubmittingPing(true);
    try {
      const result = await api.submitPing(projectId);
      showResult(`Pinged: ${result.sitemap_pinged} sitemap pings, ${result.urls_pinged} URL pings`);
      await loadProject();
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Ping failed'}`);
    } finally {
      setSubmittingPing(false);
    }
  }

  async function handleBuildBacklinks() {
    setBuildingBacklinks(true);
    try {
      const result = await api.buildBacklinks(projectId);
      showResult(`Backlinks: ${result.submitted} submitted. ${result.errors.length ? `${result.errors.length} errors.` : ''}`);
      await loadBacklinks();
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Build failed'}`);
    } finally {
      setBuildingBacklinks(false);
    }
  }

  async function handleAddUrls() {
    const urlList = newUrlsText.split('\n').map(u => u.trim()).filter(Boolean);
    if (urlList.length === 0) return;
    try {
      const result = await api.addIndexerUrls(projectId, urlList);
      showResult(`Added ${result.added} URLs`);
      setShowAddUrls(false);
      setNewUrlsText('');
      await Promise.all([loadProject(), loadUrls()]);
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Add failed'}`);
    }
  }

  async function handleCreateCampaign() {
    setCreatingCampaign(true);
    try {
      const result = await api.createCampaign(projectId, { daily_limit: 200, duration_days: 30 });
      showResult(`Campaign created: ${result.totalEndpoints} endpoints queued, ~${result.estimatedDays} days to complete`);
      await loadCampaigns();
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Failed to create campaign'}`);
    } finally {
      setCreatingCampaign(false);
    }
  }

  async function handleProcessBatch(campaignId: string) {
    setProcessingCampaign(campaignId);
    try {
      const result = await api.processCampaignBatch(campaignId);
      showResult(`Batch: ${result.succeeded} submitted, ${result.failed} failed, ${result.remaining} remaining${result.paused ? ' — PAUSED (error rate too high)' : ''}`);
      await loadCampaigns();
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Processing failed'}`);
    } finally {
      setProcessingCampaign(null);
    }
  }

  async function handlePauseCampaign(campaignId: string) {
    try {
      await api.pauseCampaign(campaignId);
      showResult('Campaign paused');
      await loadCampaigns();
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Pause failed'}`);
    }
  }

  async function handleResumeCampaign(campaignId: string) {
    try {
      await api.resumeCampaign(campaignId);
      showResult('Campaign resumed');
      await loadCampaigns();
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Resume failed'}`);
    }
  }

  async function handleRunDiscovery() {
    setRunningDiscovery(true);
    try {
      await api.triggerDiscovery();
      showResult('Endpoint discovery started in background. New endpoints will appear in a few minutes.');
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Discovery failed'}`);
    } finally {
      setRunningDiscovery(false);
    }
  }

  async function handleRunAutoSubmit() {
    setRunningAutoSubmit(true);
    try {
      await api.triggerAutoSubmit(100);
      showResult('Auto-submit started in background. Submitting to all new endpoints for all projects.');
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'Auto-submit failed'}`);
    } finally {
      setRunningAutoSubmit(false);
    }
  }

  async function handleMarkAlertRead(alertId: string) {
    try {
      await api.markAlertRead(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
      setUnreadAlertCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert read:', err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllAlertsRead(projectId);
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
      setUnreadAlertCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  }

  async function handleLLMIndex() {
    setSubmittingLLM(true);
    try {
      const result = await api.submitLLMIndex(projectId);
      setLlmResults(result.results);
      const succeeded = result.results.filter(r => r.status === 'submitted').length;
      showResult(`LLM Indexing: ${succeeded}/${result.results.length} endpoints submitted`);
    } catch (err) {
      showResult(`Error: ${err instanceof Error ? err.message : 'LLM indexing failed'}`);
    } finally {
      setSubmittingLLM(false);
    }
  }

  if (loading || !project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ color: 'var(--muted-foreground)' }}>Loading project...</div>
      </div>
    );
  }

  const indexRate = project.total_urls > 0 ? Math.round((project.indexed_count / project.total_urls) * 100) : 0;
  const statusColors: Record<string, string> = {
    indexed: '#22c55e',
    not_indexed: '#ef4444',
    crawled_not_indexed: '#f59e0b',
    discovered_not_crawled: '#f97316',
    submitted: '#6366f1',
    unknown: '#9ca3af',
    error: '#dc2626',
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push('/dashboard/indexer')} style={{
          padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
          background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', fontSize: 13,
        }}>
          &larr; Back
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            {project.domain}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
            {project.sitemap_url || 'No sitemap'} &middot; IndexNow Key: {project.indexnow_key?.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Action Result Banner */}
      {actionResult && (
        <div style={{
          marginBottom: 16, padding: 12, borderRadius: 8, fontSize: 13,
          background: actionResult.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
          color: actionResult.startsWith('Error') ? '#dc2626' : '#16a34a',
          border: `1px solid ${actionResult.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`,
        }}>
          {actionResult}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total URLs', value: project.total_urls, color: '#6366f1' },
          { label: 'Indexed', value: project.indexed_count, color: '#22c55e' },
          { label: 'Not Indexed', value: project.not_indexed_count, color: '#ef4444' },
          { label: 'Index Rate', value: `${indexRate}%`, color: '#8b5cf6' },
          { label: 'Backlinks', value: backlinkStats?.total || 0, color: '#06b6d4' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: 14, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>
              {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
        padding: 16, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)',
      }}>
        <button onClick={handleSyncSitemap} disabled={syncing} style={actionBtnStyle(syncing)}>
          {syncing ? 'Syncing...' : '🔄 Sync Sitemap'}
        </button>
        <button onClick={handleCheckIndex} disabled={checking} style={actionBtnStyle(checking)}>
          {checking ? 'Checking...' : '📊 Check Index Status'}
        </button>
        <button onClick={handleSubmitIndexNow} disabled={submittingIndexNow} style={actionBtnStyle(submittingIndexNow)}>
          {submittingIndexNow ? 'Submitting...' : '⚡ Submit IndexNow'}
        </button>
        <button onClick={handleSubmitPing} disabled={submittingPing} style={actionBtnStyle(submittingPing)}>
          {submittingPing ? 'Pinging...' : '📡 Ping Services'}
        </button>
        <button onClick={handleBuildBacklinks} disabled={buildingBacklinks} style={{
          ...actionBtnStyle(buildingBacklinks),
          background: buildingBacklinks ? 'var(--border)' : '#6366f1',
          color: '#fff', border: 'none',
        }}>
          {buildingBacklinks ? 'Building...' : '🔗 Build Backlinks'}
        </button>
        <button onClick={() => setShowAddUrls(true)} style={{
          ...actionBtnStyle(false), background: 'var(--background)',
        }}>
          + Add URLs
        </button>
      </div>

      {/* Add URLs Modal */}
      {showAddUrls && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50,
        }}>
          <div style={{
            background: 'var(--card)', borderRadius: 16, padding: 32, width: 500,
            border: '1px solid var(--border)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--foreground)', marginBottom: 12 }}>Add URLs</h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, marginBottom: 12 }}>
              One URL per line (max 1,000)
            </p>
            <textarea
              value={newUrlsText}
              onChange={(e) => setNewUrlsText(e.target.value)}
              placeholder={'https://example.com/page1\nhttps://example.com/page2'}
              rows={8}
              style={{
                width: '100%', padding: 12, borderRadius: 8, fontSize: 13, fontFamily: 'monospace',
                border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddUrls(false)} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleAddUrls} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 600, cursor: 'pointer',
              }}>Add URLs</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        {([
          { id: 'urls' as Tab, label: `URLs (${project.total_urls})` },
          { id: 'backlinks' as Tab, label: `Backlinks (${backlinkStats?.total || 0})` },
          { id: 'campaigns' as Tab, label: 'Drip-Feed Campaigns' },
          { id: 'llm' as Tab, label: 'LLM Indexing' },
          { id: 'alerts' as Tab, label: `Alerts & Discovery${unreadAlertCount > 0 ? ` (${unreadAlertCount})` : ''}` },
          { id: 'activity' as Tab, label: 'Activity Log' },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontSize: 14, fontWeight: 600,
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted-foreground)',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* URLs Tab */}
      {activeTab === 'urls' && (
        <div>
          {/* Status Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All', count: Object.values(urlStatusCounts).reduce((a, b) => a + b, 0) },
              { key: 'indexed', label: 'Indexed', count: urlStatusCounts.indexed || 0 },
              { key: 'not_indexed', label: 'Not Indexed', count: urlStatusCounts.not_indexed || 0 },
              { key: 'submitted', label: 'Submitted', count: urlStatusCounts.submitted || 0 },
              { key: 'unknown', label: 'Unknown', count: urlStatusCounts.unknown || 0 },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setStatusFilter(f.key); setPagination(prev => ({ ...prev, page: 1 })); }}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: statusFilter === f.key ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: statusFilter === f.key ? 'var(--primary)' : 'var(--card)',
                  color: statusFilter === f.key ? 'var(--primary-foreground)' : 'var(--foreground)',
                  cursor: 'pointer',
                }}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search URLs..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 13,
              border: '1px solid var(--border)', background: 'var(--background)',
              color: 'var(--foreground)', marginBottom: 16, boxSizing: 'border-box',
            }}
          />

          {/* URL List */}
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {urls.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>
                No URLs found. Sync sitemap or add URLs manually.
              </div>
            ) : (
              urls.map((url, i) => (
                <div
                  key={url.id}
                  style={{
                    padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < urls.length - 1 ? '1px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? 'var(--card)' : 'var(--background)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, color: 'var(--foreground)', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {url.url}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      Source: {url.source} &middot; Submitted {url.submit_count}x
                      {url.last_checked && ` · Checked ${new Date(url.last_checked).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: `${statusColors[url.index_status] || '#9ca3af'}20`,
                    color: statusColors[url.index_status] || '#9ca3af',
                    whiteSpace: 'nowrap', marginLeft: 12,
                  }}>
                    {url.index_status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => loadUrls(pagination.page - 1)}
                disabled={pagination.page <= 1}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
              >Previous</button>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <button
                onClick={() => loadUrls(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* Backlinks Tab */}
      {activeTab === 'backlinks' && (
        <div>
          {/* Backlink Stats */}
          {backlinkStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total', value: backlinkStats.total, color: '#6366f1' },
                { label: 'Submitted', value: backlinkStats.submitted, color: '#f59e0b' },
                { label: 'Verified', value: backlinkStats.verified, color: '#22c55e' },
                { label: 'Dead', value: backlinkStats.dead, color: '#ef4444' },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: 14, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}

          {/* Category breakdown */}
          {backlinkStats && Object.keys(backlinkStats.byCategory).length > 0 && (
            <div style={{
              padding: 16, borderRadius: 12, background: 'var(--card)',
              border: '1px solid var(--border)', marginBottom: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 12 }}>By Category</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(backlinkStats.byCategory).map(([cat, count]) => (
                  <span key={cat} style={{
                    padding: '4px 12px', borderRadius: 16, fontSize: 12,
                    background: 'var(--background)', border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}>
                    {cat.replace(/_/g, ' ')}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Backlink List */}
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {backlinks.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>
                No backlinks yet. Click &quot;Build Backlinks&quot; to start.
              </div>
            ) : (
              backlinks.map((bl, i) => (
                <div
                  key={bl.id}
                  style={{
                    padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < backlinks.length - 1 ? '1px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? 'var(--card)' : 'var(--background)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                      {bl.endpoint_name}
                    </div>
                    <div style={{
                      fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {bl.backlink_url}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 10,
                      background: 'var(--background)', color: 'var(--muted-foreground)',
                      border: '1px solid var(--border)',
                    }}>
                      {bl.endpoint_category}
                    </span>
                    <span style={{
                      padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: bl.status === 'submitted' ? '#fef9c3' : bl.status === 'verified' ? '#dcfce7' : '#fef2f2',
                      color: bl.status === 'submitted' ? '#ca8a04' : bl.status === 'verified' ? '#16a34a' : '#dc2626',
                    }}>
                      {bl.status}
                    </span>
                    {bl.http_status && (
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                        HTTP {bl.http_status}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {backlinkPagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <button
                onClick={() => loadBacklinks(backlinkPagination.page - 1)}
                disabled={backlinkPagination.page <= 1}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', opacity: backlinkPagination.page <= 1 ? 0.5 : 1 }}
              >Previous</button>
              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                Page {backlinkPagination.page} of {backlinkPagination.totalPages}
              </span>
              <button
                onClick={() => loadBacklinks(backlinkPagination.page + 1)}
                disabled={backlinkPagination.page >= backlinkPagination.totalPages}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', opacity: backlinkPagination.page >= backlinkPagination.totalPages ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>Drip-Feed Campaigns</h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                Spread backlink submissions over time to avoid detection. Each campaign processes a set number of endpoints per day with randomized delays.
              </p>
            </div>
            <button
              onClick={handleCreateCampaign}
              disabled={creatingCampaign}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: creatingCampaign ? 'var(--border)' : '#6366f1',
                color: '#fff', fontWeight: 600, cursor: creatingCampaign ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {creatingCampaign ? 'Creating...' : '+ New Campaign'}
            </button>
          </div>

          {campaigns.length === 0 ? (
            <div style={{
              padding: 40, textAlign: 'center', color: 'var(--muted-foreground)',
              borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)',
            }}>
              No campaigns yet. Create one to start drip-feeding backlink submissions.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {campaigns.map((c) => {
                const total = c.total_endpoints;
                const processed = parseInt(c.submitted_count) + parseInt(c.failed_count);
                const progress = total > 0 ? Math.round((processed / total) * 100) : 0;
                return (
                  <div key={c.id} style={{
                    padding: 20, borderRadius: 12, background: 'var(--card)',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          background: c.status === 'active' ? '#dcfce7' : c.status === 'paused' ? '#fef9c3' : c.status === 'completed' ? '#e0e7ff' : '#fef2f2',
                          color: c.status === 'active' ? '#16a34a' : c.status === 'paused' ? '#ca8a04' : c.status === 'completed' ? '#4f46e5' : '#dc2626',
                        }}>
                          {c.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', marginLeft: 8 }}>
                          {c.daily_limit}/day &middot; {c.duration_days} days &middot; Created {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleProcessBatch(c.id)}
                              disabled={processingCampaign === c.id}
                              style={{
                                padding: '6px 14px', borderRadius: 6, border: 'none',
                                background: processingCampaign === c.id ? 'var(--border)' : '#6366f1',
                                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              {processingCampaign === c.id ? 'Processing...' : 'Run Batch'}
                            </button>
                            <button onClick={() => handlePauseCampaign(c.id)} style={{
                              padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)',
                              background: 'var(--card)', color: 'var(--foreground)', fontSize: 12, cursor: 'pointer',
                            }}>Pause</button>
                          </>
                        )}
                        {c.status === 'paused' && (
                          <button onClick={() => handleResumeCampaign(c.id)} style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none',
                            background: '#22c55e', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          }}>Resume</button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ background: 'var(--border)', borderRadius: 6, height: 8, marginBottom: 8 }}>
                      <div style={{
                        background: '#6366f1', borderRadius: 6, height: '100%',
                        width: `${progress}%`, transition: 'width 0.3s',
                      }} />
                    </div>

                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted-foreground)' }}>
                      <span>Total: <strong style={{ color: 'var(--foreground)' }}>{total.toLocaleString()}</strong></span>
                      <span>Submitted: <strong style={{ color: '#22c55e' }}>{parseInt(c.submitted_count).toLocaleString()}</strong></span>
                      <span>Failed: <strong style={{ color: '#ef4444' }}>{parseInt(c.failed_count).toLocaleString()}</strong></span>
                      <span>Pending: <strong style={{ color: '#f59e0b' }}>{parseInt(c.pending_count).toLocaleString()}</strong></span>
                      <span>Progress: <strong style={{ color: '#6366f1' }}>{progress}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LLM Indexing Tab */}
      {activeTab === 'llm' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>LLM Search Engine Indexing</h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
                Submit your domain to platforms that AI search engines (ChatGPT, Perplexity, Gemini, Claude) crawl and reference.
              </p>
            </div>
            <button
              onClick={handleLLMIndex}
              disabled={submittingLLM}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: submittingLLM ? 'var(--border)' : '#8b5cf6',
                color: '#fff', fontWeight: 600, cursor: submittingLLM ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {submittingLLM ? 'Submitting...' : 'Submit to AI Engines'}
            </button>
          </div>

          {/* How it works */}
          <div style={{
            padding: 16, borderRadius: 12, background: 'var(--card)',
            border: '1px solid var(--border)', marginBottom: 20,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>How LLM Indexing Works</div>
            <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
              AI search engines like ChatGPT, Perplexity, and Gemini discover content through web crawling, trusted knowledge bases, and structured data.
              We submit your domain to 25+ platforms these AI engines rely on — including Schema.org validators, knowledge bases (Wikipedia, Wikidata),
              developer platforms (GitHub, StackOverflow), review sites (G2, Capterra, TrustPilot), and AI tool directories.
              This increases the likelihood that AI assistants will reference and recommend your product.
            </div>
          </div>

          {/* Results */}
          {llmResults && (
            <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'var(--card)', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
                Results: {llmResults.filter(r => r.status === 'submitted').length}/{llmResults.length} successful
              </div>
              {llmResults.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: i < llmResults.length - 1 ? '1px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? 'var(--card)' : 'var(--background)',
                  }}
                >
                  <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{r.engine}</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                    background: r.status === 'submitted' ? '#dcfce7' : '#fef2f2',
                    color: r.status === 'submitted' ? '#16a34a' : '#dc2626',
                  }}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!llmResults && (
            <div style={{
              padding: 40, textAlign: 'center', color: 'var(--muted-foreground)',
              borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)',
            }}>
              Click &quot;Submit to AI Engines&quot; to submit {project.domain} to 25+ LLM-relevant platforms.
            </div>
          )}
        </div>
      )}

      {/* Alerts & Discovery Tab */}
      {activeTab === 'alerts' && (
        <div>
          {/* Admin Controls */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap',
            padding: 16, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)',
          }}>
            <button onClick={handleRunDiscovery} disabled={runningDiscovery} style={{
              ...actionBtnStyle(runningDiscovery),
              background: runningDiscovery ? 'var(--border)' : '#8b5cf6', color: '#fff', border: 'none',
            }}>
              {runningDiscovery ? 'Discovering...' : '🔍 Run Endpoint Discovery'}
            </button>
            <button onClick={handleRunAutoSubmit} disabled={runningAutoSubmit} style={{
              ...actionBtnStyle(runningAutoSubmit),
              background: runningAutoSubmit ? 'var(--border)' : '#06b6d4', color: '#fff', border: 'none',
            }}>
              {runningAutoSubmit ? 'Submitting...' : '🚀 Auto-Submit to New Endpoints'}
            </button>
            <button onClick={handleMarkAllRead} style={actionBtnStyle(false)}>
              Mark All Read
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
              Auto-discovery runs every 6 hours &middot; Auto-submit runs every 6 hours
            </div>
          </div>

          {/* Endpoint Stats */}
          {endpointStats && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--foreground)' }}>
                Endpoint Database — {endpointStats.totalEndpoints.toLocaleString()} Total (Growing Every 6 Hours)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
                {endpointStats.byCategory.map((cat) => (
                  <div key={cat.category} style={{
                    padding: 12, borderRadius: 8, background: 'var(--card)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>
                      {cat.category.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#6366f1' }}>
                      {parseInt(cat.count).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Discoveries */}
              {endpointStats.recentDiscoveries.length > 0 && (
                <div style={{ borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ padding: '10px 16px', background: 'var(--card)', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                    Recent Discovery Runs
                  </div>
                  {endpointStats.recentDiscoveries.map((d, i) => (
                    <div key={d.id} style={{
                      padding: '8px 16px', display: 'flex', justifyContent: 'space-between',
                      borderBottom: i < endpointStats.recentDiscoveries.length - 1 ? '1px solid var(--border)' : 'none',
                      background: i % 2 === 0 ? 'var(--background)' : 'var(--card)', fontSize: 13,
                    }}>
                      <span>Discovered: {d.discovered_count} | Verified: {d.verified_count} | Added: {d.added_count}</span>
                      <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>{new Date(d.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alert Messages */}
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: 'var(--foreground)' }}>
            Alerts {unreadAlertCount > 0 && <span style={{ color: '#ef4444', fontSize: 13 }}>({unreadAlertCount} unread)</span>}
          </h3>
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            {alerts.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>
                No alerts yet. Alerts appear when new endpoints are discovered or weekly digests are generated.
              </div>
            ) : (
              alerts.map((alert, i) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
                    borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none',
                    background: alert.read ? (i % 2 === 0 ? 'var(--card)' : 'var(--background)') : '#eff6ff',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {!alert.read && <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block',
                      }} />}
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{alert.title}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 4,
                        background: alert.type === 'new_endpoints' ? '#dbeafe' : alert.type === 'weekly_digest' ? '#fef3c7' : '#e0e7ff',
                        color: alert.type === 'new_endpoints' ? '#1d4ed8' : alert.type === 'weekly_digest' ? '#92400e' : '#4338ca',
                      }}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>{alert.message}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                    {!alert.read && (
                      <button onClick={() => handleMarkAlertRead(alert.id)} style={{
                        padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)',
                        background: 'var(--card)', fontSize: 11, cursor: 'pointer', color: 'var(--muted-foreground)',
                      }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {activity.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)' }}>
              No activity yet.
            </div>
          ) : (
            activity.map((act, i) => (
              <div
                key={act.id}
                style={{
                  padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: i < activity.length - 1 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'var(--card)' : 'var(--background)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>
                    {act.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                    {JSON.stringify(act.details).slice(0, 100)}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                  {new Date(act.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function actionBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
    background: disabled ? 'var(--border)' : 'var(--card)', color: 'var(--foreground)',
    fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    fontWeight: 500,
  };
}
