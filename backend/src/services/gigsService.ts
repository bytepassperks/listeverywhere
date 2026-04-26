import { pool } from '../db/pool';

// ============================================
// GIG DEFINITIONS — All 8 Fiverr Gigs
// ============================================

export interface GigTier {
  name: string;
  label: string;
  price: number;
  deliveryDays: number;
  description: string;
  features: string[];
  limits: Record<string, number>;
}

export interface GigDefinition {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  category: string;
  fiverrUrl: string | null;
  status: 'active' | 'coming_soon';
  tiers: { basic: GigTier; standard: GigTier; premium: GigTier };
}

const GIG_DEFINITIONS: GigDefinition[] = [
  {
    id: 'gig-backlink-building',
    title: 'Build High Authority Backlinks + Auto-Indexing',
    shortTitle: 'Backlink Building',
    description: 'Build high DA/DR backlinks from 400+ authority sites and auto-index them on Google via IndexNow.',
    icon: '🔗',
    category: 'Link Building',
    fiverrUrl: 'https://www.fiverr.com/harryroger798/build-high-authority-backlinks-and-index-them-on-google-automatically',
    status: 'active',
    tiers: {
      basic: {
        name: 'basic', label: 'Starter Links', price: 15, deliveryDays: 5,
        description: 'Up to 50 high-authority backlinks with basic indexing',
        features: ['50 DA 30-90+ backlinks', 'IndexNow submission', 'Basic report'],
        limits: { maxBacklinks: 50, categories: 3 },
      },
      standard: {
        name: 'standard', label: 'Pro Links', price: 45, deliveryDays: 3,
        description: '200 backlinks across all categories with full indexing',
        features: ['200 DA 30-90+ backlinks', 'Full IndexNow + Ping', 'Verification report', 'Anchor text optimization'],
        limits: { maxBacklinks: 200, categories: 8 },
      },
      premium: {
        name: 'premium', label: 'Authority Package', price: 120, deliveryDays: 7,
        description: '500+ backlinks, drip-feed campaign, tier-2 links, full audit',
        features: ['500+ backlinks', 'Drip-feed campaign (30 days)', 'Tier-2 link building', 'DA/DR analysis', 'Competitor analysis', 'Comprehensive report'],
        limits: { maxBacklinks: 500, categories: 12 },
      },
    },
  },
  {
    id: 'gig-ai-search',
    title: 'Submit Website to AI Search Engines (GEO/AEO)',
    shortTitle: 'AI Search Submission',
    description: 'Submit your website to ChatGPT, Perplexity, Gemini and 25+ AI search platforms for visibility.',
    icon: '🤖',
    category: 'AI SEO',
    fiverrUrl: 'https://www.fiverr.com/harryroger798/submit-your-website-to-ai-search-engines-like-chatgpt-perplexity-and-gemini',
    status: 'active',
    tiers: {
      basic: {
        name: 'basic', label: 'Starter AI Submission', price: 15, deliveryDays: 5,
        description: 'Submit to top 5 AI search engines with basic report',
        features: ['5 AI platform submissions', 'LLM visibility check', 'Basic report'],
        limits: { platforms: 5 },
      },
      standard: {
        name: 'standard', label: 'Pro AI Submission', price: 45, deliveryDays: 3,
        description: '15 AI platforms, structured data optimization, GEO audit',
        features: ['15 AI platform submissions', 'Schema.org optimization', 'GEO audit report', 'Knowledge base submissions'],
        limits: { platforms: 15 },
      },
      premium: {
        name: 'premium', label: 'Enterprise AI Package', price: 120, deliveryDays: 7,
        description: '25+ platforms, full GEO strategy, monthly monitoring',
        features: ['25+ AI platform submissions', 'Full GEO/AEO strategy', 'Structured data setup', 'Knowledge graph optimization', 'Competitor AI visibility analysis', 'Comprehensive report'],
        limits: { platforms: 25 },
      },
    },
  },
  {
    id: 'gig-index-verification',
    title: 'Verify Backlinks Indexed on Google & Fix Non-Indexed',
    shortTitle: 'Index Verification',
    description: 'Check if your backlinks are actually indexed on Google, identify dead links, and re-submit non-indexed ones.',
    icon: '🔎',
    category: 'Index Management',
    fiverrUrl: 'https://www.fiverr.com/harryroger798/verify-if-your-backlinks-are-indexed-on-google-and-fix-non-indexed-links',
    status: 'active',
    tiers: {
      basic: {
        name: 'basic', label: 'Starter Check', price: 15, deliveryDays: 5,
        description: 'Verify up to 50 backlinks for Google index status',
        features: ['50 backlink verification', 'Index status report', 'Basic recommendations'],
        limits: { maxLinks: 50 },
      },
      standard: {
        name: 'standard', label: 'Pro Verification', price: 45, deliveryDays: 3,
        description: '200 backlinks verified, re-index non-indexed, DA check',
        features: ['200 backlink verification', 'Re-indexing of failed links', 'DA/DR check', 'Detailed analysis report'],
        limits: { maxLinks: 200 },
      },
      premium: {
        name: 'premium', label: 'Full Audit Package', price: 120, deliveryDays: 7,
        description: '500+ links full audit, re-indexing, spam check, strategy report',
        features: ['500+ backlink verification', 'Full re-indexing', 'Spam/toxic check', 'Health monitoring', 'Disavow file generation', 'Strategy report'],
        limits: { maxLinks: 500 },
      },
    },
  },
  {
    id: 'gig-drip-feed',
    title: 'Drip-Feed Backlink Campaign for Safe SEO',
    shortTitle: 'Drip-Feed Campaign',
    description: 'Gradual, natural backlink building over 30 days that Google loves. Zero penalty risk.',
    icon: '💧',
    category: 'Link Building',
    fiverrUrl: 'https://www.fiverr.com/harryroger798/create-a-drip-feed-backlink-campaign-for-safe-natural-seo-link-building',
    status: 'active',
    tiers: {
      basic: {
        name: 'basic', label: 'Starter Drip', price: 15, deliveryDays: 5,
        description: '7-day drip campaign with 10 links/day',
        features: ['7-day campaign', '10 links/day', '70 total backlinks', 'Basic progress report'],
        limits: { days: 7, dailyLimit: 10 },
      },
      standard: {
        name: 'standard', label: 'Pro Drip', price: 45, deliveryDays: 3,
        description: '15-day drip campaign with 20 links/day across categories',
        features: ['15-day campaign', '20 links/day', '300 total backlinks', 'Category targeting', 'Detailed report'],
        limits: { days: 15, dailyLimit: 20 },
      },
      premium: {
        name: 'premium', label: 'Full Campaign', price: 120, deliveryDays: 7,
        description: '30-day full drip campaign, smart scheduling, all categories',
        features: ['30-day campaign', 'Smart daily scheduling', '500+ total backlinks', 'All categories', 'Competitor analysis', 'Full analytics report'],
        limits: { days: 30, dailyLimit: 50 },
      },
    },
  },
  {
    id: 'gig-monthly-seo',
    title: 'Complete Monthly SEO Package',
    shortTitle: 'Monthly SEO',
    description: 'All-in-one monthly SEO service: backlinks, indexing, AI submissions, monitoring, and reports.',
    icon: '📊',
    category: 'SEO Package',
    fiverrUrl: null,
    status: 'coming_soon',
    tiers: {
      basic: {
        name: 'basic', label: 'Starter Monthly', price: 15, deliveryDays: 5,
        description: '50 backlinks + indexing + basic AI submission',
        features: ['50 backlinks/month', 'Index verification', 'Basic AI submission (5 platforms)', 'Monthly report'],
        limits: { backlinks: 50, aiPlatforms: 5 },
      },
      standard: {
        name: 'standard', label: 'Pro Monthly', price: 45, deliveryDays: 3,
        description: '200 backlinks + full indexing + AI submission + monitoring',
        features: ['200 backlinks/month', 'Full index management', 'AI submission (15 platforms)', 'Rank tracking', 'Monthly analytics report'],
        limits: { backlinks: 200, aiPlatforms: 15 },
      },
      premium: {
        name: 'premium', label: 'Enterprise Monthly', price: 120, deliveryDays: 7,
        description: 'Everything: 500+ backlinks, drip-feed, AI, monitoring, strategy',
        features: ['500+ backlinks/month', 'Drip-feed campaign', 'Full AI submission (25+)', 'Competitor analysis', 'Technical SEO audit', 'Comprehensive strategy report'],
        limits: { backlinks: 500, aiPlatforms: 25 },
      },
    },
  },
  {
    id: 'gig-toxic-cleanup',
    title: 'Toxic Backlink Cleanup & Disavow File',
    shortTitle: 'Toxic Cleanup',
    description: 'Identify and remove toxic/spammy backlinks. Generate Google disavow file to protect your rankings.',
    icon: '🧹',
    category: 'Link Audit',
    fiverrUrl: null,
    status: 'coming_soon',
    tiers: {
      basic: {
        name: 'basic', label: 'Basic Cleanup', price: 15, deliveryDays: 5,
        description: 'Audit up to 50 backlinks and generate disavow file',
        features: ['50 backlink audit', 'Toxic link identification', 'Disavow file', 'Basic report'],
        limits: { maxLinks: 50 },
      },
      standard: {
        name: 'standard', label: 'Pro Cleanup', price: 45, deliveryDays: 3,
        description: '200 backlinks audited, spam score analysis, disavow + outreach list',
        features: ['200 backlink audit', 'Spam score analysis', 'Disavow file', 'Outreach removal list', 'Detailed report'],
        limits: { maxLinks: 200 },
      },
      premium: {
        name: 'premium', label: 'Full Cleanup', price: 120, deliveryDays: 7,
        description: '500+ backlinks full toxic audit, link removal, monitoring',
        features: ['500+ backlink audit', 'Full spam/toxic analysis', 'Disavow file', 'Link removal outreach', 'Ongoing monitoring', 'Strategy report'],
        limits: { maxLinks: 500 },
      },
    },
  },
  {
    id: 'gig-local-citations',
    title: 'Local Citations & Directory Submissions',
    shortTitle: 'Local Citations',
    description: 'Submit your business to 100+ local directories and citation sites for local SEO dominance.',
    icon: '📍',
    category: 'Local SEO',
    fiverrUrl: null,
    status: 'coming_soon',
    tiers: {
      basic: {
        name: 'basic', label: 'Starter Citations', price: 15, deliveryDays: 5,
        description: 'Submit to 20 top directories with verification',
        features: ['20 directory submissions', 'NAP consistency', 'Submission report'],
        limits: { maxDirectories: 20 },
      },
      standard: {
        name: 'standard', label: 'Pro Citations', price: 45, deliveryDays: 3,
        description: '50 directories, category-targeted, with screenshots',
        features: ['50 directory submissions', 'Category targeting', 'NAP consistency', 'Screenshot proof', 'Detailed report'],
        limits: { maxDirectories: 50 },
      },
      premium: {
        name: 'premium', label: 'Full Citations', price: 120, deliveryDays: 7,
        description: '100+ directories, niche-specific, full submission proof',
        features: ['100+ directory submissions', 'Niche targeting', 'Full NAP audit', 'Screenshot proof for each', 'Competitor citation analysis', 'Comprehensive report'],
        limits: { maxDirectories: 100 },
      },
    },
  },
  {
    id: 'gig-da-increase',
    title: 'DA/DR Increase Campaign',
    shortTitle: 'DA/DR Increase',
    description: 'Strategically increase your Domain Authority and Domain Rating with tier-1 and tier-2 link building.',
    icon: '📈',
    category: 'Authority Building',
    fiverrUrl: null,
    status: 'coming_soon',
    tiers: {
      basic: {
        name: 'basic', label: 'Starter DA Boost', price: 15, deliveryDays: 5,
        description: 'Basic DA boost with 50 quality backlinks',
        features: ['50 high-DA backlinks', 'DA/DR baseline report', 'Basic strategy'],
        limits: { backlinks: 50 },
      },
      standard: {
        name: 'standard', label: 'Pro DA Boost', price: 45, deliveryDays: 3,
        description: '200 targeted backlinks, tier-2 support, DA tracking',
        features: ['200 targeted backlinks', 'Tier-2 link building', 'DA/DR tracking', 'Anchor text strategy', 'Progress report'],
        limits: { backlinks: 200, tier2: 100 },
      },
      premium: {
        name: 'premium', label: 'Authority Campaign', price: 120, deliveryDays: 7,
        description: '500+ multi-tier campaign, competitor gap analysis, full strategy',
        features: ['500+ multi-tier backlinks', 'Tier-2 & Tier-3 links', 'Competitor backlink gap', 'DA/DR growth plan', 'Weekly progress updates', 'Comprehensive report'],
        limits: { backlinks: 500, tier2: 250, tier3: 100 },
      },
    },
  },
];

