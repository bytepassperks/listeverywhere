import { FastifyInstance } from 'fastify';
import { renderDemoVideo, getRenderJob, getCompanyDataForVideo } from '../services/demoVideoService';

export async function demoVideoRoutes(app: FastifyInstance) {
  app.post('/api/demo-video/render', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const { companyId } = request.body as { companyId: string };

    if (!companyId) {
      return reply.status(400).send({ error: 'companyId is required' });
    }

    try {
      await getCompanyDataForVideo(companyId, request.userId!);
    } catch {
      return reply.status(404).send({ error: 'Company not found' });
    }

    const jobId = await renderDemoVideo(companyId, request.userId!);

    return { jobId };
  });

  app.get('/api/demo-video/status/:jobId', {
    preHandler: [app.authenticate],
  }, async (request) => {
    const { jobId } = request.params as { jobId: string };
    const job = getRenderJob(jobId);

    if (!job) {
      return { status: 'not_found', progress: 0 };
    }

    return {
      status: job.status,
      progress: job.progress,
      downloadUrl: job.downloadUrl,
      error: job.error,
    };
  });
}
