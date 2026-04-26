/**
 * Google Indexing API Service
 * 
 * Submits URLs to Google's crawl queue for fast indexing (minutes instead of days/weeks).
 * Uses the Web Search Indexing API with service account authentication.
 * 
 * Free quota: 200 URL notifications per day per service account.
 * 
 * Official docs: https://developers.google.com/search/apis/indexing-api/v3/quickstart
 */

import { env } from '../config/env';
import { pool } from '../db/pool';
import crypto from 'crypto';

interface ServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface GoogleIndexingResult {
  url: string;
  success: boolean;
  status?: number;
  error?: string;
}

interface GoogleIndexingBatchResult {
  submitted: number;
  failed: number;
  errors: string[];
  results: GoogleIndexingResult[];
  quotaRemaining?: number;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function getServiceAccountKey(): ServiceAccountKey | null {
  const keyJson = env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return null;
  
  try {
    return JSON.parse(keyJson) as ServiceAccountKey;
  } catch {
    console.error('[GoogleIndexing] Failed to parse service account key JSON');
    return null;
  }
}

function base64url(data: string): string {
  return Buffer.from(data).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createSignedJwt(key: ServiceAccountKey): string {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: key.private_key_id,
  };
  
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  };
  
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(key.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return `${signatureInput}.${signature}`;
}

async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) {
    return cachedAccessToken.token;
  }
  
  const key = getServiceAccountKey();
  if (!key) {
    console.error('[GoogleIndexing] No service account key configured');
    return null;
  }
  
  try {
    const jwt = createSignedJwt(key);
    
    const response = await fetch(key.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleIndexing] Token exchange failed:', response.status, errorText);
      return null;
    }
    
    const data = await response.json() as { access_token: string; expires_in: number };
    cachedAccessToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };
    
    return data.access_token;
  } catch (err) {
    console.error('[GoogleIndexing] Failed to get access token:', err);
    return null;
  }
}

/**
 * Submit a single URL to Google Indexing API
 */
