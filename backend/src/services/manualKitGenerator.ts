import { SubmissionPayload } from './payloadGenerator';

export interface DirectoryRequirements {
  title_limit: number | null;
  desc_limit: number | null;
  requires_logo: boolean;
  requires_screenshot: boolean;
  requires_category: boolean;
}

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
  logo_download_url: string;
  screenshots: string[];
  screenshot_download_urls: string[];
  social_links: Record<string, string>;
  pricing_model: string;
  instructions: string[];
  directory_requirements: DirectoryRequirements;
  form_fields: FormField[];
}

export interface FormField {
  field_name: string;
  value: string;
  required: boolean;
  char_limit: number | null;
  copy_ready: boolean;
}

export function generateManualKit(
  payload: SubmissionPayload,
  requirements: DirectoryRequirements,
  apiBaseUrl: string
): ManualKit {
  const instructions: string[] = [];

  const formFields: FormField[] = [];
  let step = 1;

  instructions.push(`${step}. Open the submission page: ${payload.submit_url}`);
  step++;

  // Title field
  const titleNote = requirements.title_limit ? ` (max ${requirements.title_limit} chars)` : '';
  instructions.push(`${step}. Enter the product name${titleNote}: "${payload.title}"`);
  formFields.push({
    field_name: 'Product Name / Title',
    value: payload.title,
    required: true,
    char_limit: requirements.title_limit,
    copy_ready: true,
  });
  step++;

  if (payload.tagline) {
    instructions.push(`${step}. Enter the tagline: "${payload.tagline}"`);
    formFields.push({
      field_name: 'Tagline / Short Description',
      value: payload.tagline,
      required: false,
      char_limit: null,
      copy_ready: true,
    });
    step++;
  }

  // Description field
  const descNote = requirements.desc_limit ? ` (max ${requirements.desc_limit} chars)` : '';
  instructions.push(`${step}. Enter the description${descNote}.`);
  formFields.push({
    field_name: 'Description',
    value: payload.description,
    required: true,
    char_limit: requirements.desc_limit,
    copy_ready: true,
  });
  step++;

  if (payload.description_long && payload.description_long !== payload.description) {
    formFields.push({
      field_name: 'Long Description',
      value: payload.description_long,
      required: false,
      char_limit: null,
      copy_ready: true,
    });
  }

  // Website URL
  instructions.push(`${step}. Set the website URL to: ${payload.website}`);
  formFields.push({
    field_name: 'Website URL',
    value: payload.website,
    required: true,
    char_limit: null,
    copy_ready: true,
  });
  step++;

  // Categories
  if (requirements.requires_category && payload.categories.length > 0) {
    instructions.push(`${step}. Select categories: ${payload.categories.join(', ')}`);
    formFields.push({
      field_name: 'Categories',
      value: payload.categories.join(', '),
      required: true,
      char_limit: null,
      copy_ready: true,
    });
    step++;
  } else if (payload.categories.length > 0) {
    formFields.push({
      field_name: 'Categories (if available)',
      value: payload.categories.join(', '),
      required: false,
      char_limit: null,
      copy_ready: true,
    });
  }

  // Logo
  if (requirements.requires_logo) {
    instructions.push(`${step}. Upload the logo (download it from the kit below).`);
    step++;
  }

  // Screenshots
  if (requirements.requires_screenshot && payload.screenshots.length > 0) {
    instructions.push(`${step}. Upload screenshots (download them from the kit below).`);
    step++;
  }

  // Email
  if (payload.email) {
    instructions.push(`${step}. Set the contact email to: ${payload.email}`);
    formFields.push({
      field_name: 'Contact Email',
      value: payload.email,
      required: false,
      char_limit: null,
      copy_ready: true,
    });
    step++;
  }

  // Social links
  if (Object.keys(payload.social_links).length > 0) {
    const socials = Object.entries(payload.social_links)
      .filter(([, url]) => url);
    if (socials.length > 0) {
      instructions.push(`${step}. Add social links:`);
      for (const [platform, url] of socials) {
        formFields.push({
          field_name: `Social: ${platform}`,
          value: url,
          required: false,
          char_limit: null,
          copy_ready: true,
        });
      }
      step++;
    }
  }

  // Pricing
  formFields.push({
    field_name: 'Pricing Model',
    value: payload.pricing_model || 'freemium',
    required: false,
    char_limit: null,
    copy_ready: true,
  });

  instructions.push(`${step}. Review all fields and submit the form.`);

  // Build download URLs through the proxy
  const logoDownloadUrl = payload.logo_url
    ? `${apiBaseUrl}/api/image-proxy?url=${encodeURIComponent(payload.logo_url)}`
    : '';
  const screenshotDownloadUrls = payload.screenshots.map(
    (s) => `${apiBaseUrl}/api/image-proxy?url=${encodeURIComponent(s)}`
  );

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
    logo_download_url: logoDownloadUrl,
    screenshots: payload.screenshots,
    screenshot_download_urls: screenshotDownloadUrls,
    social_links: payload.social_links,
    pricing_model: payload.pricing_model,
    instructions,
    directory_requirements: requirements,
    form_fields: formFields,
  };
}
