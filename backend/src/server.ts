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
import path from 'path';
import fs from 'fs';
import { runMigrations } from './db/migrate';
import { seedDirectories } from './db/seed';

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
    origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : true,
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
      const decoded = await request.jwtVerify<{ id: string; email: string }>();
      request.userId = decoded.id;
      request.userEmail = decoded.email;
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
  try {
    await runMigrations();
    console.log('Database migrations completed');
  } catch (err) {
    console.error('Migration error (continuing anyway):', err);
  }

  try {
    await seedDirectories();
    console.log('Directory seed check completed');
  } catch (err) {
    console.error('Seed error (continuing anyway):', err);
  }

  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`Server running on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { buildApp };
