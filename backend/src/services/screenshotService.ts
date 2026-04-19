import { chromium, Browser, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { query } from '../db/pool';

const VIEWPORT = { width: 1280, height: 800 };

function ensureScreenshotDir(): void {
  if (!fs.existsSync(env.SCREENSHOTS_DIR)) {
    fs.mkdirSync(env.SCREENSHOTS_DIR, { recursive: true });
  }
}

async function takeScreenshot(
  browser: Browser,
  url: string,
  outputPath: string,
  waitForSelector?: string
): Promise<void> {
  const page: Page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {});
    }

    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      const cookieBanners = document.querySelectorAll(
        '[class*="cookie"], [class*="consent"], [id*="cookie"], [id*="consent"], [class*="gdpr"]'
      );
      cookieBanners.forEach(el => (el as HTMLElement).style.display = 'none');

      const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [class*="overlay"]');
      modals.forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'absolute') {
          (el as HTMLElement).style.display = 'none';
        }
      });
    });

    await page.screenshot({
      path: outputPath,
      fullPage: false,
      type: 'png',
    });
  } finally {
    await page.close();
  }
}

export async function generateScreenshots(
  companyId: string,
  websiteUrl: string
): Promise<{ homepage?: string; features?: string; pricing?: string }> {
  ensureScreenshotDir();

  const normalizedUrl = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
  const baseUrl = new URL(normalizedUrl).origin;
  const results: { homepage?: string; features?: string; pricing?: string } = {};

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const pages = [
      { type: 'homepage' as const, url: normalizedUrl, file: `${companyId}_homepage.png` },
      { type: 'features' as const, url: `${baseUrl}/features`, file: `${companyId}_features.png` },
      { type: 'pricing' as const, url: `${baseUrl}/pricing`, file: `${companyId}_pricing.png` },
    ];

    for (const pageInfo of pages) {
      const outputPath = path.join(env.SCREENSHOTS_DIR, pageInfo.file);

      try {
        await takeScreenshot(browser, pageInfo.url, outputPath);

        if (fs.existsSync(outputPath)) {
          const fileUrl = `/screenshots/${pageInfo.file}`;

          await query(
            `INSERT INTO screenshots (company_id, type, file_url)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING`,
            [companyId, pageInfo.type, fileUrl]
          );

          results[pageInfo.type] = fileUrl;
        }
      } catch (err) {
        console.warn(`Screenshot failed for ${pageInfo.type} (${pageInfo.url}):`, err instanceof Error ? err.message : err);
      }
    }

    return results;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function getScreenshots(companyId: string): Promise<Array<{ type: string; file_url: string }>> {
  return query<{ type: string; file_url: string }>(
    'SELECT type, file_url FROM screenshots WHERE company_id = $1 ORDER BY type',
    [companyId]
  );
}
