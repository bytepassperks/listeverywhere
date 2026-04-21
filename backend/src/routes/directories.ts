import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/pool';
import * as fs from 'fs';
import * as path from 'path';

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

  // Bulk fix broken directories (POST /api/directories/fix-broken)
  app.post('/api/directories/fix-broken', async (request, reply) => {
    const body = request.body as {
      fixes: Array<{
        id: string;
        action: 'deactivate' | 'update';
        new_url?: string;
      }>;
    };

    if (!body.fixes || !Array.isArray(body.fixes)) {
      return reply.status(400).send({ error: 'fixes array is required' });
    }

    let deactivated = 0;
    let updated = 0;
    let errors = 0;

    for (const fix of body.fixes) {
      try {
        if (fix.action === 'deactivate') {
          await query('UPDATE directories SET active = false WHERE id = $1', [fix.id]);
          deactivated++;
        } else if (fix.action === 'update' && fix.new_url) {
          await query('UPDATE directories SET submit_url = $1 WHERE id = $2', [fix.new_url, fix.id]);
          updated++;
        }
      } catch {
        errors++;
      }
    }

    const activeCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM directories WHERE active = true');
    const totalCount = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM directories');

    return reply.send({
      message: `Fix complete. ${updated} updated, ${deactivated} deactivated, ${errors} errors.`,
      updated,
      deactivated,
      errors,
      total_fixes: body.fixes.length,
      active_directories: parseInt(activeCount?.count || '0', 10),
      total_directories: parseInt(totalCount?.count || '0', 10),
    });
  });

  // Seed 10K+ directories endpoint (POST /api/directories/seed-10k)
  app.post('/api/directories/seed-10k', async (_request, reply) => {
    const seedPath = path.resolve(__dirname, '../../seed/directories_10k.json');
    if (!fs.existsSync(seedPath)) {
      return reply.status(404).send({ error: 'Seed file not found' });
    }

    const raw = fs.readFileSync(seedPath, 'utf-8');
    const directories: any[] = JSON.parse(raw);

    // Ensure unique constraint exists
    await query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'directories_name_unique'
        ) THEN
          ALTER TABLE directories ADD CONSTRAINT directories_name_unique UNIQUE (name);
        END IF;
      END $$;
    `);

    let inserted = 0;
    let skipped = 0;

    for (const dir of directories) {
      try {
        const result = await query<{ id: string }>(
          `INSERT INTO directories (
             name, submit_url, submission_type, title_limit, desc_limit,
             requires_logo, requires_screenshot, requires_category,
             category_taxonomy, notes, active
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
           ON CONFLICT (name) DO NOTHING
           RETURNING id`,
          [
            dir.name,
            dir.submit_url,
            dir.submission_type,
            dir.title_limit || 100,
            dir.desc_limit || 500,
            dir.requires_logo || false,
            dir.requires_screenshot || false,
            dir.requires_category || false,
            JSON.stringify(dir.category_taxonomy || []),
            dir.notes || '',
          ]
        );
        if (result.length > 0) {
          inserted++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    const final = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM directories');
    return reply.send({
      message: `Seed complete. ${inserted} inserted, ${skipped} skipped.`,
      inserted,
      skipped,
      total_in_db: parseInt(final?.count || '0', 10),
    });
  });
}
