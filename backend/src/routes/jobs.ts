import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/pool';

interface JobRow {
  id: string;
  job_type: string;
  status: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function jobRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  app.get<{ Params: { id: string } }>('/api/jobs/:id', async (request, reply) => {
    const job = await queryOne<JobRow>(
      'SELECT * FROM jobs WHERE id = $1',
      [request.params.id]
    );

    if (!job) {
      return reply.status(404).send({ error: 'Job not found' });
    }

    return reply.send({ job });
  });

  app.get('/api/jobs', async (request, reply) => {
    const userId = request.userId!;
    const jobs = await query<JobRow>(
      `SELECT * FROM jobs WHERE payload->>'user_id' = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return reply.send({ jobs });
  });
}