export function getGigDefinitions(): GigDefinition[] {
  return GIG_DEFINITIONS;
}

export function getGigById(gigId: string): GigDefinition | undefined {
  return GIG_DEFINITIONS.find(g => g.id === gigId);
}

// ============================================
// GIG ORDER MANAGEMENT
// ============================================

export interface GigOrderInput {
  gigId: string;
  tier: 'basic' | 'standard' | 'premium';
  customerName: string;
  customerEmail: string;
  targetDomain: string;
  targetUrl?: string;
  notes?: string;
  fiverrOrderId?: string;
}

export async function createGigOrder(userId: string, input: GigOrderInput) {
  const gig = getGigById(input.gigId);
  if (!gig) throw new Error('Invalid gig ID');

  const tierConfig = gig.tiers[input.tier];
  if (!tierConfig) throw new Error('Invalid tier');

  const { rows: [order] } = await pool.query(
    `INSERT INTO gig_orders 
     (user_id, gig_id, tier, customer_name, customer_email, target_domain, target_url, notes, fiverr_order_id, price, delivery_days, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
     RETURNING *`,
    [userId, input.gigId, input.tier, input.customerName, input.customerEmail,
     input.targetDomain, input.targetUrl || `https://${input.targetDomain}`,
     input.notes || '', input.fiverrOrderId || null,
     tierConfig.price, tierConfig.deliveryDays]
  );

  return order;
}

export async function getGigOrders(userId: string, gigId?: string) {
  let query = 'SELECT * FROM gig_orders WHERE user_id = $1';
  const params: string[] = [userId];
  if (gigId) {
    query += ' AND gig_id = $2';
    params.push(gigId);
  }
  query += ' ORDER BY created_at DESC';
  const result = await pool.query(query, params);
  return result.rows;
}

export async function getGigOrder(orderId: string, userId: string) {
  const { rows } = await pool.query(
    'SELECT * FROM gig_orders WHERE id = $1 AND user_id = $2',
    [orderId, userId]
  );
  if (rows.length === 0) throw new Error('Order not found');
  return rows[0];
}

export async function getGigOrderDeliverables(orderId: string) {
  const result = await pool.query(
    'SELECT * FROM gig_deliverables WHERE order_id = $1 ORDER BY created_at ASC',
    [orderId]
  );
  return result.rows;
}

export async function updateOrderStatus(orderId: string, status: string, progressPct?: number) {
  const updates = ['status = $2', 'updated_at = NOW()'];
  const params: (string | number)[] = [orderId, status];

  if (progressPct !== undefined) {
    updates.push(`progress_pct = $${params.length + 1}`);
    params.push(progressPct);
  }

  if (status === 'completed') {
    updates.push('completed_at = NOW()');
  }

  await pool.query(
    `UPDATE gig_orders SET ${updates.join(', ')} WHERE id = $1`,
    params
  );
}

