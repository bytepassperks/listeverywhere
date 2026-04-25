# ListEverywhere

Universal startup directory submission automation SaaS.

Submit your startup to 1000+ directories automatically. Crawl, extract, generate, and submit — all in one pipeline.

## Features

- **Firecrawl Integration** — Automatically crawl any website and extract structured content
- **AI Metadata Extraction** — Extract company name, tagline, description, categories, social links using Claude
- **Screenshot Generation** — Headless Playwright captures homepage, features, and pricing pages
- **Category Intelligence** — Maps your categories to each directory's taxonomy
- **4 Submission Modes**:
  - **API** — Direct API submission for supported directories
  - **Auto Form** — Playwright fills and submits web forms automatically
  - **Manual Kit** — Copy-paste kit with instructions for protected directories
  - **Editorial Email** — Pre-written email drafts with Gmail integration
- **20x Parallel Workers** — BullMQ worker pool processes submissions concurrently
- **Retry Engine** — 3 automatic retries with exponential backoff, then manual fallback
- **Weekly Auto-Updates** — Cron recrawls, detects changes, regenerates payloads
- **Bulk Agency Mode** — CSV upload for processing multiple companies
- **24+ Directories** seeded, scalable to 1000+
- **JWT Authentication** — Signup, login, logout
- **Proxy-Ready Architecture** — Placeholder for proxy rotation
- **CAPTCHA-Ready Architecture** — Interface for solver integration

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Fastify, TypeScript |
| Frontend | Next.js App Router, TailwindCSS |
| Database | PostgreSQL |
| Queue | Redis, BullMQ |
| Automation | Playwright |
| Crawler | Firecrawl API |
| AI | PageGrid (Claude) |
| Deployment | Render.com |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### Setup

```bash
# Install all dependencies
npm run install:all

# Copy environment file
cp .env.example backend/.env

# Edit backend/.env with your credentials:
# DATABASE_URL, REDIS_URL, FIRECRAWL_API_KEY, AI_API_KEY

# Run database migrations
cd backend && npm run db:migrate

# Seed directory dataset (24+ directories)
npm run db:seed

# Start development
cd .. && npm run dev
```

### Commands

```bash
npm run dev          # Start frontend + backend
npm run workers      # Start BullMQ submission workers
npm run cron         # Start weekly update cron job
npm run build        # Build both frontend and backend
```

### Individual Services

```bash
npm run dev:backend   # Fastify API on port 3001
npm run dev:frontend  # Next.js on port 3000
```

## Architecture

```
User enters website URL + email
        ↓
Firecrawl site crawl (15 pages)
        ↓
AI structured metadata extraction (Claude)
        ↓
Screenshot generation (Playwright)
        ↓
Category intelligence mapping
        ↓
Directory payload generator (per-directory)
        ↓
Parallel submission workers (20 concurrent)
        ↓
Manual submission kits
        ↓
Editorial email kits
        ↓
Status tracker dashboard
        ↓
Weekly auto-update engine
```

## Deployment (Render)

This project includes a `render.yaml` for Infrastructure-as-Code deployment:

- **Web Service**: Next.js frontend
- **API Service**: Fastify backend
- **Worker Service**: BullMQ submission workers
- **Cron Service**: Weekly updater
- **PostgreSQL Database**
- **Redis**

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `FIRECRAWL_API_KEY` | Firecrawl API key |
| `AI_API_KEY` | PageGrid/Anthropic API key |
| `AI_API_BASE_URL` | AI API base URL |
| `AI_MODEL` | AI model name |
| `JWT_SECRET` | JWT signing secret |
| `PORT` | Backend port (default: 3001) |
| `FRONTEND_URL` | Frontend URL for CORS |

## License

MIT
