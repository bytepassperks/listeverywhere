import { query } from '../db/pool';

const SCREENSHOT_WIDTH = 1920;
const SCREENSHOT_HEIGHT = 1080;

function buildScreenshotUrl(pageUrl: string): string {
  const encoded = encodeURIComponent(pageUrl);
  return `https://image.thum.io/get/width/${SCREENSHOT_WIDTH}/crop/${SCREENSHOT_HEIGHT}/noanimate/${pageUrl}`;
}

export async function generateScreenshots(
  companyId: string,
  websiteUrl: string
): Promise<{ homepage?: string; features?: string; pricing?: string }> {
  const normalizedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
  const baseUrl = new URL(normalizedUrl).origin;
  const results: { homepage?: string; features?: string; pricing?: string } = {};

  const pages = [
    { type: 'homepage' as const, url: normalizedUrl },
    { type: 'features' as const, url: `${baseUrl}/features` },
    { type: 'pricing' as const, url: `${baseUrl}/pricing` },
  ];

  for (const pageInfo of pages) {
    try {
      const screenshotUrl = buildScreenshotUrl(pageInfo.url);

      // Verify the screenshot URL is reachable
      const resp = await fetch(screenshotUrl, { method: 'HEAD', signal: AbortSignal.timeout(15000) });

      if (resp.ok) {
        // Delete existing screenshot of same type, then insert
        await query(
          `DELETE FROM screenshots WHERE company_id = $1 AND type = $2`,
          [companyId, pageInfo.type]
        );
        await query(
          `INSERT INTO screenshots (company_id, type, file_url) VALUES ($1, $2, $3)`,
          [companyId, pageInfo.type, screenshotUrl]
        );

        results[pageInfo.type] = screenshotUrl;
        console.log(`Screenshot captured for ${pageInfo.type}: ${screenshotUrl}`);
      } else {
        console.warn(`Screenshot service returned ${resp.status} for ${pageInfo.url}`);
      }
    } catch (err) {
      console.warn(`Screenshot failed for ${pageInfo.type} (${pageInfo.url}):`, err instanceof Error ? err.message : err);
    }
  }

  return results;
}

export async function getScreenshots(companyId: string): Promise<Array<{ type: string; file_url: string }>> {
  return query<{ type: string; file_url: string }>(
    'SELECT type, file_url FROM screenshots WHERE company_id = $1 ORDER BY type',
    [companyId]
  );
}
