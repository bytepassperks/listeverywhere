export interface CaptchaChallenge {
  type: 'recaptcha_v2' | 'recaptcha_v3' | 'hcaptcha' | 'turnstile' | 'image';
  siteKey?: string;
  pageUrl: string;
  imageBase64?: string;
}

export interface CaptchaSolution {
  solved: boolean;
  token?: string;
  text?: string;
  error?: string;
}

export interface CaptchaSolver {
  solve(challenge: CaptchaChallenge): Promise<CaptchaSolution>;
  getBalance(): Promise<number>;
}

class NoOpCaptchaSolver implements CaptchaSolver {
  async solve(challenge: CaptchaChallenge): Promise<CaptchaSolution> {
    console.warn(`CAPTCHA detected on ${challenge.pageUrl} (type: ${challenge.type}) — no solver configured`);
    return {
      solved: false,
      error: 'No CAPTCHA solver configured. Set up a solver service (2Captcha, Anti-Captcha, etc.) to handle this.',
    };
  }

  async getBalance(): Promise<number> {
    return 0;
  }
}

let activeSolver: CaptchaSolver = new NoOpCaptchaSolver();

export function setSolver(solver: CaptchaSolver): void {
  activeSolver = solver;
}

export function getSolver(): CaptchaSolver {
  return activeSolver;
}

export async function solveCaptcha(challenge: CaptchaChallenge): Promise<CaptchaSolution> {
  return activeSolver.solve(challenge);
}

export function detectCaptchaOnPage(pageContent: string): CaptchaChallenge['type'] | null {
  if (pageContent.includes('g-recaptcha') || pageContent.includes('recaptcha/api')) {
    if (pageContent.includes('recaptcha/api/siteverify') || pageContent.includes('grecaptcha.execute')) {
      return 'recaptcha_v3';
    }
    return 'recaptcha_v2';
  }
  if (pageContent.includes('hcaptcha') || pageContent.includes('h-captcha')) {
    return 'hcaptcha';
  }
  if (pageContent.includes('turnstile') || pageContent.includes('cf-turnstile')) {
    return 'turnstile';
  }
  return null;
}