async function submitUrlToGoogle(
  url: string,
  accessToken: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
): Promise<GoogleIndexingResult> {
  try {
    const response = await fetch(
      'https://indexing.googleapis.com/v3/urlNotifications:publish',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ url, type }),
        signal: AbortSignal.timeout(10000),
      }
    );
    
    if (response.ok) {
      return { url, success: true, status: response.status };
    }
    
    const errorData = await response.text();
    
    if (response.status === 429) {
      return { url, success: false, status: 429, error: 'Daily quota exceeded (200 URLs/day)' };
    }
    
    return { url, success: false, status: response.status, error: errorData };
  } catch (err) {
    return { url, success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Submit multiple URLs to Google Indexing API with rate limiting.
 * Respects the 200 URLs/day free quota.
 */
export async function submitToGoogleIndexing(
  urls: string[],
  maxPerBatch: number = 200
): Promise<GoogleIndexingBatchResult> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      submitted: 0,
      failed: urls.length,
      errors: ['Failed to authenticate with Google Indexing API - check service account key'],
      results: [],
    };
  }
  
  const results: GoogleIndexingResult[] = [];
  let submitted = 0;
  let failed = 0;
  const errors: string[] = [];
  
  const batch = urls.slice(0, maxPerBatch);
  
  for (let i = 0; i < batch.length; i++) {
    const result = await submitUrlToGoogle(batch[i], accessToken);
    results.push(result);
    
    if (result.success) {
      submitted++;
    } else {
      failed++;
      if (result.status === 429) {
        errors.push(`Quota exceeded after ${submitted} URLs. Remaining URLs will be submitted tomorrow.`);
        break;
      }
      if (result.error && !errors.includes(result.error)) {
        errors.push(`${batch[i]}: ${result.error}`);
      }
    }
    
    if (i < batch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return {
    submitted,
    failed,
    errors,
    results,
    quotaRemaining: Math.max(0, 200 - submitted),
  };
}

/**
 * Submit backlink URLs from a project to Google Indexing API.
 * Fetches unsubmitted backlink URLs from the DB, submits them, and updates their status.
 */
export async function submitBacklinksToGoogleIndexing(
  projectId: string,
  limit: number = 200
): Promise<GoogleIndexingBatchResult & { total: number; alreadySubmitted: number }> {
  const backlinkResult = await pool.query(
    `SELECT id, backlink_url FROM backlink_results
     WHERE project_id = $1
       AND status IN ('submitted', 'verified')
       AND backlink_url IS NOT NULL
       AND COALESCE(google_indexing_submitted, false) = false
     ORDER BY 
       CASE WHEN indexable = true THEN 0 ELSE 1 END,
       created_at DESC
     LIMIT $2`,
    [projectId, limit]
  );

  const alreadySubmittedResult = await pool.query(
    `SELECT COUNT(*) as count FROM backlink_results
     WHERE project_id = $1 AND google_indexing_submitted = true`,
    [projectId]
  );
  const alreadySubmitted = parseInt(alreadySubmittedResult.rows[0].count);

  if (backlinkResult.rows.length === 0) {
    return { submitted: 0, failed: 0, errors: [], results: [], total: 0, alreadySubmitted };
  }

  const urls = backlinkResult.rows.map((r: { backlink_url: string }) => r.backlink_url);
  const ids = backlinkResult.rows.map((r: { id: string }) => r.id);

  const result = await submitToGoogleIndexing(urls, limit);

  if (result.submitted > 0) {
    const successfulUrls = result.results
      .filter(r => r.success)
      .map(r => r.url);
    
    const successfulIds = backlinkResult.rows
      .filter((r: { backlink_url: string }) => successfulUrls.includes(r.backlink_url))
      .map((r: { id: string }) => r.id);

    if (successfulIds.length > 0) {
      await pool.query(
        `UPDATE backlink_results 
         SET google_indexing_submitted = true, 
             google_indexing_submitted_at = NOW()
         WHERE id = ANY($1)`,
        [successfulIds]
      );
    }
  }

  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'google_indexing_submit', $2)`,
    [projectId, JSON.stringify({
      urls_submitted: result.submitted,
      urls_failed: result.failed,
      quota_remaining: result.quotaRemaining,
    })]
  );

  return { ...result, total: urls.length, alreadySubmitted };
}

/**
 * Check if the Google Indexing API is configured and working.
 */
export async function checkGoogleIndexingStatus(): Promise<{
  configured: boolean;
  authenticated: boolean;
  serviceAccountEmail?: string;
  error?: string;
}> {
  const key = getServiceAccountKey();
  if (!key) {
    return { configured: false, authenticated: false, error: 'No service account key configured' };
  }

  const token = await getAccessToken();
  if (!token) {
    return {
      configured: true,
      authenticated: false,
      serviceAccountEmail: key.client_email,
      error: 'Failed to authenticate - check service account permissions',
    };
  }

  return {
    configured: true,
    authenticated: true,
    serviceAccountEmail: key.client_email,
  };
}

/**
 * Get Google Indexing API submission stats for a project.
 */
export async function getGoogleIndexingStats(projectId: string): Promise<{
  totalSubmitted: number;
  submittedToday: number;
  quotaRemainingToday: number;
  lastSubmittedAt: string | null;
}> {
  const totalResult = await pool.query(
    `SELECT COUNT(*) as count FROM backlink_results
     WHERE project_id = $1 AND google_indexing_submitted = true`,
    [projectId]
  );

  const todayResult = await pool.query(
    `SELECT COUNT(*) as count FROM backlink_results
     WHERE project_id = $1 
       AND google_indexing_submitted = true
       AND google_indexing_submitted_at >= CURRENT_DATE`,
    [projectId]
  );

  const lastSubmitted = await pool.query(
    `SELECT google_indexing_submitted_at FROM backlink_results
     WHERE project_id = $1 AND google_indexing_submitted = true
     ORDER BY google_indexing_submitted_at DESC LIMIT 1`,
    [projectId]
  );

  const submittedToday = parseInt(todayResult.rows[0].count);

  return {
    totalSubmitted: parseInt(totalResult.rows[0].count),
    submittedToday,
    quotaRemainingToday: Math.max(0, 200 - submittedToday),
    lastSubmittedAt: lastSubmitted.rows[0]?.google_indexing_submitted_at || null,
  };
}
