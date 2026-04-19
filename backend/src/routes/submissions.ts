import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/pool';
import { getSubmissionsByCompany, getSubmissionStatusCounts, updateSubmissionStatus } from '../services/statusTracker';
import { generateManualKit } from '../services/manualKitGenerator';
import { generateEmailKit } from '../services/emailKitGenerator';
import { generatePayload } from '../services/payloadGenerator';

interface SubmissionRow {
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

export async function submissionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  app.get<{ Params: { companyId: string } }>('/api/submissions/:companyId', async (request, reply) => {
    const userId = request.userId!;
    const { companyId } = request.params;

    const company = await queryOne<{ id: string }>(
      'SELECT id FROM companies WHERE id = $1 AND user_id = $2',
      [companyId, userId]
    );

    if (!company) {
      return reply.status(404).send({ error: 'Company not found' });
    }

    const submissions = await getSubmissionsByCompany(companyId);
    const statusCounts = await getSubmissionStatusCounts(companyId);

    return reply.send({ submissions, statusCounts });
  });

  app.patch<{
    Params: { id: string };
    Body: { status: string };
  }>('/api/submissions/:id/status', async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    const { status } = request.body;

    const validStatuses = ['submitted', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const submission = await queryOne<SubmissionRow>(
      `SELECT s.* FROM submissions s
       JOIN companies c ON s.company_id = c.id
       WHERE s.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    await updateSubmissionStatus(id, status as 'submitted' | 'approved' | 'rejected');

    return reply.send({ message: 'Status updated', submission_id: id, new_status: status });
  });

  app.get<{ Params: { id: string } }>('/api/submissions/:id/manual-kit', async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;

    const submission = await queryOne<SubmissionRow>(
      `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type
       FROM submissions s
       JOIN directories d ON s.directory_id = d.id
       JOIN companies c ON s.company_id = c.id
       WHERE s.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    if (submission.payload && Object.keys(submission.payload).length > 0 && 'instructions' in submission.payload) {
      return reply.send({ kit: submission.payload });
    }

    const payload = await generatePayload(submission.company_id, submission.directory_id);
    const kit = generateManualKit(payload);

    await query(
      `UPDATE submissions SET payload = $1, status = 'manual_ready', updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(kit), id]
    );

    return reply.send({ kit });
  });

  app.get<{ Params: { id: string } }>('/api/submissions/:id/email-kit', async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;

    const submission = await queryOne<SubmissionRow>(
      `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type, d.notes as directory_notes
       FROM submissions s
       JOIN directories d ON s.directory_id = d.id
       JOIN companies c ON s.company_id = c.id
       WHERE s.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    if (submission.payload && Object.keys(submission.payload).length > 0 && 'email_subject' in submission.payload) {
      return reply.send({ kit: submission.payload });
    }

    const payload = await generatePayload(submission.company_id, submission.directory_id);

    let directoryEmail: string | undefined;
    const notes = (submission as unknown as Record<string, unknown>).directory_notes as string | null;
    if (notes) {
      const emailMatch = notes.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      if (emailMatch) directoryEmail = emailMatch[0];
    }

    const kit = generateEmailKit(payload, directoryEmail);

    await query(
      `UPDATE submissions SET payload = $1, status = 'email_ready', updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(kit), id]
    );

    return reply.send({ kit });
  });
}
