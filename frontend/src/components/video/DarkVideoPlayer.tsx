'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface DarkVideoPlayerProps {
  src: string;
}

export function DarkVideoPlayer({ src }: DarkVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  }, []);

  // Fullscreen on the CONTAINER (not the video element) so Chrome doesn't inject native controls
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onEnd = () => setPlaying(false);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    v.addEventListener('ended', onEnd);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
      v.removeEventListener('ended', onEnd);
    };
  }, [src]);

  // Track fullscreen state changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* CSS to aggressively suppress any native video controls */}
      <style>{`
        .dark-video-player video::-webkit-media-controls,
        .dark-video-player video::-webkit-media-controls-enclosure,
        .dark-video-player video::-webkit-media-controls-panel,
        .dark-video-player video::-webkit-media-controls-overlay-play-button,
        .dark-video-player video::-webkit-media-controls-start-playback-button,
        .dark-video-player video::-webkit-media-controls-timeline,
        .dark-video-player video::-webkit-media-controls-current-time-display,
        .dark-video-player video::-webkit-media-controls-time-remaining-display,
        .dark-video-player video::-webkit-media-controls-mute-button,
        .dark-video-player video::-webkit-media-controls-volume-slider,
        .dark-video-player video::-webkit-media-controls-fullscreen-button {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
          -webkit-appearance: none !important;
          height: 0 !important;
          width: 0 !important;
        }
        .dark-video-player video::-moz-range-track,
        .dark-video-player video::-moz-range-thumb {
          display: none !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="dark-video-player"
        style={{
          width: '100%',
          maxWidth: isFullscreen ? '100%' : 960,
          position: 'relative',
          borderRadius: isFullscreen ? 0 : 12,
          overflow: 'hidden',
          background: '#000000',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => playing && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          onClick={togglePlay}
          disablePictureInPicture
          playsInline
          style={{
            width: '100%',
            maxHeight: isFullscreen ? '100vh' : 'auto',
            display: 'block',
            background: '#000000',
            objectFit: 'contain',
          }}
        />

        {/* Custom dark controls overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.95))',
            padding: '24px 16px 10px',
            opacity: showControls ? 1 : 0,
            transition: 'opacity 0.3s',
            pointerEvents: showControls ? 'auto' : 'none',
            zIndex: 10,
          }}
        >
          {/* Progress bar */}
          <div
            ref={progressRef}
            onClick={handleSeek}
            style={{
              width: '100%',
              height: 4,
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 2,
              cursor: 'pointer',
              marginBottom: 8,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'rgba(139,92,246,0.8)',
                borderRadius: 2,
                transition: 'width 0.1s linear',
              }}
            />
          </div>

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                padding: 4,
                fontSize: 16,
                lineHeight: 1,
              }}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? '\u23F8' : '\u25B6'}
            </button>

            <span style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontFamily: 'monospace',
              userSelect: 'none',
            }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div style={{ flex: 1 }} />

            <button
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: 4,
                fontSize: 14,
                lineHeight: 1,
              }}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? '\u2716' : '\u26F6'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
