export interface DemoVideoProps {
  companyName: string;
  tagline: string;
  descriptionShort: string;
  descriptionLong: string;
  logoUrl: string;
  website: string;
  categories: string[];
  pricingModel: string;
  foundedYear: number | null;
  socialLinks: Record<string, string>;
  screenshots: { type: string; file_url: string }[];
  submissionStats: Record<string, number>;
  totalDirectories: number;
}

export const VIDEO_WIDTH = 1920;
export const VIDEO_HEIGHT = 1080;
export const VIDEO_FPS = 30;
export const SCENE_DURATION_FRAMES = 150; // 5 seconds per scene
