import { pool } from '../db/pool';

/**
 * Alert System
 * Generates weekly digest alerts showing:
 * - New endpoints discovered this week
 * - New backlinks created across all projects
 * - Endpoints that need attention (high failure rate)
 * - Suggestions to submit to new endpoints
 */

export interface Alert {
  id: string;
  project_id: string | null;
  type: 'new_endpoints' | 'weekly_digest' | 'auto_submit_complete' | 'high_failure_rate' | 'discovery_complete';
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export async function generateWeeklyDigest(): Promise<void> {
  console.log('[AlertSystem] Generating weekly digest...');

  // Get stats for the week
  const [endpointStats, backlinkStats, projectStats] = await Promise.all([
    pool.query(`
      SELECT COUNT(*) as total_endpoints,
        (SELECT COUNT(*) FROM backlink_endpoints WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
      FROM backlink_endpoints WHERE active = true
    `),
    pool.query(`
      SELECT COUNT(*) as total_backlinks,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM backlink_results
    `),
    pool.query("SELECT id, domain FROM indexer_projects WHERE status = 'active'"),
  ]);

  const ep = endpointStats.rows[0];
  const bl = backlinkStats.rows[0];

  // Create digest alert for each project
  for (const project of projectStats.rows) {
    const { rows: [projectBl] } = await pool.query(`
      SELECT COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as new_this_week
      FROM backlink_results WHERE project_id = $1
    `, [project.id]);

    // Count unsubmitted endpoints for this project
    const { rows: [unsubmitted] } = await pool.query(`
      SELECT COUNT(*) FROM backlink_endpoints be
      WHERE be.active = true
      AND NOT EXISTS (
        SELECT 1 FROM backlink_results br WHERE br.project_id = $1 AND br.endpoint_id = be.id
      )
    `, [project.id]);

    const newEndpointCount = parseInt(ep.new_this_week);
    const unsubmittedCount = parseInt(unsubmitted.count);

    if (newEndpointCount > 0 || unsubmittedCount > 0) {
      await pool.query(
        `INSERT INTO indexer_alerts (project_id, type, title, message, data)
         VALUES ($1, 'weekly_digest', $2, $3, $4)`,
        [
          project.id,
          `Weekly Report: ${project.domain}`,
          `${newEndpointCount} new endpoints discovered this week. ${unsubmittedCount} endpoints pending submission. ${parseInt(projectBl.new_this_week)} new backlinks created.`,
          JSON.stringify({
            totalEndpoints: parseInt(ep.total_endpoints),
            newEndpoints: newEndpointCount,
            totalBacklinks: parseInt(projectBl.total),
            newBacklinks: parseInt(projectBl.new_this_week),
            unsubmittedEndpoints: unsubmittedCount,
          }),
        ]
      );
    }
  }

  // Global new endpoints alert
  if (parseInt(ep.new_this_week) > 0) {
    await pool.query(
      `INSERT INTO indexer_alerts (project_id, type, title, message, data)
       VALUES (NULL, 'new_endpoints', $1, $2, $3)`,
      [
        `${ep.new_this_week} New Backlink Endpoints Discovered`,
        `The auto-discovery system found ${ep.new_this_week} new backlink sites this week. Total endpoints: ${ep.total_endpoints}. Click "Submit to New Endpoints" to update all your projects.`,
        JSON.stringify({
          newCount: parseInt(ep.new_this_week),
          totalCount: parseInt(ep.total_endpoints),
        }),
      ]
    );
  }

  console.log('[AlertSystem] Weekly digest generated');
}

export async function createAutoSubmitAlert(projectId: string, submitted: number, failed: number): Promise<void> {
  await pool.query(
    `INSERT INTO indexer_alerts (project_id, type, title, message, data)
     VALUES ($1, 'auto_submit_complete', $2, $3, $4)`,
    [
      projectId,
      `Auto-Submit Complete: ${submitted} new backlinks`,
      `Automatically submitted to ${submitted + failed} new endpoints. ${submitted} succeeded, ${failed} failed.`,
      JSON.stringify({ submitted, failed }),
    ]
  );
}

export async function getAlerts(projectId?: string, unreadOnly = false): Promise<Alert[]> {
  let query = `
    SELECT * FROM indexer_alerts 
    WHERE (project_id = $1 OR project_id IS NULL)
  `;
  const params: (string | boolean)[] = [projectId || ''];

  if (unreadOnly) {
    query += ' AND read = false';
  }

  query += ' ORDER BY created_at DESC LIMIT 50';

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function markAlertRead(alertId: string): Promise<void> {
  await pool.query('UPDATE indexer_alerts SET read = true WHERE id = $1', [alertId]);
}

export async function markAllAlertsRead(projectId: string): Promise<void> {
  await pool.query(
    'UPDATE indexer_alerts SET read = true WHERE (project_id = $1 OR project_id IS NULL) AND read = false',
    [projectId]
  );
}

export async function getUnreadAlertCount(projectId?: string): Promise<number> {
  const { rows: [{ count }] } = await pool.query(
    'SELECT COUNT(*) FROM indexer_alerts WHERE (project_id = $1 OR project_id IS NULL) AND read = false',
    [projectId || '']
  );
  return parseInt(count);
}
