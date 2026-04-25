import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/listeverywhere',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_API_BASE_URL: process.env.AI_API_BASE_URL || 'https://api.pagegrid.in',
  AI_MODEL: process.env.AI_MODEL || 'claude-opus-4-6',
  JWT_SECRET: process.env.JWT_SECRET || 'listeverywhere-dev-secret-change-in-production',
  PORT: parseInt(process.env.PORT || '3001', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SCREENSHOTS_DIR: process.env.SCREENSHOTS_DIR || path.resolve(__dirname, '../../screenshots'),
  PROXY_POOL_URL: process.env.PROXY_POOL_URL || '',
};
