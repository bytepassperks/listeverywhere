import { Job } from 'bullmq';
import { updateSubmissionStatus, incrementAttempt } from '../services/statusTracker';
import { generatePayload } from '../services/payloadGenerator';
import { getNextProxy, getProxyUrl, isProxyEnabled } from '../config/proxyPool';

interface ApiSubmissionJobData {
  submissionId: string;
  companyId: string;
  directoryId: string;
  apiEndpoint: string;
}

const MAX_RETRIES = 3;

export async function processApiSubmission(job: Job<ApiSubmissionJobData>): Promise<void> {
  const { submissionId, companyId, directoryId, apiEndpoint } = job.data;

  const attemptCount = await incrementAttempt(submissionId);

  try {
    await updateSubmissionStatus(submissionId, 'retrying');

    const payload = await generatePayload(companyId, directoryId);

    const apiPayload = {
      name: payload.title,
      tagline: payload.tagline,
      description: payload.description,
      url: payload.website,
      logo_url: payload.logo_url,
      categories: payload.categories,
      screenshots: payload.screenshots,
      contact_email: payload.email,
      pricing: payload.pricing_model,
      social_links: payload.social_links,
    };

    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ListEverywhere/1.0 (Directory Submission Bot)',
      },
      body: JSON.stringify(apiPayload),
    };

    if (isProxyEnabled()) {
      const proxy = getNextProxy();
      if (proxy) {
        console.log(`Using proxy: ${proxy.host}:${proxy.port}`);
      }
    }

    const response = await fetch(apiEndpoint, fetchOptions);

    if (response.ok) {
      await updateSubmissionStatus(submissionId, 'auto_submitted');
      console.log(`API submission successful for ${payload.directory_name} (submission: ${submissionId})`);
    } else {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`API submission failed for ${submissionId} (attempt ${attemptCount}):`, errorMsg);

    if (attemptCount >= MAX_RETRIES) {
      await updateSubmissionStatus(submissionId, 'manual_required', `Failed after ${MAX_RETRIES} attempts: ${errorMsg}`);
    } else {
      await updateSubmissionStatus(submissionId, 'retrying', errorMsg);
      throw error;
    }
  }
}
