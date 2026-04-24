import { pool } from '../db/pool';

export interface CampaignConfig {
  projectId: string;
  dailyLimit: number;
  durationDays: number;
  categories: string[];
  minDelayMs: number;
  maxDelayMs: number;
  pauseOnErrorRate: number;
}

export async function createCampaign(
  projectId: string,
  userId: string,
  config: Partial<CampaignConfig> = {}
): Promise<{ campaignId: string; totalEndpoints: number; estimatedDays: number }> {
  const dailyLimit = config.dailyLimit || 200;
  const durationDays = config.durationDays || 30;
  const categories = config.categories || [];
  const minDelayMs = config.minDelayMs || 30000;
  const maxDelayMs = config.maxDelayMs || 300000;
  const pauseOnErrorRate = config.pauseOnErrorRate || 0.3;

  // Get total active endpoints
  let endpointQuery = 'SELECT COUNT(*) FROM backlink_endpoints WHERE active = true';
  const params: (string | string[])[] = [];
  if (categories.length > 0) {
    endpointQuery += ' AND category = ANY($1)';
    params.push(categories);
  }
  const { rows: [{ count }] } = await pool.query(endpointQuery, params);
  const totalEndpoints = parseInt(count);
  const estimatedDays = Math.ceil(totalEndpoints / dailyLimit);

  // Create campaign
  const { rows: [campaign] } = await pool.query(
    `INSERT INTO indexer_campaigns (project_id, user_id, daily_limit, duration_days, categories, 
     min_delay_ms, max_delay_ms, pause_on_error_rate, total_endpoints, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
     RETURNING id`,
    [projectId, userId, dailyLimit, durationDays, JSON.stringify(categories),
     minDelayMs, maxDelayMs, pauseOnErrorRate, totalEndpoints]
  );

  // Queue all endpoints for this campaign
  let queueQuery = `
    INSERT INTO indexer_campaign_queue (campaign_id, endpoint_id, status)
    SELECT $1, id, 'pending' FROM backlink_endpoints WHERE active = true`;
  const queueParams: (string | string[])[] = [campaign.id];
  if (categories.length > 0) {
    queueQuery += ' AND category = ANY($2)';
    queueParams.push(categories);
  }
  await pool.query(queueQuery, queueParams);

  // Log activity
  await pool.query(
    `INSERT INTO indexer_activity_log (project_id, action, details)
     VALUES ($1, 'campaign_created', $2)`,
    [projectId, JSON.stringify({ campaignId: campaign.id, dailyLimit, totalEndpoints, estimatedDays })]
  );

  return { campaignId: campaign.id, totalEndpoints, estimatedDays };
}

