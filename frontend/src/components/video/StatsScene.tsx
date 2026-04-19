import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

const CircularProgress: React.FC<{
  value: number;
  max: number;
  color: string;
  size: number;
  strokeWidth: number;
  frame: number;
  delay: number;
  fps: number;
}> = ({ value, max, color, size, strokeWidth, frame, delay, fps }) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 25, mass: 2, stiffness: 40 },
  });
  const percentage = max > 0 ? (value / max) * Math.max(0, progress) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 8px ${color}66)`,
        }}
      />
    </svg>
  );
};

export const StatsScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grad2X = 40 + Math.sin(frame * 0.012) * 20;
  const grad2Y = 50 + Math.cos(frame * 0.015) * 15;

  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 80 } });
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  const heroStats = [
    {
      label: 'Directories',
      value: data.totalDirectories,
      suffix: '+',
      color: '#818cf8',
      ringMax: 50,
    },
    {
      label: 'Auto Submitted',
      value: (data.submissionStats['auto_submitted'] || 0),
      suffix: '',
      color: '#4ade80',
      ringMax: data.totalDirectories || 24,
    },
    {
      label: 'Manual Ready',
      value: (data.submissionStats['manual_ready'] || 0),
      suffix: '',
      color: '#60a5fa',
      ringMax: data.totalDirectories || 24,
    },
    {
      label: 'Email Ready',
      value: (data.submissionStats['email_ready'] || 0),
      suffix: '',
      color: '#c084fc',
      ringMax: data.totalDirectories || 24,
    },
  ];

  const barData = [
    { label: 'Queued', value: data.submissionStats['queued'] || 0, color: '#f59e0b', icon: '⏳' },
    { label: 'Auto Submitted', value: data.submissionStats['auto_submitted'] || 0, color: '#4ade80', icon: '🚀' },
    { label: 'Manual Ready', value: data.submissionStats['manual_ready'] || 0, color: '#60a5fa', icon: '📋' },
    { label: 'Email Ready', value: data.submissionStats['email_ready'] || 0, color: '#c084fc', icon: '📧' },
    { label: 'Approved', value: data.submissionStats['approved'] || 0, color: '#22d3ee', icon: '✅' },
    { label: 'Retrying', value: data.submissionStats['retrying'] || 0, color: '#f87171', icon: '🔄' },
  ];

  const maxBarValue = Math.max(...barData.map((b) => b.value), 1);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(ellipse at ${grad2X}% ${grad2Y}%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at ${100 - grad2X}% ${100 - grad2Y}%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
          linear-gradient(160deg, #050510 0%, #0a0a20 40%, #0c0820 70%, #050510 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        padding: 60,
      }}
    >
      {/* Grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.4,
        }}
      />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 2 }}>
        <h2
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            opacity: Math.max(0, titleProgress),
            filter: `blur(${titleBlur}px)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: -1.5,
          }}
        >
          Submission{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Dashboard
          </span>
        </h2>
        <p
          style={{
            fontSize: 18,
            color: 'rgba(180, 180, 210, 0.6)',
            margin: '10px 0 0',
            opacity: Math.max(0, spring({ frame: frame - 15, fps, config: { damping: 16 } })),
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Real-time tracking across all directories
        </p>
      </div>

      {/* Hero stat cards with circular progress */}
      <div
        style={{
          display: 'flex',
          gap: 28,
          marginBottom: 44,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {heroStats.map((stat, i) => {
          const delay = 20 + i * 10;
          const cardProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14, mass: 0.6, stiffness: 90 },
          });
          const cardScale = interpolate(Math.max(0, cardProgress), [0, 1], [0.8, 1]);
          const cardOpacity = interpolate(Math.max(0, cardProgress), [0, 1], [0, 1]);
          const cardY = interpolate(Math.max(0, cardProgress), [0, 1], [30, 0]);
          const floatY = Math.sin(frame * 0.03 + i * 1.3) * 3;

          const countProgress = spring({
            frame: frame - delay - 10,
            fps,
            config: { damping: 25, mass: 2, stiffness: 40 },
          });
          const displayValue = Math.round(stat.value * Math.max(0, countProgress));

          return (
            <div
              key={i}
              style={{
                opacity: Math.max(0, cardOpacity),
                transform: `scale(${cardScale}) translateY(${cardY + floatY}px)`,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 20,
                padding: '24px 28px',
                textAlign: 'center',
                minWidth: 180,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${stat.color}44, transparent)`,
                }}
              />

              {/* Circular progress */}
              <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 12px' }}>
                <CircularProgress
                  value={stat.value}
                  max={stat.ringMax}
                  color={stat.color}
                  size={80}
                  strokeWidth={4}
                  frame={frame}
                  delay={delay + 15}
                  fps={fps}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 26,
                    fontWeight: 800,
                    color: stat.color,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  }}
                >
                  {displayValue}{stat.suffix}
                </div>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(180, 180, 210, 0.6)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 500,
                  letterSpacing: 0.3,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Animated bar chart */}
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.01)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 16,
          padding: '24px 28px',
        }}
      >
        {barData.map((bar, i) => {
          const delay = 60 + i * 8;
          const barProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 18, mass: 1.2, stiffness: 50 },
          });
          const barWidth = interpolate(Math.max(0, barProgress), [0, 1], [0, Math.max((bar.value / maxBarValue) * 100, 3)]);
          const barOpacity = interpolate(Math.max(0, barProgress), [0, 1], [0, 1]);
          const countDisplay = Math.round(bar.value * Math.max(0, barProgress));

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: Math.max(0, barOpacity),
              }}
            >
              <div
                style={{
                  width: 120,
                  fontSize: 13,
                  color: 'rgba(180, 180, 210, 0.7)',
                  textAlign: 'right',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 6,
                }}
              >
                {bar.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 24,
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(255, 255, 255, 0.03)',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(barWidth, 0)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${bar.color}cc, ${bar.color})`,
                    borderRadius: 12,
                    boxShadow: `0 0 16px ${bar.color}33`,
                    position: 'relative',
                  }}
                >
                  {/* Shimmer effect */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
                      transform: `translateX(${interpolate(frame % 60, [0, 60], [-100, 200])}%)`,
                      borderRadius: 12,
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  width: 36,
                  fontSize: 15,
                  fontWeight: 700,
                  color: bar.color,
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  textAlign: 'right',
                }}
              >
                {countDisplay}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pulsing live indicator */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          right: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          opacity: Math.max(0, spring({ frame: frame - 30, fps, config: { damping: 16 } })),
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#4ade80',
            boxShadow: `0 0 ${8 + Math.sin(frame * 0.1) * 4}px rgba(74, 222, 128, ${0.4 + Math.sin(frame * 0.1) * 0.2})`,
          }}
        />
        <span
          style={{
            fontSize: 13,
            color: 'rgba(74, 222, 128, 0.8)',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Live
        </span>
      </div>
    </div>
  );
};
