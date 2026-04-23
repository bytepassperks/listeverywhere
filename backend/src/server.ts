import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { env } from './config/env';
import { authRoutes } from './routes/auth';
import { companyRoutes } from './routes/companies';
import { submissionRoutes } from './routes/submissions';
import { directoryRoutes } from './routes/directories';
import { bulkUploadRoutes } from './routes/bulkUpload';
import { jobRoutes } from './routes/jobs';
import { demoVideoRoutes } from './routes/demoVideo';
import { indexerRoutes } from './routes/indexer';
import path from 'path';
import fs from 'fs';
import { runMigrations, runBacklinkEnhancementMigrations } from './db/migrate';
import { seedDirectories, seedSuperAdmin } from './db/seed';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
  }
}

async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  await app.register(cors, {
    origin: env.NODE_ENV === 'production'
      ? [env.FRONTEND_URL, 'https://listeverywhere-frontend.onrender.com', 'https://app.listgenius.net']
      : true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  });

  app.decorate('authenticate', async function (
    request: import('fastify').FastifyRequest,
    reply: import('fastify').FastifyReply
  ) {
    try {
      const decoded = await request.jwtVerify<{ id: string; email: string; role?: string }>();
      request.userId = decoded.id;
      request.userEmail = decoded.email;
      request.userRole = decoded.role || 'user';
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  const screenshotsDir = env.SCREENSHOTS_DIR;
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  app.get('/screenshots/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const filePath = path.join(screenshotsDir, filename);

    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Screenshot not found' });
    }

    return reply.type('image/png').send(fs.createReadStream(filePath));
  });

  await app.register(authRoutes);
  await app.register(companyRoutes);
  await app.register(submissionRoutes);
  await app.register(directoryRoutes);
  await app.register(bulkUploadRoutes);
  await app.register(jobRoutes);
  await app.register(demoVideoRoutes);
  await app.register(indexerRoutes);

  const videosDir = path.join(env.SCREENSHOTS_DIR, 'videos');
  if (!fs.existsSync(videosDir)) {
    fs.mkdirSync(videosDir, { recursive: true });
  }

  app.get('/videos/:filename', async (request, reply) => {
    const { filename } = request.params as { filename: string };
    const filePath = path.join(videosDir, filename);

    if (!fs.existsSync(filePath)) {
      return reply.status(404).send({ error: 'Video not found' });
    }

    return reply.type('video/mp4').send(fs.createReadStream(filePath));
  });

  // Image proxy endpoint - allows frontend to fetch cross-origin images for video export
  const imageProxyHandler = async (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    const { url } = request.query as { url?: string };
    if (!url) {
      return reply.status(400).send({ error: 'url parameter required' });
    }

    try {
      const decoded = decodeURIComponent(url);
      const isHead = request.method === 'HEAD';
      const response = await fetch(decoded, { method: isHead ? 'HEAD' : 'GET' });
      if (!response.ok) {
        return reply.status(response.status).send({ error: 'Failed to fetch image' });
      }

      const contentType = response.headers.get('content-type') || 'image/png';

      if (isHead) {
        return reply
          .header('Access-Control-Allow-Origin', '*')
          .header('Cache-Control', 'public, max-age=86400')
          .type(contentType)
          .send();
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return reply
        .header('Access-Control-Allow-Origin', '*')
        .header('Cache-Control', 'public, max-age=86400')
        .type(contentType)
        .send(buffer);
    } catch (err) {
      console.error('[Image Proxy] Error:', err);
      return reply.status(500).send({ error: 'Failed to proxy image' });
    }
  };
  app.get('/api/image-proxy', imageProxyHandler);
  app.head('/api/image-proxy', imageProxyHandler);

  app.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return app;
}

async function start() {
  // Build and listen FIRST so Render detects the port immediately
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Run critical setup (migrations + super admin) immediately
  runCriticalSetup().catch(err => console.error('Critical setup error:', err));

  // Delay heavy background tasks by 2 minutes so login/API is responsive
  setTimeout(() => {
    runHeavyBackgroundTasks().catch(err => console.error('Background tasks error:', err));
  }, 2 * 60 * 1000);
}

async function runCriticalSetup() {
  try {
    await runMigrations();
    console.log('Database migrations completed');
  } catch (err) {
    console.error('Migration error (continuing anyway):', err);
  }

  try {
    await runBacklinkEnhancementMigrations();
    console.log('Backlink enhancement migrations completed');
  } catch (err) {
    console.error('Backlink enhancement migration error (continuing anyway):', err);
  }

  try {
    await seedSuperAdmin();
    console.log('Super admin seed check completed');
  } catch (err) {
    console.error('Super admin seed error (continuing anyway):', err);
  }
}

async function runHeavyBackgroundTasks() {
  console.log('[Background] Starting heavy background tasks (delayed 2min)...');

  try {
    await seedDirectories();
    console.log('Directory seed check completed');
  } catch (err) {
    console.error('Seed error (continuing anyway):', err);
  }

  // Start 6-hour background workers for endpoint discovery + auto-submit
  startBackgroundWorkers();

  // Auto-seed backlink endpoints in background if count is low
  autoSeedEndpoints();
}

async function autoSeedEndpoints() {
  try {
    const { pool } = await import('./db/pool');
    const result = await pool.query('SELECT COUNT(*) as count FROM backlink_endpoints');
    const count = parseInt(result.rows[0].count);
    console.log(`[AutoSeed] Current endpoint count: ${count.toLocaleString()}`);

    if (count < 100000) {
      console.log('[AutoSeed] Endpoint count below 100K — starting mass seed in background...');
      const { seedBacklinkEndpoints } = await import('./services/backlinkBuilder');
      const seeded = await seedBacklinkEndpoints();
      console.log(`[AutoSeed] Mass seed complete: ${seeded.toLocaleString()} new endpoints added`);
    } else {
      console.log('[AutoSeed] Endpoint count already above 100K — skipping mass seed');
    }
  } catch (err) {
    console.error('[AutoSeed] Error:', err);
  }
}

function startBackgroundWorkers() {
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  console.log('[Workers] Starting background workers (6-hour cycle)');

  // Run the full cycle every 6 hours
  setInterval(async () => {
    try {
      const { runFullCycle } = await import('./workers/autoSubmitWorker');
      await runFullCycle();
    } catch (err) {
      console.error('[Workers] 6-hour cycle error:', err);
    }
  }, SIX_HOURS_MS);

  // Generate weekly digest every 7 days
  setInterval(async () => {
    try {
      const { generateWeeklyDigest } = await import('./workers/alertSystem');
      await generateWeeklyDigest();
    } catch (err) {
      console.error('[Workers] Weekly digest error:', err);
    }
  }, ONE_WEEK_MS);

  // Run first discovery 15 minutes after startup (delayed to avoid pool saturation)
  setTimeout(async () => {
    try {
      const { runFullCycle } = await import('./workers/autoSubmitWorker');
      await runFullCycle();
    } catch (err) {
      console.error('[Workers] Initial cycle error:', err);
    }
  }, 15 * 60 * 1000);
}

start();

export { buildApp };

