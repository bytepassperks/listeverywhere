import { env } from '../config/env';

export interface CompanyProfile {
  company_name: string;
  tagline: string;
  short_description: string;
  long_description: string;
  logo_url: string;
  categories: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  founded_year: number | null;
}

const EXTRACTION_PROMPT = `You are an expert at extracting structured startup/company information from website content.

Analyze the following website content and extract the company profile. Return ONLY valid JSON with exactly these fields:

{
  "company_name": "The company/product name",
  "tagline": "A short catchy tagline (max 80 chars). If not found, create one from the content.",
  "short_description": "A concise 1-2 sentence description (max 200 chars)",
  "long_description": "A detailed 2-4 paragraph description covering what the product does, who it's for, and key benefits (max 2000 chars)",
  "logo_url": "URL of the company logo if found, empty string otherwise",
  "categories": ["Array of 3-5 relevant categories like 'AI Tools', 'Productivity', 'Marketing', etc."],
  "social_links": {"twitter": "url", "linkedin": "url", "github": "url", "facebook": "url"},
  "pricing_model": "One of: free, freemium, paid, enterprise, open_source, contact_sales",
  "founded_year": null or a 4-digit year number
}

Rules:
- Extract REAL information from the content, do not make up details
- If a field is not found, use reasonable defaults (empty string, empty array, null)
- Categories should be broad industry terms suitable for directory listings
- The short_description must be compelling and suitable for directory listings
- The long_description should be SEO-friendly and detailed
- For social_links, only include links that are actually found in the content
- For pricing_model, infer from pricing page content or default to "freemium"

Return ONLY the JSON object, no other text.`;

export async function extractCompanyProfile(markdown: string): Promise<CompanyProfile> {
  if (!env.AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured');
  }

  const truncatedMarkdown = markdown.slice(0, 15000);

  const response = await fetch(`${env.AI_API_BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.AI_API_KEY}`,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${EXTRACTION_PROMPT}\n\n--- WEBSITE CONTENT ---\n\n${truncatedMarkdown}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI extraction failed: ${response.status} - ${err}`);
  }

  const result = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const textContent = result.content.find(c => c.type === 'text');
  if (!textContent) {
    throw new Error('No text content in AI response');
  }

  const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as CompanyProfile;

  return {
    company_name: parsed.company_name || 'Unknown',
    tagline: (parsed.tagline || '').slice(0, 500),
    short_description: (parsed.short_description || '').slice(0, 1000),
    long_description: (parsed.long_description || '').slice(0, 5000),
    logo_url: parsed.logo_url || '',
    categories: Array.isArray(parsed.categories) ? parsed.categories.slice(0, 10) : [],
    social_links: typeof parsed.social_links === 'object' && parsed.social_links !== null ? parsed.social_links : {},
    pricing_model: parsed.pricing_model || 'freemium',
    founded_year: typeof parsed.founded_year === 'number' ? parsed.founded_year : null,
  };
}
