import { SubmissionPayload } from './payloadGenerator';

export interface EmailKit {
  directory_name: string;
  to_email: string;
  email_subject: string;
  email_body: string;
  attachments: string[];
  gmail_draft_url: string;
}

function generateEmailBody(payload: SubmissionPayload): string {
  const body = `Hi there,

I'd love to introduce ${payload.title} for consideration on ${payload.directory_name}.

${payload.tagline}

${payload.description_long || payload.description}

🔗 Website: ${payload.website}
${payload.pricing_model ? `💰 Pricing: ${payload.pricing_model}` : ''}
${payload.categories.length > 0 ? `📂 Categories: ${payload.categories.join(', ')}` : ''}

${Object.entries(payload.social_links)
  .filter(([, url]) => url)
  .map(([platform, url]) => `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url}`)
  .join('\n')}

I've attached our logo${payload.screenshots.length > 0 ? ' and screenshots' : ''} for your convenience.

Would love to hear back if you have any questions or need additional information.

Best regards,
${payload.title} Team
${payload.email}`;

  return body;
}

function generateSubject(payload: SubmissionPayload): string {
  return `Submission: ${payload.title} - ${payload.tagline || payload.description.slice(0, 60)}`;
}

function buildGmailDraftUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function generateEmailKit(
  payload: SubmissionPayload,
  directoryEmail?: string
): EmailKit {
  const subject = generateSubject(payload);
  const body = generateEmailBody(payload);
  const toEmail = directoryEmail || '';

  const attachments: string[] = [];
  if (payload.logo_url) {
    attachments.push(payload.logo_url);
  }
  payload.screenshots.forEach(s => attachments.push(s));

  return {
    directory_name: payload.directory_name,
    to_email: toEmail,
    email_subject: subject,
    email_body: body,
    attachments,
    gmail_draft_url: buildGmailDraftUrl(toEmail, subject, body),
  };
}
