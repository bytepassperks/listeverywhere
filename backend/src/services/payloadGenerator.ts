import { query, queryOne } from '../db/pool';
import { mapCategoriesForDirectory } from './categoryMapper';

interface Company {
  id: string;
  name: string;
  website: string;
  support_email: string;
  tagline: string;
  description_short: string;
  description_long: string;
  logo_url: string;
  categories: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  founded_year: number | null;
}

interface Directory {
  id: string;
  name: string;
  submit_url: string;
  submission_type: string;
  title_limit: number | null;
  desc_limit: number | null;
  requires_logo: boolean;
  requires_screenshot: boolean;
  requires_category: boolean;
  category_taxonomy: string[];
}

export interface SubmissionPayload {
  title: string;
  tagline: string;
  description: string;
  description_long: string;
  website: string;
  email: string;
  categories: string[];
  logo_url: string;
  screenshots: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  founded_year: number | null;
  submit_url: string;
  directory_name: string;
  submission_type: string;
}

function smartTruncate(text: string, limit: number): string {
  if (!text || text.length <= limit) return text;

  const truncated = text.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastPeriod = truncated.lastIndexOf('.');

  if (lastPeriod > limit * 0.7) {
    return truncated.slice(0, lastPeriod + 1);
  }
  if (lastSpace > limit * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }
  return truncated.slice(0, limit - 3) + '...';
}

export async function generatePayload(
  companyId: string,
  directoryId: string
): Promise<SubmissionPayload> {
  const company = await queryOne<Company>(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  );
  if (!company) throw new Error(`Company ${companyId} not found`);

  const directory = await queryOne<Directory>(
    'SELECT * FROM directories WHERE id = $1',
    [directoryId]
  );
  if (!directory) throw new Error(`Directory ${directoryId} not found`);

  const categories = directory.requires_category
    ? mapCategoriesForDirectory(
        Array.isArray(company.categories) ? company.categories : [],
        directory.name
      )
    : Array.isArray(company.categories) ? company.categories : [];

  const screenshots = await query<{ file_url: string }>(
    'SELECT file_url FROM screenshots WHERE company_id = $1',
    [companyId]
  );

  const title = directory.title_limit
    ? smartTruncate(company.name, directory.title_limit)
    : company.name;

  const description = directory.desc_limit
    ? smartTruncate(company.description_short || company.tagline || '', directory.desc_limit)
    : company.description_short || company.tagline || '';

  return {
    title,
    tagline: company.tagline || '',
    description,
    description_long: company.description_long || company.description_short || '',
    website: company.website,
    email: company.support_email || '',
    categories,
    logo_url: company.logo_url || '',
    screenshots: screenshots.map(s => s.file_url),
    social_links: typeof company.social_links === 'object' && company.social_links !== null
      ? company.social_links as Record<string, string>
      : {},
    pricing_model: company.pricing_model || 'freemium',
    founded_year: company.founded_year || null,
    submit_url: directory.submit_url,
    directory_name: directory.name,
    submission_type: directory.submission_type,
  };
}

export async function generateAllPayloads(companyId: string): Promise<SubmissionPayload[]> {
  const directories = await query<{ id: string }>(
    'SELECT id FROM directories WHERE active = true'
  );

  const payloads: SubmissionPayload[] = [];
  for (const dir of directories) {
    const payload = await generatePayload(companyId, dir.id);
    payloads.push(payload);
  }
  return payloads;
}
