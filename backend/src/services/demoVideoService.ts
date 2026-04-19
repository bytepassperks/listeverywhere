import { chromium, Browser } from 'playwright';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { pool } from '../db/pool';
import { env } from '../config/env';

const execAsync = promisify(exec);

const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const FPS = 30;
const SCENE_DURATION = 5;
const TOTAL_SCENES = 5;
const TOTAL_FRAMES = FPS * SCENE_DURATION * TOTAL_SCENES;

interface CompanyData {
  name: string;
  tagline: string;
  description_short: string;
  description_long: string;
  logo_url: string;
  website: string;
  categories: string[];
  pricing_model: string;
  screenshots: { type: string; file_url: string }[];
  submission_stats: Record<string, number>;
  total_directories: number;
}

interface RenderJob {
  id: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
}

const renderJobs = new Map<string, RenderJob>();

export function getRenderJob(jobId: string): RenderJob | undefined {
  return renderJobs.get(jobId);
}

export async function getCompanyDataForVideo(companyId: string, userId: string): Promise<CompanyData> {
  const companyResult = await pool.query(
    'SELECT * FROM companies WHERE id = $1 AND user_id = $2',
    [companyId, userId]
  );

  if (companyResult.rows.length === 0) {
    throw new Error('Company not found');
  }

  const company = companyResult.rows[0];

  const screenshotResult = await pool.query(
    'SELECT type, file_url FROM screenshots WHERE company_id = $1',
    [companyId]
  );

  const submissionResult = await pool.query(
    `SELECT status, COUNT(*)::int as count FROM submissions WHERE company_id = $1 GROUP BY status`,
    [companyId]
  );

  const submissionStats: Record<string, number> = {};
  for (const row of submissionResult.rows) {
    submissionStats[row.status] = row.count;
  }

  const dirResult = await pool.query('SELECT COUNT(*)::int as total FROM directories WHERE active = true');

  return {
    name: company.name,
    tagline: company.tagline || '',
    description_short: company.description_short || '',
    description_long: company.description_long || '',
    logo_url: company.logo_url || '',
    website: company.website,
    categories: company.categories || [],
    pricing_model: company.pricing_model || '',
    screenshots: screenshotResult.rows,
    submission_stats: submissionStats,
    total_directories: dirResult.rows[0]?.total || 0,
  };
}

