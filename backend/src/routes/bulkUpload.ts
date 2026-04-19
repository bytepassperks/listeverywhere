import { FastifyInstance } from 'fastify';
import { parse } from 'csv-parse/sync';
import { queryOne, query } from '../db/pool';
import { crawlCompanySite, buildCrawlMarkdown } from '../services/firecrawlService';
import { extractCompanyProfile } from '../services/companyExtractor';
import { generateScreenshots } from '../services/screenshotService';
import { enqueueSubmission } from '../workers/index';

interface BulkRow {
  website: string;
  support_email: string;
}

interface CompanyRow {
  id: string;
}

interface DirectoryRow {
  id: string;
  submission_type: string;
  api_endpoint: string | null;
  submit_url: string;
}

interface SubmissionRow {
  id: string;
}

export async function bulkUploadRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  app.post('/api/bulk/upload', async (request, reply) => {
    const userId = request.userId!;

    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const csvContent = buffer.toString('utf-8');

    let records: BulkRow[];
    try {
      records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as BulkRow[];
    } catch {
      return reply.status(400).send({ error: 'Invalid CSV format. Required columns: website, support_email' });
    }

    if (records.length === 0) {
      return reply.status(400).send({ error: 'CSV file is empty' });
    }

    const invalidRows = records.filter((r, i) => {
      if (!r.website) return true;
      return false;
    });

    if (invalidRows.length > 0) {
      return reply.status(400).send({ error: `${invalidRows.length} rows missing required 'website' column` });
    }

    const jobRow = await queryOne<{ id: string }>(
      `INSERT INTO jobs (job_type, status, payload) VALUES ('bulk_upload', 'running', $1) RETURNING id`,
      [JSON.stringify({ count: records.length, user_id: userId })]
    );

    reply.status(202).send({
      message: `Bulk processing started for ${records.length} companies`,
      job_id: jobRow?.id,
      total: records.length,
    });

    let processed = 0;
    let failed = 0;

    for (const record of records) {
      try {
        const normalizedUrl = record.website.startsWith('http') ? record.website : `https://${record.website}`;

        const existing = await queryOne<CompanyRow>(
          'SELECT id FROM companies WHERE website = $1 AND user_id = $2',
          [normalizedUrl, userId]
        );

        if (existing) {
          processed++;
          continue;
        }

        const crawlResult = await crawlCompanySite(normalizedUrl);
        if (!crawlResult.success || crawlResult.data.length === 0) {
          failed++;
          continue;
        }

        const markdown = buildCrawlMarkdown(crawlResult.data);
        const profile = await extractCompanyProfile(markdown);

        const company = await queryOne<CompanyRow>(
          `INSERT INTO companies (
             user_id, name, website, support_email, tagline,
             description_short, description_long, logo_url,
             categories, social_links, pricing_model, founded_year, raw_crawl_data
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           RETURNING id`,
          [
            userId,
            profile.company_name,
            normalizedUrl,
            record.support_email || '',
            profile.tagline,
            profile.short_description,
            profile.long_description,
            profile.logo_url,
            JSON.stringify(profile.categories),
            JSON.stringify(profile.social_links),
            profile.pricing_model,
            profile.founded_year,
            markdown,
          ]
        );

        if (company) {
          await generateScreenshots(company.id, normalizedUrl).catch(() => {});

          const directories = await query<DirectoryRow>(
            'SELECT id, submission_type, api_endpoint, submit_url FROM directories WHERE active = true'
          );

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
            }
          }
        }

        processed++;

        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch {
        failed++;
      }
    }

    await query(
      `UPDATE jobs SET status = 'completed', result = $1, completed_at = NOW() WHERE id = $2`,
      [JSON.stringify({ processed, failed, total: records.length }), jobRow?.id]
    );
  });

  app.get('/api/bulk/jobs', async (request, reply) => {
    const userId = request.userId!;
    const jobs = await query<{ id: string; status: string; payload: Record<string, unknown>; result: Record<string, unknown>; created_at: string; completed_at: string | null }>(
      `SELECT * FROM jobs WHERE job_type = 'bulk_upload' AND payload->>'user_id' = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    return reply.send({ jobs });
  });
}