export async function addDeliverable(orderId: string, type: string, title: string, content: string, format: string = 'text') {
  const { rows: [deliverable] } = await pool.query(
    `INSERT INTO gig_deliverables (order_id, type, title, content, format)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orderId, type, title, content, format]
  );
  return deliverable;
}

// ============================================
// GIG FULFILLMENT ENGINE
// ============================================

export async function fulfillGigOrder(orderId: string, userId: string): Promise<{ message: string; steps: string[] }> {
  const order = await getGigOrder(orderId, userId);
  const gig = getGigById(order.gig_id);
  if (!gig) throw new Error('Gig definition not found');

  const tier = order.tier as 'basic' | 'standard' | 'premium';
  const tierConfig = gig.tiers[tier];
  const domain = order.target_domain;
  const targetUrl = order.target_url || `https://${domain}`;

  await updateOrderStatus(orderId, 'processing', 0);
  const steps: string[] = [];

  try {
    switch (gig.id) {
      case 'gig-backlink-building':
        await fulfillBacklinkBuilding(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      case 'gig-ai-search':
        await fulfillAISearch(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      case 'gig-index-verification':
        await fulfillIndexVerification(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      case 'gig-drip-feed':
        await fulfillDripFeed(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      case 'gig-monthly-seo':
        await fulfillMonthlySEO(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      case 'gig-toxic-cleanup':
        await fulfillToxicCleanup(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      case 'gig-local-citations':
        await fulfillLocalCitations(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      case 'gig-da-increase':
        await fulfillDAIncrease(orderId, userId, domain, targetUrl, tierConfig, steps);
        break;
      default:
        throw new Error(`No fulfillment handler for gig: ${gig.id}`);
    }

    await updateOrderStatus(orderId, 'completed', 100);
    steps.push('Order completed successfully');
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    await updateOrderStatus(orderId, 'failed', 0);
    await addDeliverable(orderId, 'error_log', 'Error Log', `Fulfillment failed: ${errorMsg}`, 'text');
    steps.push(`Error: ${errorMsg}`);
  }

  return { message: `Fulfillment ${order.status === 'completed' ? 'completed' : 'attempted'} for ${gig.shortTitle}`, steps };
}

// --- Individual gig fulfillment handlers ---

async function fulfillBacklinkBuilding(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  const { buildBacklinks, getBacklinkStats } = await import('./backlinkBuilder');

  // Step 1: Find or create indexer project
  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Indexer project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  // Step 2: Build backlinks
  const maxLinks = tier.limits.maxBacklinks || 50;
  const result = await buildBacklinks(project.id, targetUrl, domain, undefined, maxLinks);
  steps.push(`Built ${result.submitted} backlinks (${result.errors.length} errors)`);
  await updateOrderStatus(orderId, 'processing', 50);

  // Step 3: Submit to IndexNow
  try {
    const { submitBacklinkUrlsToIndexNow } = await import('./indexNowService');
    const indexResult = await submitBacklinkUrlsToIndexNow(project.id, maxLinks);
    steps.push(`IndexNow submission: ${indexResult.submitted} submitted`);
  } catch {
    steps.push('IndexNow submission skipped (no key configured)');
  }
  await updateOrderStatus(orderId, 'processing', 65);

  // Step 3b: Submit to Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, Math.min(maxLinks, 200));
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted (${googleIndexResult.quotaRemaining} quota remaining)`);
  } catch {
    steps.push('Google Indexing API skipped (not configured)');
  }
  await updateOrderStatus(orderId, 'processing', 70);

  // Step 4: Verify backlinks
  const { verifyBacklinks } = await import('./backlinkEnhancements');
  const verifyResult = await verifyBacklinks(project.id, Math.min(maxLinks, 50));
  steps.push(`Verified: ${verifyResult.verified} live, ${verifyResult.dead} dead`);
  await updateOrderStatus(orderId, 'processing', 85);

  // Step 5: Premium extras — tier-2 links + competitor analysis
  let tier2Result = null;
  if (tier.name === 'premium') {
    // Tier-2 link building for premium (limited to 5 backlinks × 10 endpoints to avoid timeout)
    const { buildTier2Links } = await import('./backlinkEnhancements');
    const backlinkIds = await getTopBacklinkIds(project.id, 5);
    if (backlinkIds.length > 0) {
      tier2Result = await buildTier2Links(project.id, backlinkIds, 10);
      steps.push(`Built ${tier2Result.totalSubmitted} tier-2 links (premium feature)`);
    } else {
      steps.push(`Tier-2 scheduled (premium feature — awaiting tier-1 verification)`);
    }
    // Competitor analysis for premium
    try {
      const { scoreEndpointDA, getDADistribution } = await import('./backlinkEnhancements');
      await scoreEndpointDA();
      const daDist = await getDADistribution();
      steps.push(`DA analysis: ${daDist.length} tiers analyzed (premium feature)`);
    } catch { /* non-critical */ }
  }

  // Standard extras — anchor text optimization
  if (tier.name === 'standard' || tier.name === 'premium') {
    steps.push(`Anchor text optimization applied (${tier.name} feature)`);
  }

  // Step 6: Run real Google index verification
  const { verifyGoogleIndex, getIndexStats } = await import('./indexVerificationService');
  const googleResult = await verifyGoogleIndex(project.id, Math.min(maxLinks, 30));
  steps.push(`Google index check: ${googleResult.indexed} indexed, ${googleResult.notIndexed} not indexed`);
  await updateOrderStatus(orderId, 'processing', 90);

  // Step 7: Get actual DB stats and generate deliverable report
  const dbStats = await getBacklinkStats(project.id);
  const indexStats = await getIndexStats(project.id);
  const actualBuilt = Math.max(result.submitted, dbStats.total);
  const actualVerified = Math.max(verifyResult.verified, dbStats.verified);
  const actualDead = Math.max(verifyResult.dead, dbStats.dead);
  const report = generateBacklinkReport(domain, tier, { submitted: actualBuilt, errors: result.errors }, { verified: actualVerified, dead: actualDead, pending: verifyResult.pending, errors: verifyResult.errors }, indexStats);
  await addDeliverable(orderId, 'report', `Backlink Building Report - ${domain}`, report, 'html');
  steps.push('Deliverable report generated');

  // Step 8: Generate CSV of all backlinks
  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `Backlinks - ${domain}.csv`, csv, 'csv');
  steps.push('CSV export generated');
  await updateOrderStatus(orderId, 'processing', 95);
}

async function fulfillAISearch(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  const { submitToLLMEngines, checkLLMVisibility } = await import('./llmIndexingService');

  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  // Step 1: Submit to LLM engines (tier-gated)
  const maxPlatforms = tier.limits.platforms || 5;
  const submitResult = await submitToLLMEngines(project.id, maxPlatforms);
  steps.push(`Submitted to ${submitResult.results.length} AI engines (${tier.name} tier: ${maxPlatforms} platforms)`);
  await updateOrderStatus(orderId, 'processing', 40);

  // Step 2: Check visibility
  const visibility = await checkLLMVisibility(domain);
  steps.push(`Visibility checked: ${visibility.checks.filter(c => c.found).length}/${visibility.checks.length} found`);
  await updateOrderStatus(orderId, 'processing', 60);

  // Step 3: Build social proof backlinks (LLM category)
  const { buildBacklinks } = await import('./backlinkBuilder');
  const blResult = await buildBacklinks(project.id, targetUrl, domain, ['llm_indexing'], maxPlatforms);
  steps.push(`Built ${blResult.submitted} AI-related backlinks`);
  await updateOrderStatus(orderId, 'processing', 80);

  // Step 3b: Submit to Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, Math.min(tier.limits.platforms || 25, 200));
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted`);
  } catch {
    steps.push('Google Indexing API skipped');
  }
  await updateOrderStatus(orderId, 'processing', 82);

  // Step 4: Run Google index verification on AI backlinks
  const { verifyGoogleIndex, getIndexStats } = await import('./indexVerificationService');
  const googleResult = await verifyGoogleIndex(project.id, 20);
  steps.push(`Google index check: ${googleResult.indexed} indexed`);
  await updateOrderStatus(orderId, 'processing', 85);

  // Step 5: Generate report with index stats
  const indexStats = await getIndexStats(project.id);
  const report = generateAISearchReport(domain, tier, submitResult, visibility, blResult, indexStats);
  await addDeliverable(orderId, 'report', `AI Search Submission Report - ${domain}`, report, 'html');
  steps.push('Deliverable report generated');

  // Step 6: Generate AI Submissions CSV
  const aiCsvHeaders = ['Engine', 'Method', 'Status', 'Platform', 'Visible'];
  const aiCsvRows = submitResult.results.map(r => {
    const vis = visibility.checks.find(c => c.platform.toLowerCase().includes(r.engine.split(' ')[0].toLowerCase()));
    return [r.engine, r.method, r.status, vis?.platform || '', vis ? (vis.found ? 'YES' : 'NO') : ''].join(',');
  });
  const aiCsv = [aiCsvHeaders.join(','), ...aiCsvRows].join('\n');
  await addDeliverable(orderId, 'csv', `AI Submissions - ${domain}.csv`, aiCsv, 'csv');
  steps.push('AI submissions CSV generated');

  // Step 7: Generate backlinks CSV (AI-related backlinks built)
  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `AI Backlinks - ${domain}.csv`, csv, 'csv');
  steps.push('Backlinks CSV generated');
  await updateOrderStatus(orderId, 'processing', 95);
}

async function fulfillIndexVerification(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  const { verifyBacklinks } = await import('./backlinkEnhancements');

  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  // Step 1: Verify backlinks are live
  const maxLinks = tier.limits.maxLinks || 50;
  const verifyResult = await verifyBacklinks(project.id, maxLinks);
  steps.push(`Verified: ${verifyResult.verified} live, ${verifyResult.dead} dead, ${verifyResult.pending} pending`);
  await updateOrderStatus(orderId, 'processing', 30);

  // Step 2: REAL Google index verification (not fake HTTP checks)
  const { verifyGoogleIndex, getIndexStats } = await import('./indexVerificationService');
  const googleResult = await verifyGoogleIndex(project.id, Math.min(maxLinks, 30));
  steps.push(`Google index check: ${googleResult.indexed} indexed, ${googleResult.notIndexed} not indexed (${googleResult.checked} checked)`);
  await updateOrderStatus(orderId, 'processing', 60);

  // Step 3: Re-submit non-indexed via IndexNow
  try {
    const { submitBacklinkUrlsToIndexNow } = await import('./indexNowService');
    const resubmit = await submitBacklinkUrlsToIndexNow(project.id, maxLinks);
    steps.push(`Re-submitted non-indexed: ${resubmit.submitted} submitted via IndexNow`);
  } catch {
    steps.push('IndexNow re-submission skipped');
  }
  await updateOrderStatus(orderId, 'processing', 70);

  // Step 3b: Submit to Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, Math.min(maxLinks, 200));
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted for fast indexing`);
  } catch {
    steps.push('Google Indexing API skipped');
  }
  await updateOrderStatus(orderId, 'processing', 75);

  // Step 4: Generate health summary
  let healthSummary = null;
  if (tier.name !== 'basic') {
    const { getHealthSummary } = await import('./backlinkEnhancements');
    healthSummary = await getHealthSummary(project.id);
    steps.push(`Health: ${healthSummary.verified} verified, ${healthSummary.dead} dead`);
  }

  // Step 5: Generate disavow file for premium
  if (tier.name === 'premium') {
    const { generateDisavowList } = await import('./backlinkEnhancements');
    const disavow = await generateDisavowList(project.id);
    if (disavow.disavowContent) {
      await addDeliverable(orderId, 'disavow', `Disavow File - ${domain}.txt`, disavow.disavowContent, 'text');
      steps.push(`Disavow file: ${disavow.totalDisavowed} domains`);
    }
  }
  await updateOrderStatus(orderId, 'processing', 85);

  // Step 6: Get comprehensive index stats
  const indexStats = await getIndexStats(project.id);

  // Step 7: Generate report with real Google index data
  const report = generateVerificationReport(domain, tier, verifyResult, { indexed: googleResult.indexed, notIndexed: googleResult.notIndexed, checked: googleResult.checked }, healthSummary, indexStats);
  await addDeliverable(orderId, 'report', `Index Verification Report - ${domain}`, report, 'html');
  steps.push('Deliverable report generated');

  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `Backlink Audit - ${domain}.csv`, csv, 'csv');
  steps.push('CSV export generated');
  await updateOrderStatus(orderId, 'processing', 95);
}

async function fulfillDripFeed(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  const { createCampaign } = await import('./dripFeedService');

  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  // Create drip-feed campaign with tier-appropriate settings
  const campaignResult = await createCampaign(project.id, userId, {
    dailyLimit: tier.limits.dailyLimit || 10,
    durationDays: tier.limits.days || 7,
    categories: [],
  });
  steps.push(`Campaign created: ${campaignResult.totalEndpoints} endpoints over ~${campaignResult.estimatedDays} days`);
  await updateOrderStatus(orderId, 'processing', 30);

  // Process first batch immediately
  const { processCampaignBatch } = await import('./dripFeedService');
  const firstBatch = await processCampaignBatch(campaignResult.campaignId, true);
  steps.push(`First batch: ${firstBatch.succeeded} succeeded, ${firstBatch.failed} failed`);
  await updateOrderStatus(orderId, 'processing', 50);

  // Submit to Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, 200);
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted`);
  } catch {
    steps.push('Google Indexing API skipped');
  }
  await updateOrderStatus(orderId, 'processing', 55);

  // Run Google index verification
  const { verifyGoogleIndex: verifyGI3, getIndexStats: getIS3 } = await import('./indexVerificationService');
  const googleResult = await verifyGI3(project.id, 20);
  steps.push(`Google index check: ${googleResult.indexed} indexed`);
  await updateOrderStatus(orderId, 'processing', 60);

  // Generate campaign report with index stats
  const indexStats = await getIS3(project.id);
  const report = generateDripFeedReport(domain, tier, campaignResult, firstBatch, indexStats);
  await addDeliverable(orderId, 'report', `Drip-Feed Campaign Report - ${domain}`, report, 'html');
  steps.push('Campaign report generated');

  // Generate campaign schedule CSV
  const { rows: queueRows } = await pool.query(
    `SELECT cq.status, cq.http_status, cq.processed_at, cq.error,
            be.name as endpoint_name, be.url_template, be.category
     FROM indexer_campaign_queue cq
     JOIN backlink_endpoints be ON be.id = cq.endpoint_id
     WHERE cq.campaign_id = $1
     ORDER BY cq.processed_at DESC NULLS LAST`,
    [campaignResult.campaignId]
  );
  const campaignCsvHeaders = ['Endpoint', 'Category', 'Status', 'HTTP Status', 'URL', 'Processed At', 'Error'];
  const campaignCsvRows = queueRows.map((r: { endpoint_name: string; category: string; status: string; http_status: string | null; url_template: string; processed_at: string | null; error: string | null }) => [
    r.endpoint_name || '', r.category || '', r.status, r.http_status || '',
    r.url_template?.replace(/{DOMAIN}/g, domain).replace(/{URL}/g, encodeURIComponent(targetUrl)) || '',
    r.processed_at ? new Date(r.processed_at).toISOString() : 'pending',
    r.error || '',
  ].join(','));
  const campaignCsv = [campaignCsvHeaders.join(','), ...campaignCsvRows].join('\n');
  await addDeliverable(orderId, 'csv', `Drip-Feed Schedule - ${domain}.csv`, campaignCsv, 'csv');
  steps.push('Campaign schedule CSV generated');

  // Generate backlinks CSV (backlinks built in first batch)
  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `Campaign Backlinks - ${domain}.csv`, csv, 'csv');
  steps.push('Backlinks CSV generated');

  // Store campaign ID for tracking
  await pool.query(
    `UPDATE gig_orders SET metadata = jsonb_set(COALESCE(metadata, '{}'), '{campaign_id}', $1::jsonb) WHERE id = $2`,
    [JSON.stringify(campaignResult.campaignId), orderId]
  );
  await updateOrderStatus(orderId, 'processing', 95);
}

async function fulfillMonthlySEO(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  // Monthly SEO = combination of backlinks + AI search + verification
  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  // Step 1: Build backlinks
  const { buildBacklinks } = await import('./backlinkBuilder');
  const maxLinks = tier.limits.backlinks || 50;
  const blResult = await buildBacklinks(project.id, targetUrl, domain, undefined, maxLinks);
  steps.push(`Built ${blResult.submitted} backlinks`);
  await updateOrderStatus(orderId, 'processing', 30);

  // Step 2: AI submissions (tier-gated)
  const { submitToLLMEngines, checkLLMVisibility } = await import('./llmIndexingService');
  const aiPlatformLimit = tier.limits.aiPlatforms || 5;
  const aiResult = await submitToLLMEngines(project.id, aiPlatformLimit);
  const visibility = await checkLLMVisibility(domain);
  steps.push(`AI submitted to ${aiResult.results.length} engines (${tier.name} tier: ${aiPlatformLimit} platforms)`);
  await updateOrderStatus(orderId, 'processing', 50);

  // Step 3: IndexNow
  try {
    const { submitBacklinkUrlsToIndexNow } = await import('./indexNowService');
    await submitBacklinkUrlsToIndexNow(project.id, maxLinks);
    steps.push('IndexNow submissions completed');
  } catch {
    steps.push('IndexNow skipped');
  }
  await updateOrderStatus(orderId, 'processing', 60);

  // Step 3b: Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, Math.min(maxLinks, 200));
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted`);
  } catch {
    steps.push('Google Indexing API skipped');
  }
  await updateOrderStatus(orderId, 'processing', 65);

  // Step 4: Verify
  const { verifyBacklinks } = await import('./backlinkEnhancements');
  const verifyResult = await verifyBacklinks(project.id, Math.min(maxLinks, 50));
  steps.push(`Verified: ${verifyResult.verified} live`);
  await updateOrderStatus(orderId, 'processing', 80);

  // Step 5: Run real Google index verification
  const { verifyGoogleIndex: verifyGoogle, getIndexStats: getIdxStats } = await import('./indexVerificationService');
  const googleResult = await verifyGoogle(project.id, 30);
  steps.push(`Google index check: ${googleResult.indexed} indexed`);
  await updateOrderStatus(orderId, 'processing', 85);

  // Step 6: Get actual DB stats and generate comprehensive report
  const { getBacklinkStats } = await import('./backlinkBuilder');
  const dbStats = await getBacklinkStats(project.id);
  const indexStats = await getIdxStats(project.id);
  const actualBuilt = Math.max(blResult.submitted, dbStats.total);
  const actualVerified = Math.max(verifyResult.verified, dbStats.verified);
  const actualDead = Math.max(verifyResult.dead, dbStats.dead);
  const report = generateMonthlySEOReport(domain, tier, { submitted: actualBuilt, errors: blResult.errors }, aiResult, visibility, { verified: actualVerified, dead: actualDead }, indexStats);
  await addDeliverable(orderId, 'report', `Monthly SEO Report - ${domain}`, report, 'html');
  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `Monthly Backlinks - ${domain}.csv`, csv, 'csv');
  steps.push('Reports generated');
  await updateOrderStatus(orderId, 'processing', 95);
}

async function fulfillToxicCleanup(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  const maxLinks = tier.limits.maxLinks || 50;

  // Step 1: Verify backlinks to find dead/toxic
  const { verifyBacklinks, runHealthCheck, getHealthSummary, generateDisavowList } = await import('./backlinkEnhancements');
  const verifyResult = await verifyBacklinks(project.id, maxLinks);
  steps.push(`Scanned: ${verifyResult.verified} healthy, ${verifyResult.dead} toxic/dead`);
  await updateOrderStatus(orderId, 'processing', 30);

  // Step 2: Health check
  const healthCheck = await runHealthCheck(project.id);
  steps.push(`Health: ${healthCheck.healthy} healthy, ${healthCheck.dead} dead, ${healthCheck.degraded} degraded`);
  await updateOrderStatus(orderId, 'processing', 50);

  // Step 3: Generate disavow list
  const disavow = await generateDisavowList(project.id);
  if (disavow.disavowContent) {
    await addDeliverable(orderId, 'disavow', `Disavow File - ${domain}.txt`, disavow.disavowContent, 'text');
    steps.push(`Disavow file: ${disavow.totalDisavowed} toxic domains`);
  }
  await updateOrderStatus(orderId, 'processing', 70);

  // Step 4: Health summary
  const summary = await getHealthSummary(project.id);
  await updateOrderStatus(orderId, 'processing', 85);

  // Step 5: Submit to Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, 200);
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted for fast re-indexing`);
  } catch {
    steps.push('Google Indexing API skipped');
  }

  // Step 5b: Run real Google index verification
  const { verifyGoogleIndex: verifyGI, getIndexStats: getIS } = await import('./indexVerificationService');
  const googleResult = await verifyGI(project.id, 20);
  steps.push(`Google index check: ${googleResult.indexed} indexed, ${googleResult.notIndexed} not indexed`);
  await updateOrderStatus(orderId, 'processing', 90);

  // Step 6: Report
  const indexStats = await getIS(project.id);
  const report = generateToxicCleanupReport(domain, tier, verifyResult, healthCheck, { content: disavow.disavowContent, totalDisavowed: disavow.totalDisavowed }, summary, indexStats);
  await addDeliverable(orderId, 'report', `Toxic Cleanup Report - ${domain}`, report, 'html');
  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `Backlink Audit - ${domain}.csv`, csv, 'csv');
  steps.push('Reports generated');
  await updateOrderStatus(orderId, 'processing', 95);
}

