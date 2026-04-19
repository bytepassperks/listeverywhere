import { Worker, Queue } from 'bullmq';
import { createRedisConnection } from '../db/redis';
import { processApiSubmission } from './apiSubmissionWorker';
import { processFormSubmission } from './formSubmissionWorker';
import { processManualKit } from './manualKitWorker';
import { processEditorialEmail } from './editorialEmailWorker';
import { env } from '../config/env';
import { loadProxies } from '../config/proxyPool';

const QUEUE_NAME = 'directorySubmissionQueue';
const CONCURRENCY = 20;

export const submissionQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: new URL(env.REDIS_URL).hostname || 'localhost',
    port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

async function processJob(job: {
  name: string;
  data: Record<string, string>;
  id?: string;
}): Promise<void> {
  console.log(`Processing job ${job.id} (type: ${job.name})`);

  switch (job.name) {
    case 'api_submission':
      await processApiSubmission(job as never);
      break;
    case 'form_submission':
      await processFormSubmission(job as never);
      break;
    case 'manual_kit':
      await processManualKit(job as never);
      break;
    case 'editorial_email':
      await processEditorialEmail(job as never);
      break;
    default:
      console.warn(`Unknown job type: ${job.name}`);
  }
}

export async function startWorkers(): Promise<void> {
  console.log('Loading proxy pool...');
  await loadProxies();

  const connection = createRedisConnection();

  const worker = new Worker(QUEUE_NAME, async (job) => {
    await processJob(job);
  }, {
    connection,
    concurrency: CONCURRENCY,
    limiter: {
      max: 10,
      duration: 60000,
    },
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed (type: ${job.name})`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed (type: ${job?.name}):`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log(`Worker pool started with concurrency ${CONCURRENCY}`);
  console.log('Listening for jobs on queue:', QUEUE_NAME);
}

export async function enqueueSubmission(
  submissionType: string,
  data: {
    submissionId: string;
    companyId: string;
    directoryId: string;
    apiEndpoint?: string;
    submitUrl?: string;
  }
): Promise<string> {
  let jobName: string;

  switch (submissionType) {
    case 'api':
      jobName = 'api_submission';
      break;
    case 'auto_form':
      jobName = 'form_submission';
      break;
    case 'manual':
      jobName = 'manual_kit';
      break;
    case 'editorial_email':
      jobName = 'editorial_email';
      break;
    default:
      jobName = 'manual_kit';
  }

  const job = await submissionQueue.add(jobName, data, {
    priority: jobName === 'api_submission' ? 1 : jobName === 'form_submission' ? 2 : 3,
  });

  return job.id || '';
}

if (require.main === module) {
  startWorkers().catch((err) => {
    console.error('Failed to start workers:', err);
    process.exit(1);
  });
}
