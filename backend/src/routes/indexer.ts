import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { pool } from '../db/pool';
import { discoverSitemapUrl, syncSitemapToProject } from '../services/sitemapParser';
import { generateIndexNowKey, submitUrlsViaIndexNow } from '../services/indexNowService';
import { pingSitemap, pingUrls, batchCheckIndexStatus } from '../services/pingService';
import { buildBacklinks, getBacklinkStats, seedBacklinkEndpoints } from '../services/backlinkBuilder';
import { analyzeMetaTags, checkGoogleIndex, analyzeRobotsTxt } from '../services/seoTools';
import { createCampaign, processCampaignBatch, getCampaigns, pauseCampaign, resumeCampaign } from '../services/dripFeedService';
import { submitToLLMEngines, checkLLMVisibility, getLLMEngineInfo } from '../services/llmIndexingService';

export async function indexerRoutes(app: FastifyInstance) {
  // ==========================================
  // PROJECTS
  // ==========================================

  // List all indexer projects for user
  app.get('/api/indexer/projects', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const isSuperAdmin = request.userRole === 'super_admin';
    const query = isSuperAdmin
      ? 'SELECT * FROM indexer_projects ORDER BY created_at DESC'
      : 'SELECT * FROM indexer_projects WHERE user_id = $1 ORDER BY created_at DESC';
    const params = isSuperAdmin ? [] : [request.userId];

    const result = await pool.query(query, params);
    return { projects: result.rows };
  });

  // Get single project with stats
  app.get('/api/indexer/projects/:id', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const isSuperAdmin = request.userRole === 'super_admin';

    const query = isSuperAdmin
      ? 'SELECT * FROM indexer_projects WHERE id = $1'
      : 'SELECT * FROM indexer_projects WHERE id = $1 AND user_id = $2';
    const params = isSuperAdmin ? [id] : [id, request.userId];

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    // Get URL status distribution
    const urlStats = await pool.query(
      `SELECT index_status, COUNT(*) as count
       FROM indexer_urls WHERE project_id = $1
       GROUP BY index_status`,
      [id]
    );

    // Get recent activity
    const activity = await pool.query(
      `SELECT * FROM indexer_activity_log WHERE project_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [id]
    );

    return {
      project: result.rows[0],
      urlStats: urlStats.rows,
      activity: activity.rows,
    };
  });

  // Create new indexer project
  app.post('/api/indexer/projects', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { domain } = request.body as { domain: string };

    if (!domain) {
      return reply.status(400).send({ error: 'Domain is required' });
    }

    // Clean domain
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').toLowerCase();

    // Check duplicate
    const existing = await pool.query(
      'SELECT id FROM indexer_projects WHERE domain = $1 AND user_id = $2',
      [cleanDomain, request.userId]
    );
    if (existing.rows.length > 0) {
      return reply.status(409).send({ error: 'Project already exists for this domain', project_id: existing.rows[0].id });
    }

    // Discover sitemap
    const sitemapUrl = await discoverSitemapUrl(cleanDomain);

    // Generate IndexNow key
    const indexNowKey = generateIndexNowKey();

    const result = await pool.query(
      `INSERT INTO indexer_projects (user_id, domain, sitemap_url, indexnow_key, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [request.userId, cleanDomain, sitemapUrl, indexNowKey]
    );

    const project = result.rows[0];

    // Auto-sync sitemap if found
    let sitemapStats = { added: 0, total: 0 };
    if (sitemapUrl) {
      try {
        sitemapStats = await syncSitemapToProject(project.id, sitemapUrl);
      } catch {
        // Continue even if sitemap sync fails
      }
    }

    // Log activity
    await pool.query(
      `INSERT INTO indexer_activity_log (project_id, action, details)
       VALUES ($1, 'project_created', $2)`,
      [project.id, JSON.stringify({ domain: cleanDomain, sitemap_found: !!sitemapUrl, urls_discovered: sitemapStats.added })]
    );

    // Refresh project with updated counts
    const updated = await pool.query('SELECT * FROM indexer_projects WHERE id = $1', [project.id]);

    return reply.status(201).send({
      project: updated.rows[0],
      sitemap_found: !!sitemapUrl,
      urls_discovered: sitemapStats.added,
      indexnow_key: indexNowKey,
    });
  });

  // Delete project
  app.delete('/api/indexer/projects/:id', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const isSuperAdmin = request.userRole === 'super_admin';

    const query = isSuperAdmin
      ? 'DELETE FROM indexer_projects WHERE id = $1 RETURNING id'
      : 'DELETE FROM indexer_projects WHERE id = $1 AND user_id = $2 RETURNING id';
    const params = isSuperAdmin ? [id] : [id, request.userId];

    const result = await pool.query(query, params);
    if (result.rowCount === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    return { message: 'Project deleted' };
  });

  // ==========================================
  // URLS
  // ==========================================

  // Get URLs for a project with pagination and filters
  app.get('/api/indexer/projects/:id/urls', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { page = '1', limit = '50', status, search } = request.query as { page?: string; limit?: string; status?: string; search?: string };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    // Verify project access
    const isSuperAdmin = request.userRole === 'super_admin';
    const projectCheck = isSuperAdmin
      ? await pool.query('SELECT id FROM indexer_projects WHERE id = $1', [id])
      : await pool.query('SELECT id FROM indexer_projects WHERE id = $1 AND user_id = $2', [id, request.userId]);

    if (projectCheck.rows.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    let whereClause = 'WHERE project_id = $1';
    const params: (string | number)[] = [id];

    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND index_status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND url ILIKE $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM indexer_urls ${whereClause}`,
      params
    );

    const urlsResult = await pool.query(
      `SELECT * FROM indexer_urls ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    // Status distribution
    const statusDist = await pool.query(
      `SELECT index_status, COUNT(*) as count FROM indexer_urls WHERE project_id = $1 GROUP BY index_status`,
      [id]
    );

    return {
      urls: urlsResult.rows,
      statusCounts: Object.fromEntries(statusDist.rows.map((r: { index_status: string; count: string }) => [r.index_status, parseInt(r.count)])),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum),
      },
    };
  });

  // Add URLs manually
  app.post('/api/indexer/projects/:id/urls', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { urls } = request.body as { urls: string[] };

    if (!urls || urls.length === 0) {
      return reply.status(400).send({ error: 'URLs array is required' });
    }

    let added = 0;
    for (const url of urls.slice(0, 1000)) {
      try {
        const result = await pool.query(
          `INSERT INTO indexer_urls (project_id, url, source)
           VALUES ($1, $2, 'manual')
           ON CONFLICT (project_id, url) DO NOTHING
           RETURNING id`,
          [id, url.trim()]
        );
        if (result.rowCount && result.rowCount > 0) added++;
      } catch {
        // skip
      }
    }

    // Update counts
    const counts = await pool.query(
      `SELECT COUNT(*) as total FROM indexer_urls WHERE project_id = $1`,
      [id]
    );
    await pool.query(
      'UPDATE indexer_projects SET total_urls = $2, updated_at = NOW() WHERE id = $1',
      [id, counts.rows[0].total]
    );

    return { added, total_submitted: urls.length };
  });

  // ==========================================
  // SITEMAP SYNC
  // ==========================================

  app.post('/api/indexer/projects/:id/sync-sitemap', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const project = await pool.query('SELECT * FROM indexer_projects WHERE id = $1', [id]);
    if (project.rows.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    let sitemapUrl = project.rows[0].sitemap_url;

    if (!sitemapUrl) {
      sitemapUrl = await discoverSitemapUrl(project.rows[0].domain);
      if (sitemapUrl) {
        await pool.query('UPDATE indexer_projects SET sitemap_url = $2 WHERE id = $1', [id, sitemapUrl]);
      } else {
        return reply.status(404).send({ error: 'No sitemap found for this domain' });
      }
    }

    const stats = await syncSitemapToProject(id, sitemapUrl);

    await pool.query(
      `INSERT INTO indexer_activity_log (project_id, action, details)
       VALUES ($1, 'sitemap_sync', $2)`,
      [id, JSON.stringify(stats)]
    );

    return { message: 'Sitemap synced', ...stats };
  });

  // ==========================================
  // INDEX STATUS CHECK
  // ==========================================

  app.post('/api/indexer/projects/:id/check-index', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { url_ids, check_all } = request.body as { url_ids?: string[]; check_all?: boolean };

    let urlIds: string[] = [];

    if (check_all) {
      const result = await pool.query(
        `SELECT id FROM indexer_urls WHERE project_id = $1 AND (index_status = 'unknown' OR index_status = 'not_indexed') LIMIT 50`,
        [id]
      );
      urlIds = result.rows.map((r: { id: string }) => r.id);
    } else if (url_ids) {
      urlIds = url_ids;
    }

    if (urlIds.length === 0) {
      return { message: 'No URLs to check', checked: 0, indexed: 0, notIndexed: 0 };
    }

    const stats = await batchCheckIndexStatus(id, urlIds.slice(0, 50));

    return { message: 'Index check complete', ...stats };
  });

  // ==========================================
  // SUBMIT FOR INDEXING
  // ==========================================

  // Submit via IndexNow
  app.post('/api/indexer/projects/:id/submit-indexnow', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { url_ids, submit_all_unindexed } = request.body as { url_ids?: string[]; submit_all_unindexed?: boolean };

    let urlIds: string[] = [];

    if (submit_all_unindexed) {
      const result = await pool.query(
        `SELECT id FROM indexer_urls WHERE project_id = $1 AND index_status IN ('not_indexed', 'unknown', 'crawled_not_indexed', 'discovered_not_crawled') LIMIT 10000`,
        [id]
      );
      urlIds = result.rows.map((r: { id: string }) => r.id);
    } else if (url_ids) {
      urlIds = url_ids;
    }

    if (urlIds.length === 0) {
      return { message: 'No URLs to submit', submitted: 0 };
    }

    const result = await submitUrlsViaIndexNow(id, urlIds);
    return { message: 'IndexNow submission complete', ...result };
  });

  // Submit via ping
  app.post('/api/indexer/projects/:id/submit-ping', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { url_ids } = request.body as { url_ids?: string[] };

    const project = await pool.query('SELECT sitemap_url FROM indexer_projects WHERE id = $1', [id]);
    if (project.rows.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    // Ping sitemap
    let sitemapPing = { pinged: 0, errors: [] as string[] };
    if (project.rows[0].sitemap_url) {
      sitemapPing = await pingSitemap(project.rows[0].sitemap_url);
    }

    // Ping individual URLs if specified
    let urlPing = { pinged: 0, errors: [] as string[] };
    if (url_ids && url_ids.length > 0) {
      const urlResult = await pool.query(
        'SELECT url FROM indexer_urls WHERE id = ANY($1) AND project_id = $2',
        [url_ids, id]
      );
      const urls = urlResult.rows.map((r: { url: string }) => r.url);
      urlPing = await pingUrls(urls);
    }

    await pool.query(
      `INSERT INTO indexer_activity_log (project_id, action, details)
       VALUES ($1, 'ping_submit', $2)`,
      [id, JSON.stringify({ sitemap_pinged: sitemapPing.pinged, urls_pinged: urlPing.pinged })]
    );

    return {
      message: 'Ping submission complete',
      sitemap_pinged: sitemapPing.pinged,
      urls_pinged: urlPing.pinged,
      errors: [...sitemapPing.errors, ...urlPing.errors].slice(0, 10),
    };
  });

  // ==========================================
  // BACKLINK BUILDER
  // ==========================================

  // Seed backlink endpoints
  app.post('/api/indexer/backlinks/seed', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.userRole !== 'super_admin') {
      return reply.status(403).send({ error: 'Super admin only' });
    }

    const seeded = await seedBacklinkEndpoints();
    return { message: `Seeded ${seeded} backlink endpoints` };
  });

  // Get backlink endpoints
  app.get('/api/indexer/backlinks/endpoints', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { category } = request.query as { category?: string };

    let query = 'SELECT id, name, url_template, category, domain_authority, is_dofollow, active, success_rate FROM backlink_endpoints WHERE active = true';
    const params: string[] = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY category, name';
    const result = await pool.query(query, params);

    // Get counts by category
    const categoryCounts = await pool.query(
      `SELECT category, COUNT(*) as count FROM backlink_endpoints WHERE active = true GROUP BY category ORDER BY count DESC`
    );

    return {
      endpoints: result.rows,
      total: result.rows.length,
      byCategory: Object.fromEntries(categoryCounts.rows.map((r: { category: string; count: string }) => [r.category, parseInt(r.count)])),
    };
  });

  // Build backlinks for a project
  app.post('/api/indexer/projects/:id/build-backlinks', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { categories } = request.body as { categories?: string[] };

    const project = await pool.query('SELECT domain FROM indexer_projects WHERE id = $1', [id]);
    if (project.rows.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const domain = project.rows[0].domain;
    const targetUrl = `https://${domain}`;

    const result = await buildBacklinks(id, targetUrl, domain, categories);
    return { message: 'Backlink building complete', ...result };
  });

  // Get backlink stats for project
  app.get('/api/indexer/projects/:id/backlink-stats', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const stats = await getBacklinkStats(id);
    return stats;
  });

  // Get backlink results for project
  app.get('/api/indexer/projects/:id/backlinks', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { page = '1', limit = '50', status } = request.query as { page?: string; limit?: string; status?: string };

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE br.project_id = $1';
    const params: (string | number)[] = [id];

    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND br.status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM backlink_results br ${whereClause}`,
      params
    );

    const result = await pool.query(
      `SELECT br.*
       FROM backlink_results br
       ${whereClause}
       ORDER BY br.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limitNum, offset]
    );

    return {
      backlinks: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum),
      },
    };
  });

  // ==========================================
  // SEO TOOLS (public, no auth required for basic tools)
  // ==========================================

  // Meta tags analyzer
  app.post('/api/indexer/tools/meta-analyzer', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { url } = request.body as { url: string };
    if (!url) return reply.status(400).send({ error: 'URL is required' });

    const result = await analyzeMetaTags(url);
    return result;
  });

  // Google index checker
  app.post('/api/indexer/tools/index-checker', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { url } = request.body as { url: string };
    if (!url) return reply.status(400).send({ error: 'URL is required' });

    const result = await checkGoogleIndex(url);
    return result;
  });

  // Robots.txt analyzer
  app.post('/api/indexer/tools/robots-analyzer', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { domain } = request.body as { domain: string };
    if (!domain) return reply.status(400).send({ error: 'Domain is required' });

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
    const result = await analyzeRobotsTxt(cleanDomain);
    return result;
  });

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  app.get('/api/indexer/stats', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const isSuperAdmin = request.userRole === 'super_admin';
    const userFilter = isSuperAdmin ? '' : 'WHERE user_id = $1';
    const params = isSuperAdmin ? [] : [request.userId];

    const projectCount = await pool.query(
      `SELECT COUNT(*) as count FROM indexer_projects ${userFilter}`,
      params
    );

    const totalUrls = await pool.query(
      `SELECT COALESCE(SUM(total_urls), 0) as total, COALESCE(SUM(indexed_count), 0) as indexed, COALESCE(SUM(not_indexed_count), 0) as not_indexed
       FROM indexer_projects ${userFilter}`,
      params
    );

    const endpointCount = await pool.query('SELECT COUNT(*) as count FROM backlink_endpoints WHERE active = true');

    const backlinkCount = await pool.query(
      `SELECT COUNT(*) as count FROM backlink_results br
       JOIN indexer_projects ip ON br.project_id = ip.id
       ${isSuperAdmin ? '' : 'WHERE ip.user_id = $1'}`,
      params
    );

    return {
      projects: parseInt(projectCount.rows[0].count),
      totalUrls: parseInt(totalUrls.rows[0].total),
      indexedUrls: parseInt(totalUrls.rows[0].indexed),
      notIndexedUrls: parseInt(totalUrls.rows[0].not_indexed),
      backlinkEndpoints: parseInt(endpointCount.rows[0].count),
      totalBacklinks: parseInt(backlinkCount.rows[0].count),
    };
  });

  // ==========================================
  // DRIP-FEED CAMPAIGNS
  // ==========================================

  // Create a drip-feed campaign
  app.post('/api/indexer/projects/:id/campaigns', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { daily_limit, duration_days, categories, min_delay_ms, max_delay_ms } = request.body as {
      daily_limit?: number; duration_days?: number; categories?: string[];
      min_delay_ms?: number; max_delay_ms?: number;
    };

    const project = await pool.query('SELECT domain FROM indexer_projects WHERE id = $1', [id]);
    if (project.rows.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const result = await createCampaign(id, request.userId!, {
      projectId: id, dailyLimit: daily_limit, durationDays: duration_days,
      categories: categories || [], minDelayMs: min_delay_ms, maxDelayMs: max_delay_ms,
    });

    return reply.status(201).send({
      message: 'Campaign created',
      ...result,
    });
  });

  // Get campaigns for a project
  app.get('/api/indexer/projects/:id/campaigns', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const campaigns = await getCampaigns(id);
    return { campaigns };
  });

  // Process campaign batch (run next batch of submissions)
  app.post('/api/indexer/campaigns/:campaignId/process', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { campaignId } = request.params as { campaignId: string };
    const result = await processCampaignBatch(campaignId);
    return { message: 'Batch processed', ...result };
  });

  // Pause campaign
  app.post('/api/indexer/campaigns/:campaignId/pause', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { campaignId } = request.params as { campaignId: string };
    await pauseCampaign(campaignId);
    return { message: 'Campaign paused' };
  });

  // Resume campaign
  app.post('/api/indexer/campaigns/:campaignId/resume', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { campaignId } = request.params as { campaignId: string };
    await resumeCampaign(campaignId);
    return { message: 'Campaign resumed' };
  });

  // ==========================================
  // LLM INDEXING (Module 5)
  // ==========================================

  // Submit to LLM search engines
  app.post('/api/indexer/projects/:id/llm-index', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const project = await pool.query('SELECT domain FROM indexer_projects WHERE id = $1', [id]);
    if (project.rows.length === 0) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    const result = await submitToLLMEngines(id);
    return { message: 'LLM indexing complete', ...result };
  });

  // Check LLM visibility
  app.post('/api/indexer/tools/llm-visibility', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { domain } = request.body as { domain: string };
    if (!domain) return reply.status(400).send({ error: 'Domain is required' });

    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
    const result = await checkLLMVisibility(cleanDomain);
    return result;
  });

  // Get LLM engine info
  app.get('/api/indexer/llm-engines', { preHandler: [app.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    return { engines: getLLMEngineInfo() };
  });
}
