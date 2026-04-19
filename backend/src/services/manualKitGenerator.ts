import { SubmissionPayload } from './payloadGenerator';

export interface ManualKit {
  directory_name: string;
  submit_url: string;
  title: string;
  tagline: string;
  description: string;
  description_long: string;
  categories: string[];
  website: string;
  email: string;
  logo_url: string;
  screenshots: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  instructions: string[];
}

export function generateManualKit(payload: SubmissionPayload): ManualKit {
  const instructions: string[] = [];

  instructions.push(`1. Open the submission page: ${payload.submit_url}`);
  instructions.push(`2. Copy and paste the title: "${payload.title}"`);

  if (payload.tagline) {
    instructions.push(`3. Copy and paste the tagline: "${payload.tagline}"`);
  }

  instructions.push(`4. Copy and paste the description into the description field.`);

  if (payload.categories.length > 0) {
    instructions.push(`5. Select these categories: ${payload.categories.join(', ')}`);
  }

  if (payload.logo_url) {
    instructions.push(`6. Upload the logo from: ${payload.logo_url}`);
  }

  if (payload.screenshots.length > 0) {
    instructions.push(`7. Upload screenshots: ${payload.screenshots.join(', ')}`);
  }

  instructions.push(`8. Set the website URL to: ${payload.website}`);

  if (payload.email) {
    instructions.push(`9. Set the contact email to: ${payload.email}`);
  }

  if (Object.keys(payload.social_links).length > 0) {
    const socials = Object.entries(payload.social_links)
      .filter(([, url]) => url)
      .map(([platform, url]) => `${platform}: ${url}`)
      .join(', ');
    if (socials) {
      instructions.push(`10. Add social links: ${socials}`);
    }
  }

  instructions.push(`11. Review all fields and submit the form.`);

  return {
    directory_name: payload.directory_name,
    submit_url: payload.submit_url,
    title: payload.title,
    tagline: payload.tagline,
    description: payload.description,
    description_long: payload.description_long,
    categories: payload.categories,
    website: payload.website,
    email: payload.email,
    logo_url: payload.logo_url,
    screenshots: payload.screenshots,
    social_links: payload.social_links,
    pricing_model: payload.pricing_model,
    instructions,
  };
}
