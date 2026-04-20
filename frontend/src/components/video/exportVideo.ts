'use client';

import { PlayerRef } from '@remotion/player';
import html2canvas from 'html2canvas';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { VIDEO_FPS, VIDEO_WIDTH, VIDEO_HEIGHT } from './types';

interface ExportProgress {
  phase: 'preparing' | 'capturing' | 'encoding' | 'done';
  percent: number;
  currentFrame: number;
  totalFrames: number;
}

export async function exportVideoToMp4(
  playerRef: PlayerRef,
  totalFrames: number,
  companyName: string,
  onProgress: (progress: ExportProgress) => void,
): Promise<void> {
  const container = playerRef.getContainerNode();
  if (!container) throw new Error('Player container not found');

  // Find the actual video content area inside the player (skip controls)
  const contentEl = container.querySelector('[data-remotion-player-content]') as HTMLElement
    || container.firstElementChild as HTMLElement
    || container as HTMLElement;

  onProgress({ phase: 'preparing', percent: 0, currentFrame: 0, totalFrames });

  // Pause the player for manual seeking
  playerRef.pause();
  playerRef.seekTo(0);
  await sleep(200);

  // Pre-convert all external images to data URIs to avoid CORS issues with html2canvas
  console.log('[Export] Converting external images to data URIs...');
  const imageMap = await convertImagesToDataUri(contentEl);
  console.log(`[Export] Converted ${imageMap.size} images to data URIs`);

  // Get the actual rendered size of the content area
  const rect = contentEl.getBoundingClientRect();
  const captureWidth = Math.round(rect.width);
  const captureHeight = Math.round(rect.height);

  // Calculate scale factor to output at full composition resolution (1920x1080)
  const scaleX = VIDEO_WIDTH / captureWidth;
  const scaleY = VIDEO_HEIGHT / captureHeight;
  const scale = Math.max(scaleX, scaleY);

  console.log(`[Export] Capture size: ${captureWidth}x${captureHeight}, Output: ${VIDEO_WIDTH}x${VIDEO_HEIGHT}, Scale: ${scale.toFixed(2)}`);

  // Use WebCodecs + mp4-muxer for proper MP4 output
  if (typeof VideoEncoder !== 'undefined') {
    await exportWithWebCodecs(playerRef, contentEl, totalFrames, captureWidth, captureHeight, scale, companyName, imageMap, onProgress);
  } else {
    // Fallback: MediaRecorder for browsers without WebCodecs
    await exportWithMediaRecorder(playerRef, contentEl, totalFrames, captureWidth, captureHeight, scale, companyName, imageMap, onProgress);
  }
}

async function exportWithWebCodecs(
  playerRef: PlayerRef,
  contentEl: HTMLElement,
  totalFrames: number,
  width: number,
  height: number,
  scale: number,
  companyName: string,
  imageMap: Map<string, string>,
  onProgress: (progress: ExportProgress) => void,
): Promise<void> {
  // Output at full composition resolution
  const outWidth = VIDEO_WIDTH;
  const outHeight = VIDEO_HEIGHT;
  // Ensure dimensions are even (required by H.264)
  const encWidth = outWidth % 2 === 0 ? outWidth : outWidth + 1;
  const encHeight = outHeight % 2 === 0 ? outHeight : outHeight + 1;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: encWidth,
      height: encHeight,
    },
    fastStart: 'in-memory',
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta ?? undefined);
    },
    error: (e) => console.error('[VideoEncoder Error]', e),
  });

  encoder.configure({
    codec: 'avc1.640028',
    width: encWidth,
    height: encHeight,
    bitrate: 6_000_000,
    framerate: VIDEO_FPS,
  });

  onProgress({ phase: 'capturing', percent: 0, currentFrame: 0, totalFrames });

  // Render every 2nd frame for speed (15fps capture, plays back at 30fps duration)
  // Actually render every frame for quality
  const frameStep = 2; // Capture every 2nd frame for speed
  const effectiveTotalFrames = Math.ceil(totalFrames / frameStep);

  for (let i = 0; i < totalFrames; i += frameStep) {
    playerRef.seekTo(i);
    await sleep(40); // Wait for React to render

    // Swap external images to data URIs before each capture
    swapImagesToDataUri(contentEl, imageMap);
    await sleep(10);

    const canvas = await html2canvas(contentEl, {
      width,
      height,
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#050510',
      logging: false,
    });

    // Scale captured canvas to exact output resolution
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = encWidth;
    frameCanvas.height = encHeight;
    const ctx = frameCanvas.getContext('2d')!;
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, encWidth, encHeight);
    ctx.drawImage(canvas, 0, 0, encWidth, encHeight);

    // Each captured frame represents 2 actual frames (frameStep=2)
    // So timestamp spacing should account for this
    const timestampUs = Math.round((i / VIDEO_FPS) * 1_000_000);
    const frame = new VideoFrame(frameCanvas, {
      timestamp: timestampUs,
      duration: Math.round((frameStep / VIDEO_FPS) * 1_000_000),
    });
    
    const isKeyFrame = (i / frameStep) % 15 === 0;
    encoder.encode(frame, { keyFrame: isKeyFrame });
    frame.close();

    const percent = Math.round(((i / frameStep) / effectiveTotalFrames) * 100);
    onProgress({ phase: 'capturing', percent, currentFrame: i, totalFrames });
  }

  // Restore original image sources
  restoreOriginalImages(contentEl);

  onProgress({ phase: 'encoding', percent: 95, currentFrame: totalFrames, totalFrames });

  await encoder.flush();
  encoder.close();
  muxer.finalize();

  const buffer = (muxer.target as ArrayBufferTarget).buffer;
  const blob = new Blob([buffer], { type: 'video/mp4' });

  downloadBlob(blob, `${companyName.replace(/\s+/g, '-').toLowerCase()}-demo.mp4`);
  onProgress({ phase: 'done', percent: 100, currentFrame: totalFrames, totalFrames });
}

