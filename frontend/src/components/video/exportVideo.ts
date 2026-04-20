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
    await exportWithWebCodecs(playerRef, contentEl, totalFrames, captureWidth, captureHeight, scale, companyName, onProgress);
  } else {
    // Fallback: MediaRecorder for browsers without WebCodecs
    await exportWithMediaRecorder(playerRef, contentEl, totalFrames, captureWidth, captureHeight, scale, companyName, onProgress);
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
