import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/pool';

interface DirectoryRow {
  id: string;
  name: string;
  submit_url: string;
  submission_type: string;
  title_limit: number | null;
  desc_limit: number | null;
  requires_logo: boolean;
  requires_screenshot: boolean;
  requires_category: boolean;
  api_endpoint: string | null;
  category_taxonomy: string[];
  notes: string | null;
  active: boolean;
  created_at: string;
}

interface DirectoryCountRow extends DirectoryRow {
  submission_count: string;
}

export async function directoryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  app.get('/api/directories', async (_request, reply) => {
    const directories = await query<DirectoryRow>(
      'SELECT * FROM directories WHERE active = true ORDER BY name ASC'
    );
    return reply.send({ directories });
  });

  app.get<{ Params: { id: string } }>('/api/directories/:id', async (request, reply) => {
    const directory = await queryOne<DirectoryRow>(
      'SELECT * FROM directories WHERE id = $1',
      [request.params.id]
    );

    if (!directory) {
      return reply.status(404).send({ error: 'Directory not found' });
    }

    return reply.send({ directory });
  });

  app.get('/api/directories/stats', async (_request, reply) => {
    const stats = await query<DirectoryCountRow>(
      `SELECT d.*, COUNT(s.id)::text as submission_count
       FROM directories d
       LEFT JOIN submissions s ON d.id = s.directory_id
       WHERE d.active = true
       GROUP BY d.id
       ORDER BY d.name ASC`
    );

    const byType = {
      api: stats.filter(d => d.submission_type === 'api').length,
      auto_form: stats.filter(d => d.submission_type === 'auto_form').length,
      manual: stats.filter(d => d.submission_type === 'manual').length,
      editorial_email: stats.filter(d => d.submission_type === 'editorial_email').length,
    };

    return reply.send({ directories: stats, byType, total: stats.length });
  });
}