async function exportWithMediaRecorder(
  playerRef: PlayerRef,
  contentEl: HTMLElement,
  totalFrames: number,
  width: number,
  height: number,
  scale: number,
  companyName: string,
  imageMap: Map<string, string>,
  onProgress: (progress: ExportProgress) => void,
): Promise<void> {
  const canvas = document.createElement('canvas');
  canvas.width = VIDEO_WIDTH;
  canvas.height = VIDEO_HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack;

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_000_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();
  onProgress({ phase: 'capturing', percent: 0, currentFrame: 0, totalFrames });

  const frameStep = 2;
  for (let i = 0; i < totalFrames; i += frameStep) {
    playerRef.seekTo(i);
    await sleep(40);

    // Swap external images to data URIs before each capture
    swapImagesToDataUri(contentEl, imageMap);
    await sleep(10);

    const captured = await html2canvas(contentEl, {
      width,
      height,
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#050510',
      logging: false,
    });

    ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    ctx.drawImage(captured, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

    if ('requestFrame' in track) {
      track.requestFrame();
    }

    // Add delay for frame duration (2 frames at 30fps = ~67ms)
    await sleep(Math.round((frameStep / VIDEO_FPS) * 1000));

    const percent = Math.round((i / totalFrames) * 100);
    onProgress({ phase: 'capturing', percent, currentFrame: i, totalFrames });
  }

  // Restore original image sources
  restoreOriginalImages(contentEl);

  recorder.stop();

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  const blob = new Blob(chunks, { type: mimeType });
  downloadBlob(blob, `${companyName.replace(/\s+/g, '-').toLowerCase()}-demo.webm`);
  onProgress({ phase: 'done', percent: 100, currentFrame: totalFrames, totalFrames });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function convertImagesToDataUri(container: HTMLElement): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  const images = container.querySelectorAll('img');
  
  for (const img of Array.from(images)) {
    const src = img.src;
    if (!src || src.startsWith('data:') || imageMap.has(src)) continue;
    
    try {
      // Use a proxy-free approach: fetch via a canvas to convert to data URI
      const dataUri = await fetchImageAsDataUri(src);
      if (dataUri) {
        imageMap.set(src, dataUri);
        console.log(`[Export] Converted image: ${src.substring(0, 60)}...`);
      }
    } catch (e) {
      console.warn(`[Export] Failed to convert image: ${src}`, e);
    }
  }
  
  return imageMap;
}

async function fetchImageAsDataUri(url: string): Promise<string | null> {
  // Determine API base URL for the image proxy
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://listeverywhere-api.onrender.com';
  
  // Strategy 1: Try direct CORS fetch
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const dataUri = await blobToDataUri(blob);
      if (dataUri) {
        console.log(`[Export] Direct CORS fetch succeeded for: ${url.substring(0, 50)}`);
        return dataUri;
      }
    }
  } catch {
    // Direct CORS failed, try proxy
  }

  // Strategy 2: Use our backend API as an image proxy
  try {
    const proxyUrl = `${apiBase}/api/image-proxy?url=${encodeURIComponent(url)}`;
    console.log(`[Export] Using API proxy for: ${url.substring(0, 50)}`);
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const blob = await response.blob();
      const dataUri = await blobToDataUri(blob);
      if (dataUri) {
        console.log(`[Export] API proxy fetch succeeded`);
        return dataUri;
      }
    }
  } catch (e) {
    console.warn(`[Export] API proxy failed for: ${url}`, e);
  }

  return null;
}

function blobToDataUri(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function swapImagesToDataUri(container: HTMLElement, imageMap: Map<string, string>): void {
  const images = container.querySelectorAll('img');
  for (const img of Array.from(images)) {
    const dataUri = imageMap.get(img.src);
    if (dataUri && !img.src.startsWith('data:')) {
      img.setAttribute('data-original-src', img.src);
      img.src = dataUri;
    }
  }
}

function restoreOriginalImages(container: HTMLElement): void {
  const images = container.querySelectorAll<HTMLImageElement>('img[data-original-src]');
  for (const img of Array.from(images)) {
    const originalSrc = img.getAttribute('data-original-src');
    if (originalSrc) {
      img.src = originalSrc;
      img.removeAttribute('data-original-src');
    }
  }
}
