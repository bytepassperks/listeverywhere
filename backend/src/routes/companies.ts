import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/pool';
import { crawlCompanySite, buildCrawlMarkdown, extractMetaFromPages } from '../services/firecrawlService';
import { extractCompanyProfile } from '../services/companyExtractor';
import { generateScreenshots, getScreenshots } from '../services/screenshotService';
import { generateAllPayloads } from '../services/payloadGenerator';
import { enqueueSubmission } from '../workers/index';

interface CreateCompanyBody {
  website: string;
  support_email: string;
}

interface CompanyRow {
  id: string;
  user_id: string;
  name: string;
  website: string;
  support_email: string;
  tagline: string;
  description_short: string;
  description_long: string;
  logo_url: string;
  categories: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  founded_year: number | null;
  created_at: string;
  updated_at: string;
}

interface DirectoryRow {
  id: string;
  name: string;
  submission_type: string;
  api_endpoint: string | null;
  submit_url: string;
}

interface SubmissionRow {
  id: string;
}

async function processCrawlPipeline(
  normalizedUrl: string,
  support_email: string,
  userId: string,
  jobId: string
): Promise<void> {
  try {
    console.log(`[PIPELINE] Starting crawl for ${normalizedUrl}`);
    const crawlResult = await crawlCompanySite(normalizedUrl);
    console.log(`[PIPELINE] Crawl result: success=${crawlResult.success}, pages=${crawlResult.data.length}`);

    if (!crawlResult.success || crawlResult.data.length === 0) {
      console.error(`[PIPELINE] Crawl failed: ${crawlResult.error}`);
      await query(
        `UPDATE jobs SET status = 'failed', error = $1, completed_at = NOW() WHERE id = $2`,
        [crawlResult.error || 'No pages crawled', jobId]
      );
      return;
    }

    console.log(`[PIPELINE] Building markdown from ${crawlResult.data.length} pages`);
    const markdown = buildCrawlMarkdown(crawlResult.data);
    const meta = extractMetaFromPages(crawlResult.data);

    console.log('[PIPELINE] Extracting company profile with AI...');
    const profile = await extractCompanyProfile(markdown);
    console.log(`[PIPELINE] Extracted: ${profile.company_name}`);

    const company = await queryOne<CompanyRow>(
      `INSERT INTO companies (
         user_id, name, website, support_email, tagline,
         description_short, description_long, logo_url,
         categories, social_links, pricing_model, founded_year, raw_crawl_data
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        userId,
        profile.company_name,
        normalizedUrl,
        support_email,
        profile.tagline,
        profile.short_description,
        profile.long_description,
        profile.logo_url || meta.ogImage || '',
        JSON.stringify(profile.categories),
        JSON.stringify(profile.social_links),
        profile.pricing_model,
        profile.founded_year,
        markdown,
      ]
    );

    if (!company) {
      throw new Error('Failed to insert company');
    }
    console.log(`[PIPELINE] Company created: ${company.id}`);

    console.log('[PIPELINE] Generating screenshots...');
    try {
      await generateScreenshots(company.id, normalizedUrl);
      console.log('[PIPELINE] Screenshots generated');
    } catch (ssErr) {
      console.error('[PIPELINE] Screenshot generation failed (continuing):', ssErr);
    }

    const directories = await query<DirectoryRow>(
      'SELECT id, name, submission_type, api_endpoint, submit_url FROM directories WHERE active = true'
    );
    console.log(`[PIPELINE] Found ${directories.length} active directories`);

    let queued = 0;
    for (const dir of directories) {
      const submission = await queryOne<SubmissionRow>(
        `INSERT INTO submissions (company_id, directory_id, status)
         VALUES ($1, $2, 'queued')
         ON CONFLICT (company_id, directory_id) DO NOTHING
         RETURNING id`,
        [company.id, dir.id]
      );

      if (submission) {
        await enqueueSubmission(dir.submission_type, {
          submissionId: submission.id,
          companyId: company.id,
          directoryId: dir.id,
          apiEndpoint: dir.api_endpoint || undefined,
          submitUrl: dir.submit_url,
        });
        queued++;
      }
    }

    console.log(`[PIPELINE] Queued ${queued} submissions`);

    await query(
      `UPDATE jobs SET status = 'completed', result = $1, completed_at = NOW() WHERE id = $2`,
      [JSON.stringify({ company_id: company.id, directories_queued: queued }), jobId]
    );
    console.log(`[PIPELINE] Job ${jobId} completed successfully`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[PIPELINE] Error: ${errorMsg}`);
    await query(
      `UPDATE jobs SET status = 'failed', error = $1, completed_at = NOW() WHERE id = $2`,
      [errorMsg, jobId]
    );
  }
}

