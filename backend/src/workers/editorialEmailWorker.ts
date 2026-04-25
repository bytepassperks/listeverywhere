import { Job } from 'bullmq';
import { updateSubmissionStatus } from '../services/statusTracker';
import { generatePayload } from '../services/payloadGenerator';
import { generateEmailKit } from '../services/emailKitGenerator';
import { query, queryOne } from '../db/pool';

interface EditorialEmailJobData {
  submissionId: string;
  companyId: string;
  directoryId: string;
}

export async function processEditorialEmail(job: Job<EditorialEmailJobData>): Promise<void> {
  const { submissionId, companyId, directoryId } = job.data;

  try {
    const payload = await generatePayload(companyId, directoryId);

    const directory = await queryOne<{ notes: string | null }>(
      'SELECT notes FROM directories WHERE id = $1',
      [directoryId]
    );

    let directoryEmail: string | undefined;
    if (directory?.notes) {
      const emailMatch = directory.notes.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      if (emailMatch) {
        directoryEmail = emailMatch[0];
      }
    }

    const emailKit = generateEmailKit(payload, directoryEmail);

    await query(
      `UPDATE submissions
       SET status = 'email_ready',
           payload = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(emailKit), submissionId]
    );

    console.log(`Email kit generated for ${payload.directory_name} (submission: ${submissionId})`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Email kit generation failed for ${submissionId}:`, errorMsg);
    await updateSubmissionStatus(submissionId, 'manual_required', errorMsg);
  }
}