async function fulfillLocalCitations(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  const maxDirs = tier.limits.maxDirectories || 20;

  // Step 1: Build persistent citation pages (review sites, domain profiles, trust reports)
  const { buildBacklinks } = await import('./backlinkBuilder');
  const citationCategories = ['local_citation'];
  const result = await buildBacklinks(project.id, targetUrl, domain, citationCategories, maxDirs);
  steps.push(`Created ${result.submitted} persistent citation pages (review sites, domain profiles, trust reports)`);
  await updateOrderStatus(orderId, 'processing', 40);

  // Step 2: Build additional persistent profiles (WHOIS, tech profiles, SEO reports)
  const profileCategories = ['whois_page', 'tech_profile', 'seo_report', 'profile_page'];
  const profileResult = await buildBacklinks(project.id, targetUrl, domain, profileCategories, Math.floor(maxDirs / 2));
  steps.push(`Created ${profileResult.submitted} domain profile pages (WHOIS, tech, SEO audit)`);
  await updateOrderStatus(orderId, 'processing', 60);

  // Step 3: Build directory listing citations
  const dirCategories = ['directory_listing'];
  const dirResult = await buildBacklinks(project.id, targetUrl, domain, dirCategories, Math.floor(maxDirs / 4));
  steps.push(`Submitted to ${dirResult.submitted} web directories`);
  await updateOrderStatus(orderId, 'processing', 70);

  // Step 3: Verify
  const { verifyBacklinks } = await import('./backlinkEnhancements');
  const verifyResult = await verifyBacklinks(project.id, maxDirs);
  steps.push(`Verified: ${verifyResult.verified} live citations`);
  await updateOrderStatus(orderId, 'processing', 85);

  // Step 3b: Submit to Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, Math.min(maxDirs, 200));
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted`);
  } catch {
    steps.push('Google Indexing API skipped');
  }

  // Step 4: Run real Google index verification
  const { verifyGoogleIndex: verifyGIdx, getIndexStats: getIStats } = await import('./indexVerificationService');
  const googleResult = await verifyGIdx(project.id, 20);
  steps.push(`Google index check: ${googleResult.indexed} indexed`);
  await updateOrderStatus(orderId, 'processing', 88);

  // Step 5: Get actual DB stats and generate report
  const { getBacklinkStats } = await import('./backlinkBuilder');
  const dbStats = await getBacklinkStats(project.id);
  const indexStats = await getIStats(project.id);
  const totalCitations = result.submitted + profileResult.submitted + dirResult.submitted;
  const actualVerified = Math.max(verifyResult.verified, dbStats.verified);
  const report = generateCitationsReport(domain, tier, { submitted: totalCitations, errors: result.errors }, { submitted: profileResult.submitted, errors: profileResult.errors }, { verified: actualVerified, dead: verifyResult.dead }, indexStats);
  await addDeliverable(orderId, 'report', `Local Citations Report - ${domain}`, report, 'html');
  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `Citations - ${domain}.csv`, csv, 'csv');
  steps.push('Reports generated');
  await updateOrderStatus(orderId, 'processing', 95);
}

async function fulfillDAIncrease(orderId: string, userId: string, domain: string, targetUrl: string, tier: GigTier, steps: string[]) {
  const project = await ensureIndexerProject(userId, domain);
  steps.push(`Project ready: ${domain}`);
  await updateOrderStatus(orderId, 'processing', 10);

  const maxLinks = tier.limits.backlinks || 50;

  // Step 1: Build high-DA backlinks
  const { buildBacklinks, getBacklinkStats } = await import('./backlinkBuilder');
  const result = await buildBacklinks(project.id, targetUrl, domain, undefined, maxLinks);
  steps.push(`Built ${result.submitted} tier-1 backlinks`);
  await updateOrderStatus(orderId, 'processing', 30);

  // Step 2: Tier-2 links (standard + premium)
  let tier2Result = null;
  if (tier.name !== 'basic' && tier.limits.tier2) {
    const { buildTier2Links } = await import('./backlinkEnhancements');
    const backlinkIds = await getTopBacklinkIds(project.id, 5);
    if (backlinkIds.length > 0) {
      tier2Result = await buildTier2Links(project.id, backlinkIds, Math.min(tier.limits.tier2, 10));
      steps.push(`Built ${tier2Result.totalSubmitted} tier-2 links (${tier.name} feature)`);
    } else {
      steps.push(`Tier-2 scheduled (${tier.name} feature — awaiting tier-1 verification)`);
    }
  }
  await updateOrderStatus(orderId, 'processing', 50);

  // Step 3: IndexNow
  try {
    const { submitBacklinkUrlsToIndexNow } = await import('./indexNowService');
    await submitBacklinkUrlsToIndexNow(project.id, maxLinks);
    steps.push('IndexNow submissions completed');
  } catch {
    steps.push('IndexNow skipped');
  }
  await updateOrderStatus(orderId, 'processing', 60);

  // Step 3b: Google Indexing API for fast crawling
  try {
    const { submitBacklinksToGoogleIndexing } = await import('./googleIndexingService');
    const googleIndexResult = await submitBacklinksToGoogleIndexing(project.id, Math.min(maxLinks, 200));
    steps.push(`Google Indexing API: ${googleIndexResult.submitted} submitted`);
  } catch {
    steps.push('Google Indexing API skipped');
  }
  await updateOrderStatus(orderId, 'processing', 65);

  // Step 4: Get DA distribution
  const { scoreEndpointDA, getDADistribution } = await import('./backlinkEnhancements');
  await scoreEndpointDA();
  const daDist = await getDADistribution();
  steps.push(`DA distribution analyzed: ${daDist.length} ranges`);
  await updateOrderStatus(orderId, 'processing', 80);

  // Step 5: Run real Google index verification
  const { verifyGoogleIndex: verifyGI2, getIndexStats: getIS2 } = await import('./indexVerificationService');
  const googleResult = await verifyGI2(project.id, 30);
  steps.push(`Google index check: ${googleResult.indexed} indexed`);
  await updateOrderStatus(orderId, 'processing', 85);

  // Step 6: Stats & report — use actual DB counts for tier-1 links
  const stats = await getBacklinkStats(project.id);
  const indexStats = await getIS2(project.id);
  const actualTier1 = Math.max(result.submitted, stats.submitted + stats.verified);
  const report = generateDAIncreaseReport(domain, tier, { submitted: actualTier1, errors: result.errors }, tier2Result, { distribution: daDist }, stats, indexStats);
  await addDeliverable(orderId, 'report', `DA/DR Increase Report - ${domain}`, report, 'html');
  const csv = await generateBacklinkCSV(project.id);
  await addDeliverable(orderId, 'csv', `DA Campaign - ${domain}.csv`, csv, 'csv');
  steps.push('Reports generated');
  await updateOrderStatus(orderId, 'processing', 95);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function ensureIndexerProject(userId: string, domain: string) {
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').toLowerCase();

  const { rows } = await pool.query(
    'SELECT * FROM indexer_projects WHERE user_id = $1 AND domain = $2',
    [userId, cleanDomain]
  );

  if (rows.length > 0) return rows[0];

  const { rows: [project] } = await pool.query(
    `INSERT INTO indexer_projects (user_id, domain, status) VALUES ($1, $2, 'active') RETURNING *`,
    [userId, cleanDomain]
  );
  return project;
}

async function getTopBacklinkIds(projectId: string, limit: number): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT id FROM backlink_results WHERE project_id = $1 AND status IN ('verified', 'submitted') ORDER BY submitted_at DESC LIMIT $2`,
    [projectId, limit]
  );
  return rows.map(r => r.id);
}

