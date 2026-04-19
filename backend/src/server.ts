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
