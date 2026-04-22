import { pool } from '../db/pool';
import crypto from 'crypto';

export function generateIndexNowKey(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function submitToIndexNow(urls: string[], domain: string, indexNowKey: string): Promise<{ submitted: number; errors: string[] }> {
  const errors: string[] = [];
  let submitted = 0;

  // IndexNow supports batch submission to Bing
  const engines = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ];

  for (const engine of engines) {
    try {
      const host = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');

      if (urls.length === 1) {
        // Single URL submission
        const params = new URLSearchParams({
          url: urls[0],
          key: indexNowKey,
        });
        const response = await fetch(`${engine}?${params.toString()}`, {
          method: 'GET',
          headers: { 'User-Agent': 'ListGenius-Indexer/1.0' },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          submitted++;
        } else {
          errors.push(`${engine}: HTTP ${response.status}`);
        }
      } else {
        // Batch submission (up to 10,000 URLs)
        const response = await fetch(engine, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'User-Agent': 'ListGenius-Indexer/1.0',
          },
          body: JSON.stringify({
            host,
            key: indexNowKey,
            keyLocation: `https://${host}/${indexNowKey}.txt`,
            urlList: urls.slice(0, 10000),
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok || response.status === 200 || response.status === 202) {
          submitted += urls.length;
        } else {
          errors.push(`${engine}: HTTP ${response.status}`);
        }
      }
    } catch (err) {
      errors.push(`${engine}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { submitted, errors };
}

export async function submitUrlsViaIndexNow(projectId: string, urlIds: string[]): Promise<{ submitted: number; errors: string[] }> {
  const project = await pool.query(
    'SELECT domain, indexnow_key FROM indexer_projects WHERE id = $1',
    [projectId]
  );

  if (project.rows.length === 0) {
    return { submitted: 0, errors: ['Project not found'] };
  }

  const { domain, indexnow_key } = project.rows[0];
  if (!indexnow_key) {
    return { submitted: 0, errors: ['IndexNow key not configured'] };
  }

  const urlResult = await pool.query(
    'SELECT id, url FROM indexer_urls WHERE id = ANY($1) AND project_id = $2',
    [urlIds, projectId]
  );

  const urls = urlResult.rows.map((r: { url: string }) => r.url);
  if (urls.length === 0) {
    return { submitted: 0, errors: ['No URLs to submit'] };
  }

  const result = await submitToIndexNow(urls, domain, indexnow_key);

  // Update URL statuses
  if (result.submitted > 0) {
    await pool.query(
      `UPDATE indexer_urls SET index_status = 'submitted', last_submitted = NOW(), submit_count = submit_count + 1, updated_at = NOW()
       WHERE id = ANY($1)`,
      [urlIds]
    );

    // Log activity
    await pool.query(
      `INSERT INTO indexer_activity_log (project_id, action, details)
       VALUES ($1, 'indexnow_submit', $2)`,
      [projectId, JSON.stringify({ count: urls.length, engines_reached: result.submitted })]
    );
  }

  return result;
}
