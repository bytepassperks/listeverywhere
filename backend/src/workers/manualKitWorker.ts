import { Job } from 'bullmq';
import { updateSubmissionStatus } from '../services/statusTracker';
import { generatePayload } from '../services/payloadGenerator';
import { generateManualKit } from '../services/manualKitGenerator';
import { query, queryOne } from '../db/pool';

interface ManualKitJobData {
  submissionId: string;
  companyId: string;
  directoryId: string;
}

export async function processManualKit(job: Job<ManualKitJobData>): Promise<void> {
  const { submissionId, companyId, directoryId } = job.data;

  try {
    const payload = await generatePayload(companyId, directoryId);

    const dir = await queryOne<{
      title_limit: number | null;
      desc_limit: number | null;
      requires_logo: boolean;
      requires_screenshot: boolean;
      requires_category: boolean;
    }>('SELECT title_limit, desc_limit, requires_logo, requires_screenshot, requires_category FROM directories WHERE id = $1', [directoryId]);

    const requirements = {
      title_limit: dir?.title_limit ?? null,
      desc_limit: dir?.desc_limit ?? null,
      requires_logo: dir?.requires_logo ?? false,
      requires_screenshot: dir?.requires_screenshot ?? false,
      requires_category: dir?.requires_category ?? false,
    };

    const apiBaseUrl = process.env.API_BASE_URL || 'https://listeverywhere-api.onrender.com';
    const kit = generateManualKit(payload, requirements, apiBaseUrl);

    await query(
      `UPDATE submissions
       SET status = 'manual_ready',
           payload = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(kit), submissionId]
    );

    console.log(`Manual kit generated for ${payload.directory_name} (submission: ${submissionId})`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Manual kit generation failed for ${submissionId}:`, errorMsg);
    await updateSubmissionStatus(submissionId, 'manual_required', errorMsg);
  }
}
