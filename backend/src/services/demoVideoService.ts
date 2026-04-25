import { pool } from '../db/pool';

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

export async function renderDemoVideo(companyId: string, userId: string): Promise<string> {
  const jobId = `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // Video rendering is handled by the Remotion player on the frontend.
  // This endpoint returns immediately with a completed status pointing users to the frontend player.
  renderJobs.set(jobId, {
    id: jobId,
    status: 'completed',
    progress: 100,
    error: 'Video rendering is available via the frontend player. Use the Demo Video page to preview and play videos.',
  });

  return jobId;
}
