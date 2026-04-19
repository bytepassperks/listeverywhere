import { query, queryOne } from '../db/pool';

export type SubmissionStatus =
  | 'queued'
  | 'auto_submitted'
  | 'manual_ready'
  | 'email_ready'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'retrying'
  | 'manual_required';

interface StatusCount {
  status: string;
  count: string;
}

interface SubmissionRecord {
  id: string;
  company_id: string;
  directory_id: string;
  status: string;
  payload: Record<string, unknown>;
  attempt_count: number;
  last_attempt_at: string | null;
  error_log: string | null;
  created_at: string;
  updated_at: string;
  directory_name?: string;
  submit_url?: string;
  submission_type?: string;
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: SubmissionStatus,
  errorLog?: string
): Promise<void> {
  await query(
    `UPDATE submissions
     SET status = $1, updated_at = NOW(), error_log = COALESCE($3, error_log)
     WHERE id = $2`,
    [status, submissionId, errorLog || null]
  );
}

export async function incrementAttempt(submissionId: string): Promise<number> {
  const result = await queryOne<{ attempt_count: number }>(
    `UPDATE submissions
     SET attempt_count = attempt_count + 1, last_attempt_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING attempt_count`,
    [submissionId]
  );
  return result?.attempt_count || 0;
}

export async function getSubmissionsByCompany(companyId: string): Promise<SubmissionRecord[]> {
  return query<SubmissionRecord>(
    `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type
     FROM submissions s
     JOIN directories d ON s.directory_id = d.id
     WHERE s.company_id = $1
     ORDER BY s.created_at DESC`,
    [companyId]
  );
}

export async function getSubmissionStatusCounts(companyId: string): Promise<Record<string, number>> {
  const rows = await query<StatusCount>(
    `SELECT status, COUNT(*)::text as count
     FROM submissions
     WHERE company_id = $1
     GROUP BY status`,
    [companyId]
  );

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.status] = parseInt(row.count, 10);
  }
  return counts;
}

export async function getSubmissionById(submissionId: string): Promise<SubmissionRecord | null> {
  return queryOne<SubmissionRecord>(
    `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type
     FROM submissions s
     JOIN directories d ON s.directory_id = d.id
     WHERE s.id = $1`,
    [submissionId]
  );
}

export async function getQueuedSubmissions(limit: number = 50): Promise<SubmissionRecord[]> {
  return query<SubmissionRecord>(
    `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type
     FROM submissions s
     JOIN directories d ON s.directory_id = d.id
     WHERE s.status IN ('queued', 'retrying')
     ORDER BY s.created_at ASC
     LIMIT $1`,
    [limit]
  );
}
