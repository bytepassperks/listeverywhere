'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, Company, Screenshot } from '@/lib/api';
import { DemoVideoPlayer } from '@/components/video/DemoVideoPlayer';
import { DemoVideoProps } from '@/components/video/types';

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
        logoUrl: companyData.company.logo_url || (() => {
          try {
            return `https://logo.clearbit.com/${new URL(companyData.company.website).hostname}`;
          } catch { return ''; }
        })(),
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
    if (!videoData) return;
    setRenderingVideo(true);
    setRenderProgress(0);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/demo-video/render`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${api.getToken()}`,
          },
          body: JSON.stringify({ companyId: selectedCompanyId }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Render failed' }));
        throw new Error((err as { error: string }).error || 'Render failed');
      }

      const result = await response.json() as { jobId: string };

      const pollInterval = setInterval(async () => {
        try {
          const statusResp = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/demo-video/status/${result.jobId}`,
            {
              headers: { Authorization: `Bearer ${api.getToken()}` },
            }
          );
          const status = await statusResp.json() as { status: string; progress: number; downloadUrl?: string };

          if (status.status === 'completed' && status.downloadUrl) {
            clearInterval(pollInterval);
            setRenderingVideo(false);
            setRenderProgress(100);
            window.open(status.downloadUrl, '_blank');
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setRenderingVideo(false);
            alert('Video rendering failed. Please try again.');
          } else {
            setRenderProgress(status.progress || 0);
          }
        } catch {
          clearInterval(pollInterval);
          setRenderingVideo(false);
        }
      }, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start rendering');
      setRenderingVideo(false);
    }
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
                Video Preview
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={handleRenderVideo}
                  disabled={renderingVideo}
                  className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: renderingVideo ? '#666' : '#22c55e' }}
                >
                  {renderingVideo
                    ? `Rendering... ${renderProgress}%`
                    : 'Download MP4'}
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <DemoVideoPlayer data={videoData} />
            </div>
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