function generateSceneHTML(data: CompanyData, sceneIndex: number, frame: number): string {
  const progress = frame / (FPS * SCENE_DURATION);
  const floatY = Math.sin(frame * 0.05) * 8;
  const glowPulse = 0.5 + Math.sin(frame * 0.08) * 0.3;

  const baseStyle = `
    body {
      margin: 0; padding: 0;
      width: ${VIDEO_WIDTH}px; height: ${VIDEO_HEIGHT}px;
      font-family: system-ui, -apple-system, sans-serif;
      overflow: hidden;
      background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      perspective: 1200px;
    }
    .particle {
      position: absolute; border-radius: 50%;
    }
  `;

  if (sceneIndex === 0) {
    const logoScale = Math.min(1, progress * 3);
    const logoRotateY = progress * 360;
    const titleOpacity = Math.max(0, Math.min(1, (progress - 0.15) * 4));
    const tagOpacity = Math.max(0, Math.min(1, (progress - 0.3) * 4));
    const catOpacity = Math.max(0, Math.min(1, (progress - 0.4) * 3));

    const particles = Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * Math.PI * 2 + frame * 0.02;
      const radius = 200 + Math.sin(frame * 0.03 + i) * 50;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.4;
      const size = 3 + Math.sin(frame * 0.05 + i * 0.5) * 2;
      const op = 0.3 + Math.sin(frame * 0.04 + i) * 0.2;
      return `<div class="particle" style="left:calc(50% + ${x}px);top:calc(50% + ${y}px);width:${size}px;height:${size}px;background:rgba(99,102,241,${op});box-shadow:0 0 ${size * 3}px rgba(99,102,241,${op})"></div>`;
    }).join('');

    const categories = (data.categories || []).slice(0, 4).map((cat, i) =>
      `<div style="padding:8px 20px;border-radius:20px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);color:rgba(199,199,255,0.9);font-size:16px;transform:translateY(${Math.sin(frame * 0.04 + i * 0.8) * 4}px)">${cat}</div>`
    ).join('');

    return `<html><head><style>${baseStyle}</style></head><body>
      ${particles}
      <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,${glowPulse * 0.15}) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%)"></div>
      <div style="transform:scale(${logoScale}) rotateY(${logoRotateY}deg) translateY(${floatY}px);margin-bottom:40px;transform-style:preserve-3d">
        ${data.logo_url
          ? `<img src="${data.logo_url}" style="width:140px;height:140px;border-radius:28px;object-fit:cover;box-shadow:0 20px 60px rgba(99,102,241,0.4),0 0 40px rgba(99,102,241,${glowPulse * 0.3});border:3px solid rgba(99,102,241,0.3)" />`
          : `<div style="width:140px;height:140px;border-radius:28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:60px;font-weight:800;color:white;box-shadow:0 20px 60px rgba(99,102,241,0.4)">${data.name.charAt(0)}</div>`
        }
      </div>
      <div style="opacity:${titleOpacity};text-align:center">
        <h1 style="font-size:72px;font-weight:800;color:white;margin:0;letter-spacing:-2px;text-shadow:0 4px 30px rgba(99,102,241,0.5)">${data.name}</h1>
      </div>
      <div style="opacity:${tagOpacity};text-align:center;margin-top:16px">
        <p style="font-size:28px;color:rgba(199,199,255,0.9);margin:0;max-width:700px;line-height:1.4">${data.tagline || data.description_short}</p>
      </div>
      <div style="position:absolute;bottom:50px;display:flex;gap:12px;opacity:${catOpacity}">${categories}</div>
    </body></html>`;
  }

  if (sceneIndex === 1) {
    const features = [
      { icon: '🚀', title: 'Auto Submission', desc: 'Submit to directories automatically' },
      { icon: '⚡', title: 'AI Extraction', desc: 'Intelligent metadata extraction' },
      { icon: '🎯', title: 'Smart Categories', desc: 'Auto-mapped categories per directory' },
      { icon: '🔒', title: 'Screenshot Gen', desc: 'Automated homepage screenshots' },
      { icon: '📊', title: 'Bulk Processing', desc: 'Agency mode for multiple startups' },
      { icon: '🌐', title: 'Weekly Updates', desc: 'Auto-recrawl and update weekly' },
    ];

    const titleOpacity = Math.min(1, progress * 3);
    const cards = features.map((f, i) => {
      const cardProgress = Math.max(0, Math.min(1, (progress - 0.1 - i * 0.06) * 5));
      const cardScale = 0.7 + cardProgress * 0.3;
      const cardOpacity = cardProgress;
      const fy = Math.sin(frame * 0.04 + i * 1.2) * 5;
      const fr = Math.sin(frame * 0.03 + i * 0.8) * 1.5;
      const iconRot = Math.sin(frame * 0.06 + i) * 10;

      return `<div style="opacity:${cardOpacity};transform:scale(${cardScale}) translateY(${fy}px) rotate(${fr}deg);background:rgba(255,255,255,0.04);border:1px solid rgba(99,102,241,0.15);border-radius:20px;padding:30px;display:flex;flex-direction:column;gap:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
        <div style="font-size:36px;transform:rotate(${iconRot}deg)">${f.icon}</div>
        <h3 style="font-size:22px;font-weight:700;color:white;margin:0">${f.title}</h3>
        <p style="font-size:15px;color:rgba(199,199,255,0.7);margin:0;line-height:1.5">${f.desc}</p>
      </div>`;
    }).join('');

    return `<html><head><style>${baseStyle} body { padding: 60px; }</style></head><body>
      <div style="position:absolute;top:-200px;right:-200px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.08) 0%,transparent 70%)"></div>
      <h2 style="font-size:52px;font-weight:800;color:white;margin-bottom:60px;opacity:${titleOpacity};text-shadow:0 4px 30px rgba(99,102,241,0.3);letter-spacing:-1px">${data.name} on <span style="color:#818cf8">${data.total_directories}+ Directories</span></h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:1200px;width:100%">${cards}</div>
    </body></html>`;
  }

  if (sceneIndex === 2) {
    const titleOpacity = Math.min(1, progress * 3);
    const screenshots = data.screenshots.length > 0 ? data.screenshots : [
      { type: 'homepage', file_url: '' },
      { type: 'features', file_url: '' },
      { type: 'pricing', file_url: '' },
    ];
    const labels = ['Homepage', 'Features', 'Pricing'];
    const annotations = ['Auto-captured at 1920x1080', 'Key features highlighted', 'Pricing comparison ready'];
    const icons = ['🏠', '⚡', '💰'];

    const ssCards = screenshots.slice(0, 3).map((ss, i) => {
      const cardProgress = Math.max(0, Math.min(1, (progress - 0.1 - i * 0.08) * 4));
      const centerOffset = i - 1;
      const baseRotateY = centerOffset * -15;
      const fy = Math.sin(frame * 0.035 + i * 1.5) * 8;
      const annotationOpacity = Math.max(0, Math.min(1, (progress - 0.35 - i * 0.08) * 4));

      return `<div style="opacity:${cardProgress};transform:rotateY(${baseRotateY}deg) translateY(${fy}px);position:relative">
        <div style="width:440px;height:280px;border-radius:16px;overflow:hidden;border:2px solid rgba(99,102,241,0.2);box-shadow:0 20px 60px rgba(0,0,0,0.5);background:rgba(20,20,40,0.8)">
          <div style="height:32px;background:rgba(30,30,60,0.9);display:flex;align-items:center;padding:0 12px;gap:6px">
            <div style="width:10px;height:10px;border-radius:50%;background:#ef4444"></div>
            <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b"></div>
            <div style="width:10px;height:10px;border-radius:50%;background:#22c55e"></div>
            <div style="margin-left:12px;flex:1;height:18px;border-radius:9px;background:rgba(99,102,241,0.1);display:flex;align-items:center;justify-content:center;font-size:10px;color:rgba(199,199,255,0.5)">${data.website}</div>
          </div>
          ${ss.file_url
            ? `<img src="${ss.file_url}" style="width:100%;height:calc(100% - 32px);object-fit:cover" />`
            : `<div style="width:100%;height:calc(100% - 32px);display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05))"><span style="font-size:48px;opacity:0.3">${icons[i]}</span></div>`
          }
        </div>
        <div style="text-align:center;margin-top:16px;font-size:18px;font-weight:600;color:white">${labels[i]}</div>
        <div style="position:absolute;top:-20px;right:-20px;opacity:${annotationOpacity};background:rgba(99,102,241,0.9);color:white;padding:6px 14px;border-radius:12px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 4px 20px rgba(99,102,241,0.4)">${annotations[i]}</div>
      </div>`;
    }).join('');

    return `<html><head><style>${baseStyle} body { perspective: 2000px; }</style></head><body>
      <h2 style="font-size:48px;font-weight:800;color:white;margin-bottom:50px;opacity:${titleOpacity};letter-spacing:-1px">Automated Screenshots</h2>
      <div style="display:flex;gap:40px;align-items:center;justify-content:center;transform-style:preserve-3d">${ssCards}</div>
    </body></html>`;
  }

  if (sceneIndex === 3) {
    const titleOpacity = Math.min(1, progress * 3);
    const stats = [
      { label: 'Directories', value: data.total_directories, suffix: '+', color: '#6366f1', icon: '📁' },
      { label: 'Auto Submitted', value: data.submission_stats['auto_submitted'] || 0, suffix: '', color: '#22c55e', icon: '🚀' },
      { label: 'Manual Ready', value: data.submission_stats['manual_ready'] || 0, suffix: '', color: '#3b82f6', icon: '📋' },
      { label: 'Email Ready', value: data.submission_stats['email_ready'] || 0, suffix: '', color: '#8b5cf6', icon: '📧' },
    ];

    const statCards = stats.map((s, i) => {
      const cp = Math.max(0, Math.min(1, (progress - 0.07 - i * 0.07) * 4));
      const countProgress = Math.max(0, Math.min(1, (progress - 0.15 - i * 0.07) * 3));
      const displayValue = Math.round(s.value * countProgress);
      const fy = Math.sin(frame * 0.04 + i * 1.5) * 5;

      return `<div style="opacity:${cp};transform:scale(${0.5 + cp * 0.5}) translateY(${fy}px);background:rgba(255,255,255,0.04);border:1px solid ${s.color}33;border-radius:20px;padding:28px 36px;text-align:center;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
        <div style="font-size:32px;margin-bottom:8px">${s.icon}</div>
        <div style="font-size:44px;font-weight:800;color:${s.color};line-height:1">${displayValue}${s.suffix}</div>
        <div style="font-size:14px;color:rgba(199,199,255,0.6);margin-top:8px">${s.label}</div>
      </div>`;
    }).join('');

    const barData = [
      { label: 'Queued', value: data.submission_stats['queued'] || 0, color: '#f59e0b' },
      { label: 'Submitted', value: data.submission_stats['auto_submitted'] || 0, color: '#22c55e' },
      { label: 'Manual', value: data.submission_stats['manual_ready'] || 0, color: '#3b82f6' },
      { label: 'Email', value: data.submission_stats['email_ready'] || 0, color: '#8b5cf6' },
      { label: 'Approved', value: data.submission_stats['approved'] || 0, color: '#06b6d4' },
      { label: 'Retrying', value: data.submission_stats['retrying'] || 0, color: '#ef4444' },
    ];
    const maxVal = Math.max(...barData.map(b => b.value), 1);

    const bars = barData.map((b, i) => {
      const bp = Math.max(0, Math.min(1, (progress - 0.3 - i * 0.04) * 3));
      const barWidth = (b.value / maxVal) * 100 * bp;
      return `<div style="display:flex;align-items:center;gap:16px;opacity:${bp}">
        <div style="width:100px;font-size:14px;color:rgba(199,199,255,0.7);text-align:right">${b.label}</div>
        <div style="flex:1;height:28px;background:rgba(255,255,255,0.03);border-radius:14px;overflow:hidden">
          <div style="width:${barWidth}%;height:100%;background:linear-gradient(90deg,${b.color},${b.color}cc);border-radius:14px;box-shadow:0 0 20px ${b.color}44"></div>
        </div>
        <div style="width:40px;font-size:16px;font-weight:700;color:${b.color}">${Math.round(b.value * bp)}</div>
      </div>`;
    }).join('');

    return `<html><head><style>${baseStyle} body { padding: 60px; }</style></head><body>
      <h2 style="font-size:48px;font-weight:800;color:white;margin-bottom:50px;opacity:${titleOpacity};letter-spacing:-1px">Submission Dashboard</h2>
      <div style="display:flex;gap:30px;margin-bottom:50px">${statCards}</div>
      <div style="width:100%;max-width:900px;display:flex;flex-direction:column;gap:16px">${bars}</div>
    </body></html>`;
  }

  // Scene 4: Outro
  const logoScale = Math.min(1, progress * 3);
  const titleOpacity = Math.max(0, Math.min(1, (progress - 0.1) * 4));
  const ctaOpacity = Math.max(0, Math.min(1, (progress - 0.3) * 3));

  const rings = Array.from({ length: 3 }, (_, i) => {
    const rp = ((frame * 0.01 + i * 0.33) % 1);
    const scale = 0.5 + rp * 2;
    const opacity = (1 - rp) * 0.15;
    return `<div style="position:absolute;top:50%;left:50%;width:200px;height:200px;border-radius:50%;border:2px solid rgba(99,102,241,${opacity});transform:translate(-50%,-50%) scale(${scale})"></div>`;
  }).join('');

  const particles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2 + frame * 0.015;
    const radius = 250 + Math.sin(frame * 0.02 + i * 0.5) * 80;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.5;
    const size = 2 + Math.sin(frame * 0.04 + i) * 1.5;
    const op = 0.2 + Math.sin(frame * 0.03 + i * 0.7) * 0.15;
    return `<div class="particle" style="left:calc(50% + ${x}px);top:calc(50% + ${y}px);width:${size}px;height:${size}px;background:rgba(139,92,246,${op});box-shadow:0 0 ${size * 4}px rgba(139,92,246,${op})"></div>`;
  }).join('');

  return `<html><head><style>${baseStyle}</style></head><body>
    ${particles}
    ${rings}
    <div style="transform:scale(${logoScale}) translateY(${floatY}px);margin-bottom:30px">
      ${data.logo_url
        ? `<img src="${data.logo_url}" style="width:100px;height:100px;border-radius:22px;object-fit:cover;box-shadow:0 16px 50px rgba(99,102,241,0.4);border:2px solid rgba(99,102,241,0.3)" />`
        : `<div style="width:100px;height:100px;border-radius:22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:800;color:white;box-shadow:0 16px 50px rgba(99,102,241,0.4)">${data.name.charAt(0)}</div>`
      }
    </div>
    <div style="opacity:${titleOpacity};text-align:center">
      <h1 style="font-size:56px;font-weight:800;color:white;margin:0;letter-spacing:-2px">${data.name}</h1>
      <p style="font-size:22px;color:rgba(199,199,255,0.7);margin-top:12px">Listed on ${data.total_directories}+ startup directories</p>
    </div>
    <div style="margin-top:40px;opacity:${ctaOpacity}">
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:18px 48px;border-radius:16px;font-size:22px;font-weight:700;color:white;box-shadow:0 8px 30px rgba(99,102,241,0.4)">${data.website}</div>
    </div>
    <div style="position:absolute;bottom:40px;font-size:14px;color:rgba(199,199,255,0.4)">Powered by ListEverywhere</div>
  </body></html>`;
}