export async function companyRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  app.post<{ Body: CreateCompanyBody }>('/api/companies', async (request, reply) => {
    const { website, support_email } = request.body;
    const userId = request.userId!;

    if (!website) {
      return reply.status(400).send({ error: 'Website URL is required' });
    }

    const normalizedUrl = website.startsWith('http') ? website : `https://${website}`;

    const jobRow = await queryOne<{ id: string }>(
      `INSERT INTO jobs (job_type, status, payload) VALUES ('company_crawl', 'running', $1) RETURNING id`,
      [JSON.stringify({ website: normalizedUrl, support_email, user_id: userId })]
    );

    const jobId = jobRow?.id;

    // Run pipeline in background - do NOT await, just fire and forget
    processCrawlPipeline(normalizedUrl, support_email, userId, jobId!).catch((err) => {
      console.error('[PIPELINE] Unhandled error:', err);
    });

    return reply.status(202).send({
      message: 'Company crawl started',
      job_id: jobId,
    });
  });

  app.get('/api/companies', async (request, reply) => {
    const userId = request.userId!;
    const companies = await query<CompanyRow>(
      'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return reply.send({ companies });
  });

  app.get<{ Params: { id: string } }>('/api/companies/:id', async (request, reply) => {
    const userId = request.userId!;
    const company = await queryOne<CompanyRow>(
      'SELECT * FROM companies WHERE id = $1 AND user_id = $2',
      [request.params.id, userId]
    );

    if (!company) {
      return reply.status(404).send({ error: 'Company not found' });
    }

    const screenshots = await getScreenshots(company.id);

    return reply.send({ company, screenshots });
  });

  app.get<{ Params: { id: string } }>('/api/companies/:id/payloads', async (request, reply) => {
    const userId = request.userId!;
    const company = await queryOne<CompanyRow>(
      'SELECT id FROM companies WHERE id = $1 AND user_id = $2',
      [request.params.id, userId]
    );

    if (!company) {
      return reply.status(404).send({ error: 'Company not found' });
    }

    const payloads = await generateAllPayloads(company.id);
    return reply.send({ payloads });
  });

  app.post<{ Params: { id: string }; Body: { screenshots: Array<{ type: string; file_url: string }> } }>(
    '/api/companies/:id/screenshots',
    async (request, reply) => {
      const userId = request.userId!;
      const company = await queryOne<CompanyRow>(
        'SELECT id FROM companies WHERE id = $1 AND user_id = $2',
        [request.params.id, userId]
      );

      if (!company) {
        return reply.status(404).send({ error: 'Company not found' });
      }

      const { screenshots } = request.body;
      if (!Array.isArray(screenshots) || screenshots.length === 0) {
        return reply.status(400).send({ error: 'screenshots array is required' });
      }

      for (const ss of screenshots) {
        // Delete existing screenshot of same type, then insert new one
        await query(
          `DELETE FROM screenshots WHERE company_id = $1 AND type = $2`,
          [company.id, ss.type]
        );
        await query(
          `INSERT INTO screenshots (company_id, type, file_url) VALUES ($1, $2, $3)`,
          [company.id, ss.type, ss.file_url]
        );
      }

      const updated = await getScreenshots(company.id);
      return reply.send({ screenshots: updated });
    }
  );

  app.post<{ Params: { id: string } }>('/api/companies/:id/resubmit', async (request, reply) => {
    const userId = request.userId!;
    const company = await queryOne<CompanyRow>(
      'SELECT id FROM companies WHERE id = $1 AND user_id = $2',
      [request.params.id, userId]
    );

    if (!company) {
      return reply.status(404).send({ error: 'Company not found' });
    }

    const failedSubmissions = await query<{ id: string; directory_id: string; submission_type: string; api_endpoint: string | null; submit_url: string }>(
      `SELECT s.id, s.directory_id, d.submission_type, d.api_endpoint, d.submit_url
       FROM submissions s
       JOIN directories d ON s.directory_id = d.id
       WHERE s.company_id = $1 AND s.status IN ('manual_required', 'rejected')`,
      [company.id]
    );

    for (const sub of failedSubmissions) {
      await query(
        `UPDATE submissions SET status = 'queued', attempt_count = 0, updated_at = NOW() WHERE id = $1`,
        [sub.id]
      );

      await enqueueSubmission(sub.submission_type, {
        submissionId: sub.id,
        companyId: company.id,
        directoryId: sub.directory_id,
        apiEndpoint: sub.api_endpoint || undefined,
        submitUrl: sub.submit_url,
      });
    }

    return reply.send({ message: `${failedSubmissions.length} submissions re-queued` });
  });
}
