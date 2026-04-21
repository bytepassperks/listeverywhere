'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface DarkVideoPlayerProps {
  src: string;
}

export function DarkVideoPlayer({ src }: DarkVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
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

  const toggleFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen();
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

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 960,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#050510',
        cursor: 'pointer',
      }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        onClick={togglePlay}
        style={{ width: '100%', display: 'block', background: '#050510' }}
      />

      {/* Custom dark controls overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(5,5,16,0.9) 40%, rgba(5,5,16,0.97))',
          padding: '24px 16px 10px',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: showControls ? 'auto' : 'none',
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
            {playing ? '⏸' : '▶'}
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
            aria-label="Fullscreen"
          >
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
