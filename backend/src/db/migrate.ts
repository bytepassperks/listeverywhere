import { pool } from './pool';

const migration = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add role column if it doesn't exist (for existing databases)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(500) NOT NULL,
  support_email VARCHAR(255),
  tagline VARCHAR(500),
  description_short TEXT,
  description_long TEXT,
  logo_url TEXT,
  categories JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  pricing_model VARCHAR(100),
  founded_year INTEGER,
  raw_crawl_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Directories
CREATE TABLE IF NOT EXISTS directories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  submit_url TEXT NOT NULL,
  submission_type VARCHAR(50) NOT NULL CHECK (submission_type IN ('api', 'auto_form', 'manual', 'editorial_email')),
  title_limit INTEGER,
  desc_limit INTEGER,
  requires_logo BOOLEAN DEFAULT false,
  requires_screenshot BOOLEAN DEFAULT false,
  requires_category BOOLEAN DEFAULT false,
  api_endpoint TEXT,
  category_taxonomy JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  directory_id UUID NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN (
    'queued', 'auto_submitted', 'manual_ready', 'email_ready',
    'submitted', 'approved', 'rejected', 'retrying', 'manual_required'
  )),
  payload JSONB DEFAULT '{}'::jsonb,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_log TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, directory_id)
);

-- Screenshots
CREATE TABLE IF NOT EXISTS screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('homepage', 'features', 'pricing')),
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Subscriptions (billing-ready)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  credits INTEGER DEFAULT 0,
  expiry TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Directory candidates (auto-expansion)
CREATE TABLE IF NOT EXISTS directory_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_url TEXT NOT NULL UNIQUE,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'added')),
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXER MODULE TABLES
-- ============================================

-- Indexer Projects (websites connected for indexing)
CREATE TABLE IF NOT EXISTS indexer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(500) NOT NULL,
  sitemap_url TEXT,
  gsc_property_id VARCHAR(500),
  gsc_access_token TEXT,
  gsc_refresh_token TEXT,
  indexnow_key VARCHAR(255),
  auto_index BOOLEAN DEFAULT true,
  sync_frequency VARCHAR(50) DEFAULT 'daily' CHECK (sync_frequency IN ('hourly', 'twice_daily', 'daily')),
  last_sitemap_sync TIMESTAMP WITH TIME ZONE,
  last_index_check TIMESTAMP WITH TIME ZONE,
  total_urls INTEGER DEFAULT 0,
  indexed_count INTEGER DEFAULT 0,
  not_indexed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexer URLs (individual URLs tracked per project)
CREATE TABLE IF NOT EXISTS indexer_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES indexer_projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  index_status VARCHAR(50) DEFAULT 'unknown' CHECK (index_status IN (
    'unknown', 'indexed', 'not_indexed', 'crawled_not_indexed',
    'discovered_not_crawled', 'submitted', 'error'
  )),
  last_checked TIMESTAMP WITH TIME ZONE,
  last_submitted TIMESTAMP WITH TIME ZONE,
  last_crawled TIMESTAMP WITH TIME ZONE,
  submit_count INTEGER DEFAULT 0,
  source VARCHAR(50) DEFAULT 'sitemap' CHECK (source IN ('sitemap', 'gsc', 'manual', 'crawler')),
  canonical_url TEXT,
  error_detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, url)
);

-- Indexer Submission Queue (URLs queued for indexing submission)
CREATE TABLE IF NOT EXISTS indexer_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id UUID NOT NULL REFERENCES indexer_urls(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES indexer_projects(id) ON DELETE CASCADE,
  method VARCHAR(50) NOT NULL CHECK (method IN ('gsc_api', 'indexnow', 'ping', 'sitemap_refresh')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backlink Endpoints (database of sites that create backlinks when you submit URL)
CREATE TABLE IF NOT EXISTS backlink_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500),
  url_template TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general' CHECK (category IN (
    'whois', 'seo_analyzer', 'speed_test', 'security_scan',
    'web_archive', 'ping_service', 'directory', 'social_bookmark',
    'website_info', 'dns_lookup', 'general', 'llm_indexing'
  )),
  domain_authority INTEGER,
  is_dofollow BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  last_verified TIMESTAMP WITH TIME ZONE,
  success_rate REAL DEFAULT 0,
  avg_response_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backlink Results (tracking backlinks created for user's URLs)
CREATE TABLE IF NOT EXISTS backlink_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES indexer_projects(id) ON DELETE CASCADE,
  endpoint_id UUID REFERENCES backlink_endpoints(id) ON DELETE SET NULL,
  endpoint_name VARCHAR(500),
  endpoint_category VARCHAR(100),
  target_url TEXT NOT NULL,
  backlink_url TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'verified', 'dead', 'error')),
  http_status INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexer Activity Log
CREATE TABLE IF NOT EXISTS indexer_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES indexer_projects(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drip-feed Campaigns
CREATE TABLE IF NOT EXISTS indexer_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES indexer_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_limit INTEGER DEFAULT 200,
  duration_days INTEGER DEFAULT 30,
  categories JSONB DEFAULT '[]'::jsonb,
  min_delay_ms INTEGER DEFAULT 30000,
  max_delay_ms INTEGER DEFAULT 300000,
  pause_on_error_rate REAL DEFAULT 0.3,
  total_endpoints INTEGER DEFAULT 0,
  processed_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign Queue (individual endpoint submissions in a drip-feed campaign)
CREATE TABLE IF NOT EXISTS indexer_campaign_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES indexer_campaigns(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES backlink_endpoints(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'failed')),
  http_status INTEGER,
  error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_indexer_campaigns_project_id ON indexer_campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_indexer_campaigns_status ON indexer_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_campaign_id ON indexer_campaign_queue(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_queue_status ON indexer_campaign_queue(status);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_company_id ON submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_submissions_directory_id ON submissions(directory_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_screenshots_company_id ON screenshots(company_id);

-- Indexer indexes
CREATE INDEX IF NOT EXISTS idx_indexer_projects_user_id ON indexer_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_indexer_urls_project_id ON indexer_urls(project_id);
CREATE INDEX IF NOT EXISTS idx_indexer_urls_index_status ON indexer_urls(index_status);
CREATE INDEX IF NOT EXISTS idx_indexer_queue_status ON indexer_queue(status);
CREATE INDEX IF NOT EXISTS idx_indexer_queue_project_id ON indexer_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_backlink_endpoints_active ON backlink_endpoints(active);
CREATE INDEX IF NOT EXISTS idx_backlink_endpoints_category ON backlink_endpoints(category);
CREATE INDEX IF NOT EXISTS idx_backlink_results_project_id ON backlink_results(project_id);
CREATE INDEX IF NOT EXISTS idx_backlink_results_status ON backlink_results(status);
CREATE INDEX IF NOT EXISTS idx_indexer_activity_log_project_id ON indexer_activity_log(project_id);
`;

export async function runMigrations() {
  console.log('Running database migrations...');
  try {
    await pool.query(migration);
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
