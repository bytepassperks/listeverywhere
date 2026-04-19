import { Job } from 'bullmq';
import { updateSubmissionStatus } from '../services/statusTracker';
import { generatePayload } from '../services/payloadGenerator';
import { generateManualKit } from '../services/manualKitGenerator';
import { query } from '../db/pool';

interface ManualKitJobData {
  submissionId: string;
  companyId: string;
  directoryId: string;
}

export async function processManualKit(job: Job<ManualKitJobData>): Promise<void> {
  const { submissionId, companyId, directoryId } = job.data;

  try {
    const payload = await generatePayload(companyId, directoryId);
    const kit = generateManualKit(payload);

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