export async function processCampaignBatch(campaignId: string, manual = false): Promise<{
  processed: number; succeeded: number; failed: number; remaining: number; paused: boolean;
}> {
  // Get campaign config
  const { rows: [campaign] } = await pool.query(
    'SELECT * FROM indexer_campaigns WHERE id = $1', [campaignId]
  );
  if (!campaign) {
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, paused: false };
  }

  // If campaign is completed or paused (and not manual), skip
  if (campaign.status !== 'active' && !manual) {
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, paused: false };
  }

  // Reactivate if manual trigger on completed/paused campaign
  if (manual && campaign.status !== 'active') {
    await pool.query('UPDATE indexer_campaigns SET status = $1, updated_at = NOW() WHERE id = $2', ['active', campaignId]);
  }

  // Get project info
  const { rows: [project] } = await pool.query(
    'SELECT domain FROM indexer_projects WHERE id = $1', [campaign.project_id]
  );
  if (!project) return { processed: 0, succeeded: 0, failed: 0, remaining: 0, paused: false };

  const domain = project.domain;
  const url = `https://${domain}`;

  // Clean up stale queue entries (endpoints that no longer exist in backlink_endpoints)
  await pool.query(
    `DELETE FROM indexer_campaign_queue 
     WHERE campaign_id = $1 AND status = 'pending'
     AND endpoint_id NOT IN (SELECT id FROM backlink_endpoints WHERE active = true)`,
    [campaignId]
  );

  // If queue is empty, re-queue from current active endpoints
  const { rows: [queueCheck] } = await pool.query(
    'SELECT COUNT(*) FROM indexer_campaign_queue WHERE campaign_id = $1 AND status = $2',
    [campaignId, 'pending']
  );
  if (parseInt(queueCheck.count) === 0) {
    // Re-queue all active endpoints that haven't been submitted yet for this campaign
    await pool.query(
      `INSERT INTO indexer_campaign_queue (campaign_id, endpoint_id, status)
       SELECT $1, be.id, 'pending' FROM backlink_endpoints be
       WHERE be.active = true
       AND NOT EXISTS (
         SELECT 1 FROM indexer_campaign_queue cq
         WHERE cq.campaign_id = $1 AND cq.endpoint_id = be.id
       )`,
      [campaignId]
    );
  }

  // Get today's batch (respect daily limit)
  const batchSize = manual ? 30 : 10;
  const { rows: todayCount } = await pool.query(
    `SELECT COUNT(*) FROM indexer_campaign_queue 
     WHERE campaign_id = $1 AND status != 'pending' 
     AND processed_at >= CURRENT_DATE`,
    [campaignId]
  );
  const todayProcessed = parseInt(todayCount[0].count);
  const remaining = campaign.daily_limit - todayProcessed;
  if (remaining <= 0 && !manual) {
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, paused: false };
  }

  // Get pending endpoints for this batch
  const { rows: batch } = await pool.query(
    `SELECT cq.id, cq.endpoint_id, be.name, be.url_template, be.category
     FROM indexer_campaign_queue cq
     JOIN backlink_endpoints be ON be.id = cq.endpoint_id
     WHERE cq.campaign_id = $1 AND cq.status = 'pending'
     ORDER BY COALESCE(be.tier, 4) ASC, RANDOM()
     LIMIT $2`,
    [campaignId, Math.min(manual ? remaining || batchSize : remaining, batchSize)]
  );

  let succeeded = 0;
  let failed = 0;

  for (const item of batch) {
    // Use short delays for manual triggers (1-3s), full delays for background drip-feed
    const delay = manual
      ? 1000 + Math.random() * 2000
      : campaign.min_delay_ms + Math.random() * (campaign.max_delay_ms - campaign.min_delay_ms);
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const targetUrl = item.url_template
        .replace(/{DOMAIN}/g, domain)
        .replace(/{URL}/g, encodeURIComponent(url));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      });
      clearTimeout(timeout);

      const httpStatus = response.status;
      const success = httpStatus >= 200 && httpStatus < 400;

      await pool.query(
        `UPDATE indexer_campaign_queue SET status = $1, http_status = $2, processed_at = NOW()
         WHERE id = $3`,
        [success ? 'submitted' : 'failed', httpStatus, item.id]
      );

      // Also record as backlink result
      if (success) {
        await pool.query(
          `INSERT INTO backlink_results (project_id, endpoint_id, endpoint_name, endpoint_category, target_url, backlink_url, status, http_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'submitted', $7)
           ON CONFLICT DO NOTHING`,
          [campaign.project_id, item.endpoint_id, item.name, item.category, url, targetUrl, httpStatus]
        );
        succeeded++;
      } else {
        failed++;
      }
    } catch (err) {
      await pool.query(
        `UPDATE indexer_campaign_queue SET status = 'failed', error = $1, processed_at = NOW()
         WHERE id = $2`,
        [err instanceof Error ? err.message : 'Unknown error', item.id]
      );
      failed++;
    }
  }

  // Check error rate and auto-pause if needed
  const { rows: [stats] } = await pool.query(
    `SELECT 
       COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
       COUNT(*) FILTER (WHERE status IN ('submitted', 'failed')) as total_count
     FROM indexer_campaign_queue WHERE campaign_id = $1 AND processed_at >= CURRENT_DATE`,
    [campaignId]
  );
  const errorRate = parseInt(stats.total_count) > 10 
    ? parseInt(stats.failed_count) / parseInt(stats.total_count) 
    : 0;
  
  let paused = false;
  if (errorRate > campaign.pause_on_error_rate) {
    await pool.query('UPDATE indexer_campaigns SET status = $1 WHERE id = $2', ['paused', campaignId]);
    paused = true;
  }

  // Update campaign progress
  const { rows: [progress] } = await pool.query(
    `SELECT COUNT(*) FILTER (WHERE status != 'pending') as processed,
            COUNT(*) as total
     FROM indexer_campaign_queue WHERE campaign_id = $1`,
    [campaignId]
  );
  await pool.query(
    `UPDATE indexer_campaigns SET processed_count = $1, updated_at = NOW() WHERE id = $2`,
    [parseInt(progress.processed), campaignId]
  );

  const { rows: [remainingCount] } = await pool.query(
    `SELECT COUNT(*) FROM indexer_campaign_queue WHERE campaign_id = $1 AND status = 'pending'`,
    [campaignId]
  );

  // If all done, mark campaign complete
  if (parseInt(remainingCount.count) === 0) {
    await pool.query('UPDATE indexer_campaigns SET status = $1 WHERE id = $2', ['completed', campaignId]);
  }

  return {
    processed: batch.length,
    succeeded,
    failed,
    remaining: parseInt(remainingCount.count),
    paused,
  };
}

export async function getCampaigns(projectId: string): Promise<unknown[]> {
  const { rows } = await pool.query(
    `SELECT c.*, 
       (SELECT COUNT(*) FROM indexer_campaign_queue WHERE campaign_id = c.id AND status = 'pending') as pending_count,
       (SELECT COUNT(*) FROM indexer_campaign_queue WHERE campaign_id = c.id AND status = 'submitted') as submitted_count,
       (SELECT COUNT(*) FROM indexer_campaign_queue WHERE campaign_id = c.id AND status = 'failed') as failed_count
     FROM indexer_campaigns c
     WHERE c.project_id = $1
     ORDER BY c.created_at DESC`,
    [projectId]
  );
  return rows;
}

export async function pauseCampaign(campaignId: string): Promise<void> {
  await pool.query('UPDATE indexer_campaigns SET status = $1, updated_at = NOW() WHERE id = $2', ['paused', campaignId]);
}

export async function resumeCampaign(campaignId: string): Promise<void> {
  await pool.query('UPDATE indexer_campaigns SET status = $1, updated_at = NOW() WHERE id = $2', ['active', campaignId]);
}