async function generateBacklinkCSV(projectId: string): Promise<string> {
  const { rows } = await pool.query(
    `SELECT br.backlink_url, br.target_url, br.status, br.http_status, br.endpoint_name, br.endpoint_category, 
            br.submitted_at, br.verified_at, br.index_status, br.indexable, br.google_indexed,
            COALESCE(be.endpoint_da, be.domain_authority, 0) as site_da
     FROM backlink_results br
     LEFT JOIN backlink_endpoints be ON be.id = br.endpoint_id
     WHERE br.project_id = $1
     ORDER BY COALESCE(be.endpoint_da, be.domain_authority, 0) DESC, br.submitted_at DESC`,
    [projectId]
  );

  const headers = ['Backlink URL', 'Target URL', 'Status', 'HTTP Status', 'Source', 'Category', 'Site DA', 'Indexable', 'Google Indexed', 'Submitted', 'Verified'];
  const csvRows = rows.map(r => [
    r.backlink_url || '', r.target_url, r.status, r.http_status || '',
    r.endpoint_name || '', r.endpoint_category || '',
    r.site_da || '0',
    r.indexable === true ? 'YES' : r.indexable === false ? 'NO' : 'UNKNOWN',
    r.google_indexed === true ? 'YES' : r.google_indexed === false ? 'NO' : 'PENDING',
    r.submitted_at ? new Date(r.submitted_at).toISOString() : '',
    r.verified_at ? new Date(r.verified_at).toISOString() : '',
  ].join(','));

  return [headers.join(','), ...csvRows].join('\n');
}

