import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

const FEATURES = [
  {
    title: 'Auto Submission',
    desc: 'Submit to directories automatically via API & intelligent form filling',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    iconBg: 'rgba(99, 102, 241, 0.15)',
    accent: '#818cf8',
  },
  {
    title: 'AI Extraction',
    desc: 'Intelligent metadata extraction powered by advanced language models',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
    iconBg: 'rgba(139, 92, 246, 0.15)',
    accent: '#a78bfa',
  },
  {
    title: 'Smart Categories',
    desc: 'Auto-mapped taxonomy for each directory with precision matching',
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
    iconBg: 'rgba(6, 182, 212, 0.15)',
    accent: '#22d3ee',
  },
  {
    title: 'Screenshot Gen',
    desc: 'Automated high-resolution homepage & feature page captures',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    accent: '#fbbf24',
  },
  {
    title: 'Bulk Processing',
    desc: 'Agency mode for processing hundreds of startups simultaneously',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
    iconBg: 'rgba(34, 197, 94, 0.15)',
    accent: '#4ade80',
  },
  {
    title: 'Weekly Updates',
    desc: 'Auto-recrawl and update all submissions with fresh data weekly',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    iconBg: 'rgba(236, 72, 153, 0.15)',
    accent: '#f472b6',
  },
];

const ICONS = [
  // Rocket
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  // Brain
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
      <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
      <path d="M6 18a4 4 0 0 1-1.967-.516"/>
      <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
    </svg>
  ),
  // Target
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  // Camera
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  // Layers
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
    </svg>
  ),
  // Refresh
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  ),
];

export const FeaturesScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grad2X = 30 + Math.sin(frame * 0.012) * 20;
  const grad2Y = 40 + Math.cos(frame * 0.015) * 15;

  // Section title
  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 80 } });
  const titleY = interpolate(Math.max(0, titleProgress), [0, 1], [40, 0]);
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  // Subtitle
  const subProgress = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 80 } });
  const subY = interpolate(Math.max(0, subProgress), [0, 1], [30, 0]);

  // Decorative line
  const lineWidth = interpolate(
    spring({ frame: frame - 25, fps, config: { damping: 20, stiffness: 60 } }),
    [0, 1],
    [0, 120]
  );

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
        padding: 80,
      }}
    >
      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.5,
        }}
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 56, position: 'relative', zIndex: 2 }}>
        <h2
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            opacity: Math.max(0, titleProgress),
            transform: `translateY(${titleY}px)`,
            filter: `blur(${titleBlur}px)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: -2,
          }}
        >
          Powered by{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Automation
          </span>
        </h2>
        <p
          style={{
            fontSize: 20,
            color: 'rgba(180, 180, 210, 0.7)',
            margin: 0,
            marginTop: 14,
            opacity: Math.max(0, subProgress),
            transform: `translateY(${subY}px)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 400,
          }}
        >
          Everything {data.companyName} needs to get listed on {data.totalDirectories}+ directories
        </p>
        {/* Decorative line */}
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
            margin: '20px auto 0',
            borderRadius: 1,
          }}
        />
      </div>

      {/* Feature cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          maxWidth: 1280,
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {FEATURES.map((feat, i) => {
          const delay = 30 + i * 10;
          const cardProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14, mass: 0.6, stiffness: 90 },
          });
          const cardScale = interpolate(Math.max(0, cardProgress), [0, 1], [0.85, 1]);
          const cardOpacity = interpolate(Math.max(0, cardProgress), [0, 1], [0, 1]);
          const cardY = interpolate(Math.max(0, cardProgress), [0, 1], [40, 0]);
          const cardBlur = interpolate(Math.max(0, cardProgress), [0, 1], [6, 0]);

          // Subtle floating per card
          const floatY = Math.sin(frame * 0.03 + i * 1.1) * 3;
          const floatRotate = Math.sin(frame * 0.02 + i * 0.9) * 0.5;

          // Icon rotation
          const iconRotate = Math.sin(frame * 0.04 + i * 0.7) * 5;

          return (
            <div
              key={i}
              style={{
                opacity: Math.max(0, cardOpacity),
                transform: `scale(${cardScale}) translateY(${cardY + floatY}px) rotate(${floatRotate}deg)`,
                filter: `blur(${cardBlur}px)`,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 20,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Card inner glow */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${feat.accent}33, transparent)`,
                }}
              />

              {/* Icon container */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: feat.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `rotate(${iconRotate}deg)`,
                  border: `1px solid ${feat.accent}22`,
                }}
              >
                {ICONS[i](feat.accent)}
              </div>

              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: -0.3,
                }}
              >
                {feat.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(180, 180, 210, 0.6)',
                  margin: 0,
                  lineHeight: 1.6,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 400,
                }}
              >
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
