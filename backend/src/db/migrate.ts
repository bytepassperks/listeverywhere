import { pool } from './pool';

const migration = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_company_id ON submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_submissions_directory_id ON submissions(directory_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_screenshots_company_id ON screenshots(company_id);
`;

async function migrate() {
  console.log('Running database migrations...');
  try {
    await pool.query(migration);
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