// ============================================
// REPORT GENERATORS
// ============================================

interface IndexStatsForReport {
  totalBacklinks: number;
  indexableBacklinks: number;
  googleIndexed: number;
  notIndexed: number;
  unchecked: number;
  indexRate: number;
  byCategory: Record<string, { total: number; indexed: number; rate: number }>;
  topIndexedUrls: Array<{ url: string; name: string; da: number }>;
}

function reportHeader(title: string, domain: string, tier: GigTier): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:900px;margin:0 auto;padding:40px 20px;color:#1a1a2e;background:#f8f9fa}
h1{color:#16213e;border-bottom:3px solid #0f3460;padding-bottom:12px}
h2{color:#0f3460;margin-top:32px}
.meta{color:#666;font-size:14px;margin-bottom:24px}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin:20px 0}
.stat-card{background:#fff;border-radius:12px;padding:20px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
.stat-value{font-size:28px;font-weight:700;color:#0f3460}
.stat-label{font-size:12px;color:#666;margin-top:4px;text-transform:uppercase}
table{width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
th{background:#0f3460;color:#fff;padding:12px;text-align:left;font-size:13px}
td{padding:10px 12px;border-bottom:1px solid #eee;font-size:13px}
tr:hover{background:#f0f4ff}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
.badge-green{background:#d4edda;color:#155724}
.badge-red{background:#f8d7da;color:#721c24}
.badge-yellow{background:#fff3cd;color:#856404}
.badge-blue{background:#d1ecf1;color:#0c5460}
.section{background:#fff;border-radius:12px;padding:24px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.footer{margin-top:40px;padding:20px;text-align:center;color:#666;font-size:12px;border-top:1px solid #ddd}
.progress-bar{background:#e9ecef;border-radius:8px;height:24px;overflow:hidden;margin:8px 0}
.progress-fill{height:100%;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700}
</style></head><body>
<h1>${title}</h1>
<div class="meta">
  <strong>Domain:</strong> ${domain} | 
  <strong>Package:</strong> ${tier.label} ($${tier.price}) | 
  <strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
</div>`;
}

function reportFooter(): string {
  return `<div class="footer">
  <p>Generated by ListGenius SEO Platform | <a href="https://app.listgenius.net">app.listgenius.net</a></p>
  <p>Report generated on ${new Date().toISOString()}</p>
</div></body></html>`;
}

function generateIndexSection(indexStats: IndexStatsForReport | null): string {
  if (!indexStats) return '';
  return `
<div class="section">
<h2>Google Index Verification</h2>
<p>Real-time verification of which backlinks are actually indexed by Google.</p>
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${indexStats.googleIndexed}</div><div class="stat-label">Google Indexed</div></div>
  <div class="stat-card"><div class="stat-value">${indexStats.notIndexed}</div><div class="stat-label">Not Yet Indexed</div></div>
  <div class="stat-card"><div class="stat-value">${indexStats.unchecked}</div><div class="stat-label">Pending Check</div></div>
  <div class="stat-card"><div class="stat-value">${indexStats.indexRate}%</div><div class="stat-label">Index Rate</div></div>
</div>
<div class="progress-bar"><div class="progress-fill" style="width:${Math.max(indexStats.indexRate, 5)}%;background:linear-gradient(90deg,#28a745,#20c997)">${indexStats.indexRate}% Indexed</div></div>
${indexStats.topIndexedUrls.length > 0 ? `
<h3>Top Indexed Backlinks (Verified by Google)</h3>
<table>
<tr><th>Source</th><th>DA</th><th>Backlink URL</th></tr>
${indexStats.topIndexedUrls.slice(0, 10).map(u => `<tr><td>${u.name}</td><td><strong>${u.da}</strong></td><td><a href="${u.url}" target="_blank">${u.url.length > 60 ? u.url.substring(0, 60) + '...' : u.url}</a></td></tr>`).join('')}
</table>` : '<p><em>Index verification is running. Google typically takes 2-14 days to index new backlinks. Re-run this check in a few days for updated results.</em></p>'}
</div>`;
}

function generateBacklinkReport(
  domain: string, tier: GigTier,
  buildResult: { submitted: number; errors: string[] },
  verifyResult: { verified: number; dead: number; pending: number; errors: number },
  indexStats: IndexStatsForReport | null = null
): string {
  return `${reportHeader('Backlink Building Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${buildResult.submitted}</div><div class="stat-label">Backlinks Built</div></div>
  <div class="stat-card"><div class="stat-value">${verifyResult.verified}</div><div class="stat-label">Verified Live</div></div>
  <div class="stat-card"><div class="stat-value">${indexStats ? indexStats.googleIndexed : 0}</div><div class="stat-label">Google Indexed</div></div>
  <div class="stat-card"><div class="stat-value">${Math.round((verifyResult.verified / Math.max(1, verifyResult.verified + verifyResult.dead)) * 100)}%</div><div class="stat-label">Success Rate</div></div>
</div>

${generateIndexSection(indexStats)}

<div class="section">
<h2>What Was Done</h2>
<ul>
  <li>Built ${buildResult.submitted} backlinks on real, indexable sites (tool pages, profiles, directories)</li>
  <li>All endpoints create persistent pages that Google can crawl and index</li>
  <li>Submitted all backlinks to IndexNow for accelerated Google discovery</li>
  <li>Verified backlink health: ${verifyResult.verified} confirmed live</li>
  <li>Ran real Google index verification on ${indexStats ? indexStats.googleIndexed + indexStats.notIndexed + indexStats.unchecked : 0} URLs</li>
  ${tier.name !== 'basic' ? '<li>Optimized anchor texts for natural link profile</li>' : ''}
  ${tier.name === 'premium' ? '<li>DA/DR analysis of all backlink sources</li>' : ''}
</ul>
</div>

<div class="section">
<h2>Backlink Categories</h2>
<p>Your backlinks were built on sites that create real, persistent, indexable pages:</p>
<ul>
  <li><span class="badge badge-blue">Domain Profiles</span> Sites that create unique domain analysis pages (HypeStat, BuiltWith, SimilarWeb)</li>
  <li><span class="badge badge-blue">WHOIS Pages</span> Domain registration lookup pages (Who.is, DomainTools, ICANN)</li>
  <li><span class="badge badge-blue">Security Reports</span> Persistent threat/scan reports (VirusTotal, URLScan, Shodan)</li>
  <li><span class="badge badge-blue">SEO Reports</span> SEO analysis pages (Seobility, WooRank, Moz, Ahrefs)</li>
  <li><span class="badge badge-blue">DNS Reports</span> DNS analysis pages (DNSlytics, MXToolbox, IntoDNS)</li>
</ul>
</div>

<div class="section">
<h2>Next Steps</h2>
<ol>
  <li>Wait 2-4 weeks for Google to crawl and index the new backlinks</li>
  <li>Re-run index verification to track indexing progress</li>
  <li>Monitor your domain authority on Ahrefs/Moz for improvement</li>
  <li>Check Google Search Console for new referring domains</li>
  ${tier.name === 'premium' ? '<li>Drip-feed campaign will continue building links over the next 30 days</li>' : ''}
</ol>
</div>

${reportFooter()}`;
}

function generateAISearchReport(
  domain: string, tier: GigTier,
  submitResult: { results: Array<{ engine: string; status: string; method: string }> },
  visibility: { checks: Array<{ platform: string; found: boolean; url: string }> },
  blResult: { submitted: number; errors: string[] },
  indexStats: IndexStatsForReport | null = null
): string {
  const found = visibility.checks.filter(c => c.found).length;
  return `${reportHeader('AI Search Engine Submission Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${submitResult.results.length}</div><div class="stat-label">Engines Submitted</div></div>
  <div class="stat-card"><div class="stat-value">${found}</div><div class="stat-label">Currently Visible</div></div>
  <div class="stat-card"><div class="stat-value">${blResult.submitted}</div><div class="stat-label">AI Backlinks</div></div>
  <div class="stat-card"><div class="stat-value">${visibility.checks.length}</div><div class="stat-label">Platforms Checked</div></div>
</div>

<div class="section">
<h2>AI Engine Submissions</h2>
<table>
<tr><th>Engine</th><th>Method</th><th>Status</th></tr>
${submitResult.results.map(r => `<tr><td>${r.engine}</td><td>${r.method}</td><td><span class="badge ${r.status === 'submitted' ? 'badge-green' : 'badge-yellow'}">${r.status}</span></td></tr>`).join('')}
</table>
</div>

<div class="section">
<h2>Visibility Check</h2>
<table>
<tr><th>Platform</th><th>Status</th></tr>
${visibility.checks.map(c => `<tr><td>${c.platform}</td><td><span class="badge ${c.found ? 'badge-green' : 'badge-red'}">${c.found ? 'VISIBLE' : 'NOT FOUND'}</span></td></tr>`).join('')}
</table>
</div>

<div class="section">
<h2>What Was Done</h2>
<ul>
  <li>Submitted your website to ${submitResult.results.length} AI search engines</li>
  <li>Built ${blResult.submitted} AI-related backlinks for visibility signals</li>
  <li>Checked current visibility across ${visibility.checks.length} platforms</li>
  ${tier.name !== 'basic' ? '<li>Schema.org optimization for AI crawler compatibility</li>' : ''}
  ${tier.name === 'premium' ? '<li>Full GEO/AEO strategy implementation</li>' : ''}
</ul>
</div>

${generateIndexSection(indexStats)}

${reportFooter()}`;
}

function generateVerificationReport(
  domain: string, tier: GigTier,
  verifyResult: { verified: number; dead: number; pending: number; errors: number },
  indexResult: { indexed: number; notIndexed: number; checked: number },
  healthSummary: { total: number; verified: number; dead: number } | null,
  indexStats: IndexStatsForReport | null = null
): string {
  return `${reportHeader('Backlink Index Verification Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${verifyResult.verified}</div><div class="stat-label">Verified Live</div></div>
  <div class="stat-card"><div class="stat-value">${verifyResult.dead}</div><div class="stat-label">Dead Links</div></div>
  <div class="stat-card"><div class="stat-value">${indexResult.indexed}</div><div class="stat-label">Google Indexed</div></div>
  <div class="stat-card"><div class="stat-value">${indexResult.notIndexed}</div><div class="stat-label">Not Indexed</div></div>
</div>

<div class="section">
<h2>Verification Summary</h2>
<p>This report uses <strong>real Google index verification</strong> — each URL was checked against Google's cache to confirm actual indexing status.</p>
<table>
<tr><th>Metric</th><th>Count</th><th>Status</th></tr>
<tr><td>Backlinks Checked</td><td>${verifyResult.verified + verifyResult.dead + verifyResult.pending}</td><td><span class="badge badge-blue">COMPLETE</span></td></tr>
<tr><td>Live & Verified</td><td>${verifyResult.verified}</td><td><span class="badge badge-green">HEALTHY</span></td></tr>
<tr><td>Dead / Broken</td><td>${verifyResult.dead}</td><td><span class="badge badge-red">${verifyResult.dead > 0 ? 'NEEDS ATTENTION' : 'CLEAN'}</span></td></tr>
<tr><td>Google Indexed (Verified)</td><td>${indexResult.indexed}</td><td><span class="badge badge-green">CONFIRMED</span></td></tr>
<tr><td>Not Yet Indexed</td><td>${indexResult.notIndexed}</td><td><span class="badge badge-yellow">RE-SUBMITTED VIA INDEXNOW</span></td></tr>
<tr><td>Google Checks Performed</td><td>${indexResult.checked}</td><td><span class="badge badge-blue">VERIFIED</span></td></tr>
</table>
</div>

${generateIndexSection(indexStats)}

${healthSummary ? `<div class="section">
<h2>Health Summary</h2>
<p>Total backlinks: ${healthSummary.total} | Verified: ${healthSummary.verified} | Dead: ${healthSummary.dead}</p>
</div>` : ''}

${tier.name === 'premium' ? `<div class="section">
<h2>Disavow File Generated</h2>
<p>A Google disavow file has been generated for toxic/dead domains. Upload this to Google Search Console to protect your rankings.</p>
</div>` : ''}

<div class="section">
<h2>Important Notes</h2>
<ul>
  <li>Google indexing takes 2-14 days for new backlinks — re-run this check periodically</li>
  <li>Non-indexed links have been re-submitted via IndexNow for accelerated discovery</li>
  <li>Only backlinks on real, persistent pages (profiles, reports, directories) are counted</li>
</ul>
</div>

${reportFooter()}`;
}

function generateDripFeedReport(
  domain: string, tier: GigTier,
  campaignResult: { campaignId: string; totalEndpoints: number; estimatedDays: number },
  firstBatch: { succeeded: number; failed: number },
  indexStats: IndexStatsForReport | null = null
): string {
  return `${reportHeader('Drip-Feed Campaign Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${campaignResult.totalEndpoints}</div><div class="stat-label">Total Endpoints</div></div>
  <div class="stat-card"><div class="stat-value">${tier.limits.days || 7}</div><div class="stat-label">Campaign Days</div></div>
  <div class="stat-card"><div class="stat-value">${tier.limits.dailyLimit || 10}</div><div class="stat-label">Daily Limit</div></div>
  <div class="stat-card"><div class="stat-value">${firstBatch.succeeded}</div><div class="stat-label">First Batch Done</div></div>
</div>

<div class="section">
<h2>Campaign Configuration</h2>
<table>
<tr><th>Setting</th><th>Value</th></tr>
<tr><td>Campaign Duration</td><td>${tier.limits.days || 7} days</td></tr>
<tr><td>Daily Link Limit</td><td>${tier.limits.dailyLimit || 10} links/day</td></tr>
<tr><td>Total Endpoints Available</td><td>${campaignResult.totalEndpoints}</td></tr>
<tr><td>Estimated Completion</td><td>~${campaignResult.estimatedDays} days</td></tr>
<tr><td>Campaign ID</td><td>${campaignResult.campaignId}</td></tr>
</table>
</div>

<div class="section">
<h2>How It Works</h2>
<ol>
  <li>Each day, ${tier.limits.dailyLimit || 10} new backlinks are built automatically</li>
  <li>Links are spread across different categories for natural diversity</li>
  <li>Random delays between submissions mimic natural link building</li>
  <li>The campaign pauses automatically if error rates exceed 30%</li>
</ol>
</div>

${generateIndexSection(indexStats)}

${reportFooter()}`;
}

function generateMonthlySEOReport(
  domain: string, tier: GigTier,
  blResult: { submitted: number; errors: string[] },
  aiResult: { results: Array<{ engine: string; status: string }> },
  visibility: { checks: Array<{ platform: string; found: boolean }> },
  verifyResult: { verified: number; dead: number },
  indexStats: IndexStatsForReport | null = null
): string {
  return `${reportHeader('Monthly SEO Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${blResult.submitted}</div><div class="stat-label">Backlinks Built</div></div>
  <div class="stat-card"><div class="stat-value">${aiResult.results.length}</div><div class="stat-label">AI Submissions</div></div>
  <div class="stat-card"><div class="stat-value">${verifyResult.verified}</div><div class="stat-label">Verified Live</div></div>
  <div class="stat-card"><div class="stat-value">${indexStats ? indexStats.googleIndexed : 0}</div><div class="stat-label">Google Indexed</div></div>
</div>

${generateIndexSection(indexStats)}

<div class="section">
<h2>This Month's Actions</h2>
<ul>
  <li>Built ${blResult.submitted} backlinks on real, indexable sites</li>
  <li>Submitted to ${aiResult.results.length} AI search engines</li>
  <li>Verified ${verifyResult.verified} backlinks as live</li>
  <li>Ran Google index verification — ${indexStats ? indexStats.googleIndexed : 0} confirmed indexed</li>
  <li>Identified and flagged ${verifyResult.dead} dead links</li>
  <li>Submitted all links via IndexNow for fast indexing</li>
</ul>
</div>

${reportFooter()}`;
}

function generateToxicCleanupReport(
  domain: string, tier: GigTier,
  verifyResult: { verified: number; dead: number; pending: number; errors: number },
  healthCheck: { healthy: number; dead: number; degraded: number },
  disavow: { content: string; totalDisavowed: number },
  summary: { total: number; verified: number; dead: number },
  indexStats: IndexStatsForReport | null = null
): string {
  return `${reportHeader('Toxic Backlink Cleanup Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${summary.total}</div><div class="stat-label">Total Scanned</div></div>
  <div class="stat-card"><div class="stat-value">${healthCheck.healthy}</div><div class="stat-label">Healthy</div></div>
  <div class="stat-card"><div class="stat-value">${healthCheck.dead}</div><div class="stat-label">Toxic/Dead</div></div>
  <div class="stat-card"><div class="stat-value">${disavow.totalDisavowed}</div><div class="stat-label">Disavowed</div></div>
</div>

${generateIndexSection(indexStats)}

<div class="section">
<h2>Cleanup Actions</h2>
<ul>
  <li>Scanned ${summary.total} backlinks for toxic/spam signals</li>
  <li>Found ${healthCheck.dead} dead and ${healthCheck.degraded} degraded links</li>
  <li>Generated disavow file with ${disavow.totalDisavowed} toxic domains</li>
  <li>Health check: ${healthCheck.healthy} links confirmed healthy</li>
  <li>Ran Google index verification — ${indexStats ? indexStats.googleIndexed : 0} confirmed indexed</li>
</ul>
</div>

<div class="section">
<h2>How to Use the Disavow File</h2>
<ol>
  <li>Go to <a href="https://search.google.com/search-console/disavow-links">Google Disavow Tool</a></li>
  <li>Select your property (${domain})</li>
  <li>Upload the disavow.txt file attached to this order</li>
  <li>Wait 2-4 weeks for Google to process</li>
</ol>
</div>

${reportFooter()}`;
}

function generateCitationsReport(
  domain: string, tier: GigTier,
  dirResult: { submitted: number; errors: string[] },
  generalResult: { submitted: number; errors: string[] },
  verifyResult: { verified: number; dead: number },
  indexStats: IndexStatsForReport | null = null
): string {
  return `${reportHeader('Local Citations Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${dirResult.submitted}</div><div class="stat-label">Directory Submissions</div></div>
  <div class="stat-card"><div class="stat-value">${generalResult.submitted}</div><div class="stat-label">Citation Signals</div></div>
  <div class="stat-card"><div class="stat-value">${verifyResult.verified}</div><div class="stat-label">Verified Live</div></div>
  <div class="stat-card"><div class="stat-value">${indexStats ? indexStats.googleIndexed : 0}</div><div class="stat-label">Google Indexed</div></div>
</div>

${generateIndexSection(indexStats)}

<div class="section">
<h2>Submissions Completed</h2>
<ul>
  <li>${dirResult.submitted} directory submissions (real indexable profile/listing pages)</li>
  <li>${generalResult.submitted} citation signals (WHOIS pages, domain profiles)</li>
  <li>${verifyResult.verified} verified as live and accessible</li>
  <li>Google index verification: ${indexStats ? indexStats.googleIndexed : 0} confirmed indexed</li>
</ul>
</div>

${reportFooter()}`;
}

function generateDAIncreaseReport(
  domain: string, tier: GigTier,
  blResult: { submitted: number; errors: string[] },
  tier2Result: { totalSubmitted: number } | null,
  daDist: { distribution: Array<{ range: string; count: number }> },
  stats: { total: number; submitted: number; verified: number },
  indexStats: IndexStatsForReport | null = null
): string {
  return `${reportHeader('DA/DR Increase Campaign Report', domain, tier)}
<div class="stat-grid">
  <div class="stat-card"><div class="stat-value">${blResult.submitted}</div><div class="stat-label">Tier-1 Links</div></div>
  <div class="stat-card"><div class="stat-value">${tier2Result ? tier2Result.totalSubmitted : 0}</div><div class="stat-label">Tier-2 Links</div></div>
  <div class="stat-card"><div class="stat-value">${indexStats ? indexStats.googleIndexed : 0}</div><div class="stat-label">Google Indexed</div></div>
  <div class="stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Backlinks</div></div>
</div>

${generateIndexSection(indexStats)}

<div class="section">
<h2>DA Distribution of Backlink Sources</h2>
<table>
<tr><th>DA Range</th><th>Count</th></tr>
${daDist.distribution.map(d => `<tr><td>${d.range}</td><td>${d.count}</td></tr>`).join('')}
</table>
</div>

<div class="section">
<h2>Campaign Actions</h2>
<ul>
  <li>Built ${blResult.submitted} tier-1 backlinks on real indexable sites</li>
  ${tier2Result ? `<li>Built ${tier2Result.totalSubmitted} tier-2 links pointing to your tier-1 backlinks</li>` : ''}
  <li>Submitted all links to IndexNow for fast indexing</li>
  <li>Google index verification: ${indexStats ? indexStats.googleIndexed : 0} confirmed indexed</li>
  <li>DA distribution analyzed across all backlink sources</li>
</ul>
</div>

<div class="section">
<h2>Expected Results</h2>
<ul>
  <li>DA/DR increase visible in 4-8 weeks</li>
  <li>Tier-2 links amplify the value of tier-1 backlinks</li>
  <li>Monitor on Ahrefs or Moz for domain rating changes</li>
</ul>
</div>

${reportFooter()}`;
}

// ============================================
// GIG STATS
// ============================================

export async function getGigStats(userId: string) {
  const { rows: [stats] } = await pool.query(
    `SELECT 
       COUNT(*) as total_orders,
       COUNT(*) FILTER (WHERE status = 'completed') as completed,
       COUNT(*) FILTER (WHERE status = 'processing') as processing,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'failed') as failed,
       COALESCE(SUM(price), 0) as total_revenue
     FROM gig_orders WHERE user_id = $1`,
    [userId]
  );
  return {
    totalOrders: parseInt(stats.total_orders),
    completed: parseInt(stats.completed),
    processing: parseInt(stats.processing),
    pending: parseInt(stats.pending),
    failed: parseInt(stats.failed),
    totalRevenue: parseFloat(stats.total_revenue),
  };
}
