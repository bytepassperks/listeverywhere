import { Job } from 'bullmq';
import { updateSubmissionStatus, incrementAttempt } from '../services/statusTracker';
import { generatePayload, SubmissionPayload } from '../services/payloadGenerator';
import { detectCaptchaOnPage, solveCaptcha } from '../services/captchaSolverService';
import { getNextProxy, getProxyUrl, isProxyEnabled } from '../config/proxyPool';

interface FormSubmissionJobData {
  submissionId: string;
  companyId: string;
  directoryId: string;
  submitUrl: string;
}

const MAX_RETRIES = 3;

async function getPuppeteerAndChromium() {
  try {
    const puppeteer = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');
    const execPath = await chromium.default.executablePath();
    console.log('[Workers] Chromium executable path:', execPath);
    return { puppeteer: puppeteer.default, executablePath: execPath };
  } catch (err) {
    console.error('[Workers] Failed to load puppeteer-core or @sparticuz/chromium:', err);
    throw new Error('puppeteer-core or @sparticuz/chromium is not installed.');
  }
}

async function fillFormField(page: any, selectors: string[], value: string): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const element = await page.$(selector);
      if (element) {
        await element.click();
        await element.type(value, { delay: 30 });
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function selectCategory(page: any, categories: string[]): Promise<boolean> {
  const selectors = [
    'select[name*="category"]',
    'select[name*="type"]',
    'select[name*="topic"]',
    '[class*="category"] select',
    'select[id*="category"]',
  ];

  for (const selector of selectors) {
    try {
      const select = await page.$(selector);
      if (select) {
        const options = await page.$$(`${selector} option`);
        for (const option of options) {
          const text = await page.evaluate((el: HTMLOptionElement) => el.textContent, option);
          if (text && categories.some((cat: string) =>
            text.toLowerCase().includes(cat.toLowerCase()) ||
            cat.toLowerCase().includes(text.toLowerCase())
          )) {
            const value = await page.evaluate((el: HTMLOptionElement) => el.value, option);
            if (value) {
              await page.select(selector, value);
              return true;
            }
          }
        }
        if (options.length > 1) {
          const value = await page.evaluate((el: HTMLOptionElement) => el.value, options[1]);
          if (value) {
            await page.select(selector, value);
            return true;
          }
        }
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function uploadFile(page: any, selectors: string[], fileUrl: string): Promise<boolean> {
  for (const selector of selectors) {
    try {
      const input = await page.$(selector);
      if (input) {
        const type = await page.evaluate((el: HTMLInputElement) => el.type, input);
        if (type === 'file') {
          await input.uploadFile(fileUrl);
          return true;
        }
      }
    } catch {
      continue;
    }
  }
  return false;
}

async function fillForm(page: any, payload: SubmissionPayload): Promise<void> {
  await fillFormField(page, [
    'input[name*="name"]',
    'input[name*="title"]',
    'input[placeholder*="name"]',
    'input[placeholder*="title"]',
    'input[id*="name"]',
    'input[id*="title"]',
    '#name', '#title',
  ], payload.title);

  await fillFormField(page, [
    'input[name*="tagline"]',
    'input[name*="slogan"]',
    'input[placeholder*="tagline"]',
    'input[id*="tagline"]',
  ], payload.tagline);

  await fillFormField(page, [
    'textarea[name*="description"]',
    'textarea[name*="about"]',
    'textarea[placeholder*="description"]',
    'textarea[id*="description"]',
    '#description',
    'textarea',
  ], payload.description);

  await fillFormField(page, [
    'input[name*="url"]',
    'input[name*="website"]',
    'input[name*="link"]',
    'input[placeholder*="url"]',
    'input[placeholder*="website"]',
    'input[type="url"]',
    'input[id*="url"]',
    'input[id*="website"]',
  ], payload.website);

  await fillFormField(page, [
    'input[name*="email"]',
    'input[type="email"]',
    'input[placeholder*="email"]',
    'input[id*="email"]',
  ], payload.email);

  if (payload.categories.length > 0) {
    await selectCategory(page, payload.categories);
  }

  if (payload.logo_url) {
    await uploadFile(page, [
      'input[name*="logo"]',
      'input[name*="image"]',
      'input[name*="icon"]',
      'input[type="file"]',
    ], payload.logo_url);
  }
}

async function submitForm(page: any): Promise<boolean> {
  const submitSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
  ];

  const xpathSelectors = [
    '//button[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "submit")]',
    '//button[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "send")]',
    '//button[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "add")]',
    '//button[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "post")]',
    '//button[contains(translate(., "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "create")]',
  ];

  for (const selector of submitSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        await new Promise(r => setTimeout(r, 3000));
        return true;
      }
    } catch {
      continue;
    }
  }

  for (const xpath of xpathSelectors) {
    try {
      const [button] = await page.$x(xpath);
      if (button) {
        await button.click();
        await new Promise(r => setTimeout(r, 3000));
        return true;
      }
    } catch {
      continue;
    }
  }

  try {
    const fallback = await page.$('[class*="submit"] button');
    if (fallback) {
      await fallback.click();
      await new Promise(r => setTimeout(r, 3000));
      return true;
    }
  } catch { /* ignore */ }

  try {
    const formButton = await page.$('form button:last-of-type');
    if (formButton) {
      await formButton.click();
      await new Promise(r => setTimeout(r, 3000));
      return true;
    }
  } catch { /* ignore */ }

  return false;
}

export async function processFormSubmission(job: Job<FormSubmissionJobData>): Promise<void> {
  const { submissionId, companyId, directoryId, submitUrl } = job.data;

  const attemptCount = await incrementAttempt(submissionId);
  let browser: any = null;

  try {
    await updateSubmissionStatus(submissionId, 'retrying');

    const payload = await generatePayload(companyId, directoryId);

    console.log(`[Workers] Starting form submission for ${submitUrl} (attempt ${attemptCount})`);
    const { puppeteer, executablePath } = await getPuppeteerAndChromium();

    const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'];

    if (isProxyEnabled()) {
      const proxy = getNextProxy();
      if (proxy) {
        launchArgs.push(`--proxy-server=${getProxyUrl(proxy)}`);
      }
    }

    console.log(`[Workers] Launching Chromium at: ${executablePath}`);
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: launchArgs,
    });
    console.log('[Workers] Chromium launched successfully');

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(submitUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const pageContent = await page.content();
    const captchaType = detectCaptchaOnPage(pageContent);

    if (captchaType) {
      console.warn(`CAPTCHA detected (${captchaType}) on ${submitUrl}`);
      const solution = await solveCaptcha({
        type: captchaType,
        pageUrl: submitUrl,
      });

      if (!solution.solved) {
        throw new Error(`CAPTCHA not solved: ${solution.error}`);
      }
    }

    await fillForm(page, payload);
    await new Promise(r => setTimeout(r, 1000));

    const submitted = await submitForm(page);

    if (submitted) {
      await new Promise(r => setTimeout(r, 3000));

      const currentUrl = page.url();
      const pageText = await page.evaluate(() => document.body.textContent || '');

      const successIndicators = ['thank', 'success', 'submitted', 'received', 'confirm', 'pending'];
      const isSuccess = successIndicators.some((ind: string) => pageText.toLowerCase().includes(ind)) ||
        currentUrl !== submitUrl;

      if (isSuccess) {
        await updateSubmissionStatus(submissionId, 'auto_submitted');
        console.log(`Form submission successful for ${payload.directory_name} (submission: ${submissionId})`);
      } else {
        throw new Error('Form submitted but no success confirmation detected');
      }
    } else {
      throw new Error('Could not find submit button on page');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Form submission failed for ${submissionId} (attempt ${attemptCount}):`, errorMsg);

    if (attemptCount >= MAX_RETRIES) {
      await updateSubmissionStatus(submissionId, 'manual_required', `Failed after ${MAX_RETRIES} attempts: ${errorMsg}`);
    } else {
      await updateSubmissionStatus(submissionId, 'retrying', errorMsg);
      throw error;
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