export async function renderDemoVideo(companyId: string, userId: string): Promise<string> {
  const jobId = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  renderJobs.set(jobId, { id: jobId, status: 'queued', progress: 0 });

  (async () => {
    let browser: Browser | null = null;
    try {
      renderJobs.set(jobId, { id: jobId, status: 'rendering', progress: 0 });

      const data = await getCompanyDataForVideo(companyId, userId);

      const outputDir = path.join(env.SCREENSHOTS_DIR, 'videos');
      const framesDir = path.join(outputDir, `frames_${jobId}`);
      fs.mkdirSync(framesDir, { recursive: true });

      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setViewportSize({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });

      const framesPerScene = FPS * SCENE_DURATION;
      const sampleRate = 3;
      const totalSampleFrames = Math.ceil(TOTAL_FRAMES / sampleRate);
      let frameIndex = 0;

      for (let f = 0; f < TOTAL_FRAMES; f += sampleRate) {
        const sceneIndex = Math.min(Math.floor(f / framesPerScene), TOTAL_SCENES - 1);
        const sceneFrame = f % framesPerScene;

        const html = generateSceneHTML(data, sceneIndex, sceneFrame);
        await page.setContent(html, { waitUntil: 'networkidle' });
        await page.waitForTimeout(50);

        const paddedFrame = String(frameIndex).padStart(6, '0');
        await page.screenshot({
          path: path.join(framesDir, `frame_${paddedFrame}.png`),
          type: 'png',
        });

        frameIndex++;
        const progress = Math.round((frameIndex / totalSampleFrames) * 90);
        renderJobs.set(jobId, { id: jobId, status: 'rendering', progress });
      }

      await browser.close();
      browser = null;

      const outputFile = path.join(outputDir, `demo_${jobId}.mp4`);

      try {
        await execAsync(
          `ffmpeg -framerate ${FPS / sampleRate} -i "${framesDir}/frame_%06d.png" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -y "${outputFile}"`,
          { timeout: 120000 }
        );
      } catch {
        await execAsync(
          `ffmpeg -framerate ${FPS / sampleRate} -i "${framesDir}/frame_%06d.png" -c:v libx264 -pix_fmt yuv420p -y "${outputFile}"`,
          { timeout: 120000 }
        );
      }

      fs.rmSync(framesDir, { recursive: true, force: true });

      const downloadUrl = `/videos/demo_${jobId}.mp4`;

      renderJobs.set(jobId, {
        id: jobId,
        status: 'completed',
        progress: 100,
        downloadUrl,
      });
    } catch (err) {
      console.error('Video render error:', err);
      if (browser) await browser.close().catch(() => {});
      renderJobs.set(jobId, {
        id: jobId,
        status: 'failed',
        progress: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  })();

  return jobId;
}
