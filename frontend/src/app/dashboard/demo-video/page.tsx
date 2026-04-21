'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlayerRef } from '@remotion/player';
import { api, Company, Screenshot } from '@/lib/api';
import { DemoVideoPlayer, TOTAL_DURATION_FRAMES } from '@/components/video/DemoVideoPlayer';
import { DemoVideoProps } from '@/components/video/types';
import { exportVideoToMp4, downloadFromBlobUrl } from '@/components/video/exportVideo';

async function resolveLogoUrl(logoUrl: string, website: string): Promise<string> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://listeverywhere-api.onrender.com';
  let hostname = '';
  try { hostname = new URL(website).hostname; } catch { /* ignore */ }

  // Try multiple logo sources in order of preference
  const candidates: string[] = [];
  
  // 1. Original logo URL from database
  if (logoUrl) candidates.push(logoUrl);
  
  // 2. Common logo paths on the website
  if (hostname) {
    candidates.push(`https://${hostname}/images/logo.png`);
    candidates.push(`https://${hostname}/logo.png`);
    candidates.push(`https://${hostname}/favicon.ico`);
  }

  // Try each candidate through our proxy (handles CORS + validates existence)
  for (const url of candidates) {
    try {
      const proxyUrl = `${apiBase}/api/image-proxy?url=${encodeURIComponent(url)}`;
      const resp = await fetch(proxyUrl, { method: 'HEAD' });
      if (resp.ok) {
        console.log(`[Logo] Resolved: ${url}`);
        return url;
      }
    } catch { /* try next */ }
  }

  // Final fallback: Google Favicon API (always works, has CORS)
  if (hostname) {
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  }

  return '';
}

function DemoVideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyParam = searchParams.get('company');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [videoData, setVideoData] = useState<DemoVideoProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [renderingVideo, setRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderPhase, setRenderPhase] = useState('');
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    api.getCompanies()
      .then((data) => {
        setCompanies(data.companies);
        if (companyParam && data.companies.some((c: Company) => c.id === companyParam)) {
          setSelectedCompanyId(companyParam);
        } else if (data.companies.length > 0) {
          setSelectedCompanyId(data.companies[0].id);
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router, companyParam]);

  const generatePreview = useCallback(async () => {
    if (!selectedCompanyId) return;
    setGenerating(true);
    try {
      const [companyData, submissionData, dirStats] = await Promise.all([
        api.getCompany(selectedCompanyId),
        api.getSubmissions(selectedCompanyId),
        api.getDirectoryStats(),
      ]);

      const data: DemoVideoProps = {
        companyName: companyData.company.name,
        tagline: companyData.company.tagline,
        descriptionShort: companyData.company.description_short,
        descriptionLong: companyData.company.description_long,
        logoUrl: await resolveLogoUrl(companyData.company.logo_url, companyData.company.website),
        website: companyData.company.website,
        categories: (companyData.company.categories as string[]) || [],
        pricingModel: companyData.company.pricing_model,
        foundedYear: companyData.company.founded_year,
        socialLinks: (companyData.company.social_links as Record<string, string>) || {},
        screenshots: companyData.screenshots.length > 0
          ? companyData.screenshots.map((s: Screenshot) => ({
              type: s.type,
              file_url: s.file_url,
            }))
          : [
              { type: 'homepage', file_url: '/screenshots/homepage.png' },
              { type: 'features', file_url: '/screenshots/features.png' },
              { type: 'pricing', file_url: '/screenshots/pricing.png' },
            ],
        submissionStats: submissionData.statusCounts,
        totalDirectories: dirStats.total,
      };

      setVideoData(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setGenerating(false);
    }
  }, [selectedCompanyId]);

  const handleRenderVideo = async () => {
    if (!videoData || !playerRef.current) return;
    setRenderingVideo(true);
    setRenderProgress(0);
    setRenderPhase('preparing');
    setExportedVideoUrl(null);

    try {
      const blobUrl = await exportVideoToMp4(
        playerRef.current,
        TOTAL_DURATION_FRAMES,
        videoData.companyName,
        (progress) => {
          setRenderProgress(progress.percent);
          setRenderPhase(progress.phase);
          if (progress.phase === 'done') {
            setRenderingVideo(false);
          }
        },
      );
      setExportedVideoUrl(blobUrl);
    } catch (err) {
      console.error('[Download] Export failed:', err);
      alert(err instanceof Error ? err.message : 'Failed to export video');
      setRenderingVideo(false);
    }
  };

  const handleDownloadFile = () => {
    if (!exportedVideoUrl || !videoData) return;
    downloadFromBlobUrl(exportedVideoUrl, `${videoData.companyName.replace(/\s+/g, '-').toLowerCase()}-demo.mp4`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted-foreground)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Demo Video Creator
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Generate professional 3D animated demo videos for your startup
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm px-4 py-2 rounded-lg"
          style={{ color: 'var(--primary)', border: '1px solid var(--border)' }}
        >
          Back to Dashboard
        </button>
      </div>

      <div
        className="p-6 rounded-xl border mb-6"
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
          Select Company
        </h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-2" style={{ color: 'var(--muted-foreground)' }}>
              Company
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value);
                setVideoData(null);
                setExportedVideoUrl(null);
              }}
              className="w-full px-4 py-2.5 rounded-lg text-sm"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.website}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generatePreview}
            disabled={!selectedCompanyId || generating}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{
              background: generating ? '#666' : 'var(--primary)',
              opacity: !selectedCompanyId ? 0.5 : 1,
            }}
          >
            {generating ? 'Generating...' : 'Generate Preview'}
          </button>
        </div>
      </div>

      {videoData && (
        <>
          <div
            className="p-6 rounded-xl border mb-6"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                {exportedVideoUrl ? 'Exported Video' : 'Video Preview'}
              </h2>
              <div className="flex gap-3">
                {exportedVideoUrl && (
                  <button
                    onClick={handleDownloadFile}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: '#3b82f6' }}
                  >
                    Save to Disk
                  </button>
                )}
                <button
                  onClick={handleRenderVideo}
                  disabled={renderingVideo}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: renderingVideo ? '#666' : '#22c55e' }}
                >
                  {renderingVideo
                    ? `${renderPhase === 'capturing' ? 'Capturing' : renderPhase === 'encoding' ? 'Encoding' : 'Preparing'}... ${renderProgress}%`
                    : exportedVideoUrl ? 'Re-export MP4' : 'Export MP4'}
                </button>
              </div>
            </div>

            {/* After export: show custom dark-themed video player with no bright seek bar */}
            {exportedVideoUrl ? (
              <div className="flex justify-center">
                <div style={{ width: '100%', maxWidth: 960 }}>
                  <style>{`
                    .dark-video-player::-webkit-media-controls-panel {
                      background: rgba(5, 5, 16, 0.95) !important;
                    }
                    .dark-video-player::-webkit-media-controls-timeline {
                      background: rgba(255, 255, 255, 0.08) !important;
                      border-radius: 2px !important;
                      height: 3px !important;
                    }
                    .dark-video-player::-webkit-media-controls-current-time-display,
                    .dark-video-player::-webkit-media-controls-time-remaining-display {
                      color: rgba(255, 255, 255, 0.6) !important;
                    }
                    .dark-video-player::-webkit-media-controls-volume-slider {
                      background: rgba(255, 255, 255, 0.1) !important;
                    }
                    .dark-video-player::-webkit-media-controls-play-button,
                    .dark-video-player::-webkit-media-controls-mute-button,
                    .dark-video-player::-webkit-media-controls-fullscreen-button {
                      filter: brightness(0.7) !important;
                    }
                  `}</style>
                  <video
                    className="dark-video-player"
                    src={exportedVideoUrl}
                    controls
                    autoPlay
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      background: '#050510',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <DemoVideoPlayer ref={playerRef} data={videoData} />
              </div>
            )}
          </div>

          <div
            className="p-6 rounded-xl border"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
              Video Scenes
            </h2>
            <div className="grid grid-cols-5 gap-3">
              {['Intro', 'Features', 'Screenshots', 'Stats', 'Outro'].map((scene, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg text-center"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="text-2xl mb-2">
                    {['🎬', '⚡', '📸', '📊', '🎯'][i]}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    Scene {i + 1}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    {scene}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    8s
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm mt-4" style={{ color: 'var(--muted-foreground)' }}>
              Total duration: ~37 seconds • 1920x1080 • 30fps • Cinematic crossfade transitions
            </p>
          </div>
        </>
      )}

      {!videoData && !generating && (
        <div
          className="p-12 rounded-xl border text-center"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Create Your Demo Video
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--muted-foreground)' }}>
            Select a company above and click &ldquo;Generate Preview&rdquo; to create a cinematic
            demo video with 3D perspective, floating annotations, animated stats, and smooth transitions.
          </p>
          <div className="flex justify-center gap-6 mt-6">
            {[
              { icon: '🎬', label: 'Cinematic Intro' },
              { icon: '✨', label: '3D Perspective' },
              { icon: '📝', label: 'Smart Annotations' },
              { icon: '📊', label: 'Animated Stats' },
              { icon: '📥', label: 'MP4 Export' },
            ].map((feat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-1">{feat.icon}</div>
                <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {feat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DemoVideoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64" style={{ color: 'var(--muted-foreground)' }}>
          Loading...
        </div>
      }
    >
      <DemoVideoContent />
    </Suspense>
  );
}
