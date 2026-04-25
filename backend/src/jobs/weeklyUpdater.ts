import cron from 'node-cron';
import { query, queryOne } from '../db/pool';
import { crawlCompanySite, buildCrawlMarkdown } from '../services/firecrawlService';
import { extractCompanyProfile } from '../services/companyExtractor';
import { generateScreenshots } from '../services/screenshotService';
import { enqueueSubmission } from '../workers/index';

interface CompanyRow {
  id: string;
  name: string;
  website: string;
  description_short: string | null;
  raw_crawl_data: string | null;
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

async function updateCompany(company: CompanyRow): Promise<boolean> {
  console.log(`[WeeklyUpdater] Recrawling ${company.name} (${company.website})...`);

  try {
    const crawlResult = await crawlCompanySite(company.website);
    if (!crawlResult.success || crawlResult.data.length === 0) {
      console.warn(`[WeeklyUpdater] Crawl failed for ${company.name}: ${crawlResult.error}`);
      return false;
    }

    const newMarkdown = buildCrawlMarkdown(crawlResult.data);
    const newProfile = await extractCompanyProfile(newMarkdown);

    const hasChanges =
      newProfile.short_description !== company.description_short ||
      newProfile.company_name !== company.name;

    if (!hasChanges) {
      console.log(`[WeeklyUpdater] No changes detected for ${company.name}`);
      return false;
    }

    console.log(`[WeeklyUpdater] Changes detected for ${company.name}, updating...`);

    await query(
      `UPDATE companies SET
         name = $1,
         tagline = $2,
         description_short = $3,
         description_long = $4,
         logo_url = COALESCE(NULLIF($5, ''), logo_url),
         categories = $6,
         social_links = $7,
         pricing_model = $8,
         founded_year = $9,
         raw_crawl_data = $10,
         updated_at = NOW()
       WHERE id = $11`,
      [
        newProfile.company_name,
        newProfile.tagline,
        newProfile.short_description,
        newProfile.long_description,
        newProfile.logo_url,
        JSON.stringify(newProfile.categories),
        JSON.stringify(newProfile.social_links),
        newProfile.pricing_model,
        newProfile.founded_year,
        newMarkdown,
        company.id,
      ]
    );

    await generateScreenshots(company.id, company.website);

    const directories = await query<DirectoryRow>(
      `SELECT d.id, d.submission_type, d.api_endpoint, d.submit_url
       FROM directories d
       JOIN submissions s ON s.directory_id = d.id
       WHERE s.company_id = $1
         AND s.status IN ('auto_submitted', 'approved')
         AND d.active = true`,
      [company.id]
    );

    for (const dir of directories) {
      const existing = await queryOne<SubmissionRow>(
        `SELECT id FROM submissions WHERE company_id = $1 AND directory_id = $2`,
        [company.id, dir.id]
      );

      if (existing) {
        await query(
          `UPDATE submissions SET status = 'queued', attempt_count = 0, updated_at = NOW() WHERE id = $1`,
          [existing.id]
        );

        await enqueueSubmission(dir.submission_type, {
          submissionId: existing.id,
          companyId: company.id,
          directoryId: dir.id,
          apiEndpoint: dir.api_endpoint || undefined,
          submitUrl: dir.submit_url,
        });
      }
    }

    console.log(`[WeeklyUpdater] ${company.name} updated and ${directories.length} resubmission jobs queued`);
    return true;
  } catch (error) {
    console.error(`[WeeklyUpdater] Error updating ${company.name}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

async function runWeeklyUpdate(): Promise<void> {
  console.log('[WeeklyUpdater] Starting weekly update cycle...');

  const companies = await query<CompanyRow>(
    `SELECT id, name, website, description_short, raw_crawl_data
     FROM companies
     ORDER BY updated_at ASC`
  );

  console.log(`[WeeklyUpdater] Found ${companies.length} companies to process`);

  let updated = 0;
  let failed = 0;

  for (const company of companies) {
    try {
      const wasUpdated = await updateCompany(company);
      if (wasUpdated) updated++;
    } catch {
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  console.log(`[WeeklyUpdater] Cycle complete: ${updated} updated, ${failed} failed, ${companies.length - updated - failed} unchanged`);
}

async function runDirectoryFreshnessCheck(): Promise<void> {
  console.log('[DirectoryChecker] Starting directory freshness check...');

  const directories = await query<{ id: string; name: string; submit_url: string }>(
    `SELECT id, name, submit_url FROM directories WHERE active = true ORDER BY created_at ASC LIMIT 500`
  );

  console.log(`[DirectoryChecker] Checking ${directories.length} directories...`);

  let deactivated = 0;

  for (const dir of directories) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(dir.submit_url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ListEverywhereBot/1.0)' },
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (response.status === 404 || response.status === 410) {
        await query('UPDATE directories SET active = false WHERE id = $1', [dir.id]);
        deactivated++;
        console.log(`[DirectoryChecker] Deactivated ${dir.name} (${response.status})`);
      }
    } catch {
      // Network errors, timeouts, CORS — don't deactivate (sites may block bots)
    }
  }

  console.log(`[DirectoryChecker] Complete. ${deactivated} directories deactivated.`);
}

// Companies update: every Monday at 3:00 AM UTC
cron.schedule('0 3 * * 1', async () => {
  console.log('[WeeklyUpdater] Scheduled weekly update triggered');
  await runWeeklyUpdate();
}, {
  timezone: 'UTC',
});

// Directory freshness check: every Sunday at 2:00 AM UTC
cron.schedule('0 2 * * 0', async () => {
  console.log('[DirectoryChecker] Scheduled directory freshness check triggered');
  await runDirectoryFreshnessCheck();
}, {
  timezone: 'UTC',
});

console.log('[WeeklyUpdater] Cron jobs scheduled: companies Monday 3AM UTC, directories Sunday 2AM UTC');

if (require.main === module) {
  console.log('[WeeklyUpdater] Running manual update...');
  runWeeklyUpdate()
    .then(() => {
      console.log('[WeeklyUpdater] Manual run complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[WeeklyUpdater] Manual run failed:', err);
      process.exit(1);
    });
}

export { runWeeklyUpdate, runDirectoryFreshnessCheck };
