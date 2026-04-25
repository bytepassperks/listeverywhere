import { FastifyInstance } from 'fastify';
import { query, queryOne } from '../db/pool';
import { getSubmissionsByCompanyPaginated, getSubmissionStatusCounts, updateSubmissionStatus } from '../services/statusTracker';
import { generateManualKit } from '../services/manualKitGenerator';
import { generateEmailKit } from '../services/emailKitGenerator';
import { generatePayload } from '../services/payloadGenerator';
import { env } from '../config/env';

interface SubmissionRow {
  id: string;
  company_id: string;
  directory_id: string;
  status: string;
  payload: Record<string, unknown>;
  attempt_count: number;
  last_attempt_at: string | null;
  error_log: string | null;
  created_at: string;
  updated_at: string;
  directory_name?: string;
  submit_url?: string;
  submission_type?: string;
}

export async function submissionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preValidation', app.authenticate);

  app.get<{ Params: { companyId: string }; Querystring: { page?: string; limit?: string; status?: string } }>(
    '/api/submissions/:companyId',
    async (request, reply) => {
      const userId = request.userId!;
      const { companyId } = request.params;
      const page = parseInt(request.query.page || '1', 10);
      const limit = Math.min(parseInt(request.query.limit || '50', 10), 200);
      const statusFilter = request.query.status;

      const isSuperAdmin = request.userRole === 'super_admin';
      const company = isSuperAdmin
        ? await queryOne<{ id: string }>('SELECT id FROM companies WHERE id = $1', [companyId])
        : await queryOne<{ id: string }>('SELECT id FROM companies WHERE id = $1 AND user_id = $2', [companyId, userId]);

      if (!company) {
        return reply.status(404).send({ error: 'Company not found' });
      }

      const { submissions, total } = await getSubmissionsByCompanyPaginated(companyId, page, limit, statusFilter);
      const statusCounts = await getSubmissionStatusCounts(companyId);

      return reply.send({
        submissions,
        statusCounts,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  );

  app.patch<{
    Params: { id: string };
    Body: { status: string };
  }>('/api/submissions/:id/status', async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    const { status } = request.body;

    const validStatuses = ['submitted', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return reply.status(400).send({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const isSuperAdmin = request.userRole === 'super_admin';
    const submission = isSuperAdmin
      ? await queryOne<SubmissionRow>('SELECT s.* FROM submissions s WHERE s.id = $1', [id])
      : await queryOne<SubmissionRow>(
          `SELECT s.* FROM submissions s
           JOIN companies c ON s.company_id = c.id
           WHERE s.id = $1 AND c.user_id = $2`,
          [id, userId]
        );

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    await updateSubmissionStatus(id, status as 'submitted' | 'approved' | 'rejected');

    return reply.send({ message: 'Status updated', submission_id: id, new_status: status });
  });

  app.get<{ Params: { id: string } }>('/api/submissions/:id/manual-kit', async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;

    const isSuperAdmin = request.userRole === 'super_admin';
    const submission = isSuperAdmin
      ? await queryOne<SubmissionRow & {
          title_limit: number | null;
          desc_limit: number | null;
          requires_logo: boolean;
          requires_screenshot: boolean;
          requires_category: boolean;
        }>(
          `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type,
                  d.title_limit, d.desc_limit, d.requires_logo, d.requires_screenshot, d.requires_category
           FROM submissions s
           JOIN directories d ON s.directory_id = d.id
           WHERE s.id = $1`,
          [id]
        )
      : await queryOne<SubmissionRow & {
          title_limit: number | null;
          desc_limit: number | null;
          requires_logo: boolean;
          requires_screenshot: boolean;
          requires_category: boolean;
        }>(
          `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type,
                  d.title_limit, d.desc_limit, d.requires_logo, d.requires_screenshot, d.requires_category
           FROM submissions s
           JOIN directories d ON s.directory_id = d.id
           JOIN companies c ON s.company_id = c.id
           WHERE s.id = $1 AND c.user_id = $2`,
          [id, userId]
        );

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    // Always regenerate to include latest fields (form_fields, download URLs, etc.)
    const payload = await generatePayload(submission.company_id, submission.directory_id);
    const requirements = {
      title_limit: submission.title_limit,
      desc_limit: submission.desc_limit,
      requires_logo: submission.requires_logo,
      requires_screenshot: submission.requires_screenshot,
      requires_category: submission.requires_category,
    };

    const protocol = request.headers['x-forwarded-proto'] || 'http';
    const host = request.headers['x-forwarded-host'] || request.headers.host || 'localhost:3001';
    const apiBaseUrl = `${protocol}://${host}`;

    const kit = generateManualKit(payload, requirements, apiBaseUrl);

    await query(
      `UPDATE submissions SET payload = $1, status = 'manual_ready', updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(kit), id]
    );

    return reply.send({ kit });
  });

  app.get<{ Params: { id: string } }>('/api/submissions/:id/email-kit', async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;

    const isSuperAdmin = request.userRole === 'super_admin';
    const submission = isSuperAdmin
      ? await queryOne<SubmissionRow>(
          `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type, d.notes as directory_notes
           FROM submissions s
           JOIN directories d ON s.directory_id = d.id
           WHERE s.id = $1`,
          [id]
        )
      : await queryOne<SubmissionRow>(
          `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type, d.notes as directory_notes
           FROM submissions s
           JOIN directories d ON s.directory_id = d.id
           JOIN companies c ON s.company_id = c.id
           WHERE s.id = $1 AND c.user_id = $2`,
          [id, userId]
        );

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    if (submission.payload && Object.keys(submission.payload).length > 0 && 'email_subject' in submission.payload) {
      return reply.send({ kit: submission.payload });
    }

    const payload = await generatePayload(submission.company_id, submission.directory_id);

    let directoryEmail: string | undefined;
    const notes = (submission as unknown as Record<string, unknown>).directory_notes as string | null;
    if (notes) {
      const emailMatch = notes.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      if (emailMatch) directoryEmail = emailMatch[0];
    }

    const kit = generateEmailKit(payload, directoryEmail);

    await query(
      `UPDATE submissions SET payload = $1, status = 'email_ready', updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(kit), id]
    );

    return reply.send({ kit });
  });

  // In-memory cache for scraped website content (keyed by company_id)
  const websiteCache = new Map<string, { content: string; timestamp: number }>();
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  async function scrapeWebsite(url: string): Promise<string> {
    const pagesToScrape = [url];
    const contactPaths = ['/contact', '/contact-us', '/about', '/about-us', '/support'];
    for (const path of contactPaths) {
      try {
        const fullUrl = new URL(path, url).href;
        pagesToScrape.push(fullUrl);
      } catch { /* ignore bad URLs */ }
    }

    const results: string[] = [];
    const scrapePromises = pagesToScrape.map(async (pageUrl) => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: pageUrl,
            formats: ['markdown'],
          }),
        });
        if (response.ok) {
          const data = await response.json() as { success: boolean; data?: { markdown?: string } };
          if (data.success && data.data?.markdown) {
            return `--- PAGE: ${pageUrl} ---\n${data.data.markdown.slice(0, 8000)}`;
          }
        }
      } catch { /* ignore individual page failures */ }
      return null;
    });

    const scraped = await Promise.all(scrapePromises);
    for (const s of scraped) {
      if (s) results.push(s);
    }
    return results.join('\n\n');
  }

  app.post<{
    Params: { id: string };
    Body: { question: string; history?: Array<{ role: string; content: string }> };
  }>('/api/submissions/:id/ai-assist', async (request, reply) => {
    const userId = request.userId!;
    const { id } = request.params;
    const { question, history } = request.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return reply.status(400).send({ error: 'Question is required' });
    }

    if (!env.AI_API_KEY) {
      return reply.status(500).send({ error: 'AI service is not configured' });
    }

    const isSuperAdmin = request.userRole === 'super_admin';
    const submission = isSuperAdmin
      ? await queryOne<SubmissionRow & { company_name: string; company_tagline: string; company_desc_short: string; company_desc_long: string; company_website: string; company_email: string; company_categories: string; company_social_links: string; company_pricing: string; company_logo_url: string; company_founded_year: number | null }>(
          `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type,
                  c.name as company_name, c.tagline as company_tagline,
                  c.description_short as company_desc_short, c.description_long as company_desc_long,
                  c.website as company_website, c.support_email as company_email,
                  c.categories::text as company_categories, c.social_links::text as company_social_links,
                  c.pricing_model as company_pricing, c.logo_url as company_logo_url,
                  c.founded_year as company_founded_year
           FROM submissions s
           JOIN directories d ON s.directory_id = d.id
           JOIN companies c ON s.company_id = c.id
           WHERE s.id = $1`,
          [id]
        )
      : await queryOne<SubmissionRow & { company_name: string; company_tagline: string; company_desc_short: string; company_desc_long: string; company_website: string; company_email: string; company_categories: string; company_social_links: string; company_pricing: string; company_logo_url: string; company_founded_year: number | null }>(
          `SELECT s.*, d.name as directory_name, d.submit_url, d.submission_type,
                  c.name as company_name, c.tagline as company_tagline,
                  c.description_short as company_desc_short, c.description_long as company_desc_long,
                  c.website as company_website, c.support_email as company_email,
                  c.categories::text as company_categories, c.social_links::text as company_social_links,
                  c.pricing_model as company_pricing, c.logo_url as company_logo_url,
                  c.founded_year as company_founded_year
           FROM submissions s
           JOIN directories d ON s.directory_id = d.id
           JOIN companies c ON s.company_id = c.id
           WHERE s.id = $1 AND c.user_id = $2`,
          [id, userId]
        );

    if (!submission) {
      return reply.status(404).send({ error: 'Submission not found' });
    }

    let categories: string[] = [];
    try { categories = JSON.parse(submission.company_categories || '[]'); } catch { /* ignore */ }
    let socialLinks: Record<string, string> = {};
    try { socialLinks = JSON.parse(submission.company_social_links || '{}'); } catch { /* ignore */ }

    // Scrape the live website (with caching)
    let websiteContent = '';
    const cacheKey = submission.company_id;
    const cached = websiteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      websiteContent = cached.content;
    } else if (env.FIRECRAWL_API_KEY && submission.company_website) {
      try {
        websiteContent = await scrapeWebsite(submission.company_website);
        if (websiteContent) {
          websiteCache.set(cacheKey, { content: websiteContent, timestamp: Date.now() });
        }
      } catch {
        // Continue without scraped content
      }
    }

    const companyContext = `
COMPANY INFORMATION (from database):
- Name: ${submission.company_name}
- Website: ${submission.company_website}
- Contact Email: ${submission.company_email}
- Tagline: ${submission.company_tagline}
- Short Description: ${submission.company_desc_short}
- Full Description: ${submission.company_desc_long}
- Categories: ${categories.join(', ')}
- Pricing Model: ${submission.company_pricing}
- Founded Year: ${submission.company_founded_year || 'Not specified'}
- Logo URL: ${submission.company_logo_url}
- Social Links: ${Object.entries(socialLinks).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None'}

DIRECTORY BEING SUBMITTED TO:
- Directory Name: ${submission.directory_name}
- Submit URL: ${submission.submit_url}
- Submission Type: ${submission.submission_type}
`.trim();

    const websiteSection = websiteContent
      ? `\n\nLIVE WEBSITE CONTENT (scraped from ${submission.company_website}):\n${websiteContent.slice(0, 25000)}`
      : '';

    const systemPrompt = `You are a smart AI assistant for filling out directory submission forms. You have complete knowledge about the company — both from our database AND from a live scrape of their website.

${companyContext}${websiteSection}

IMPORTANT INSTRUCTIONS:
- You have access to the FULL website content above. Extract any information the user asks for (phone numbers, addresses, team members, founding dates, office locations, etc.) directly from the scraped content.
- Always provide copy-ready answers that can be pasted directly into form fields.
- If the information genuinely doesn't exist anywhere in the data or website content, say so clearly.
- Keep answers concise and appropriate for form fields (not essay-length unless asked).
- If asked to rewrite or adjust content, do so while keeping it accurate to the company.
- When providing phone numbers, addresses, or specific factual data, extract it exactly as shown on the website.`;

    const messages: Array<{ role: string; content: string }> = [
      { role: 'user', content: systemPrompt },
      { role: 'assistant', content: 'I have full context about the company from both the database and a live scrape of the website. I can provide any details including phone numbers, addresses, team info, and more. Ask me anything!' },
    ];

    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: question });

    try {
      const response = await fetch(`${env.AI_API_BASE_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.AI_API_KEY}`,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          max_tokens: 1500,
          messages,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        return reply.status(500).send({ error: `AI service error: ${response.status}` });
      }

      const result = await response.json() as {
        content: Array<{ type: string; text: string }>;
      };

      const textContent = result.content.find(c => c.type === 'text');
      if (!textContent) {
        return reply.status(500).send({ error: 'No response from AI' });
      }

      return reply.send({ answer: textContent.text });
    } catch (err) {
      return reply.status(500).send({ error: 'AI service unavailable' });
    }
  });
}
