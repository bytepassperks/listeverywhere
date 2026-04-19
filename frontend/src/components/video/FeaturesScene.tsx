import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

const FEATURE_ICONS = ['🚀', '⚡', '🎯', '🔒', '📊', '🌐'];

export const FeaturesScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = [
    { title: 'Auto Submission', desc: 'Submit to directories automatically via API & form filling' },
    { title: 'AI Extraction', desc: 'Intelligent metadata extraction from your website' },
    { title: 'Smart Categories', desc: 'Auto-mapped categories for each directory' },
    { title: 'Screenshot Gen', desc: 'Automated homepage & feature screenshots' },
    { title: 'Bulk Processing', desc: 'Agency mode for processing multiple startups' },
    { title: 'Weekly Updates', desc: 'Auto-recrawl and update submissions weekly' },
  ];

  const titleProgress = spring({ frame, fps, config: { damping: 15 } });
  const titleY = interpolate(titleProgress, [0, 1], [50, 0]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1500px',
        overflow: 'hidden',
        position: 'relative',
        padding: 60,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -200,
          right: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
        }}
      />

      <h2
        style={{
          fontSize: 52,
          fontWeight: 800,
          color: 'white',
          marginBottom: 60,
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
          textShadow: '0 4px 30px rgba(99, 102, 241, 0.3)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: -1,
        }}
      >
        {data.companyName} on{' '}
        <span style={{ color: '#818cf8' }}>{data.totalDirectories}+ Directories</span>
      </h2>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 28,
          maxWidth: 1200,
          width: '100%',
        }}
      >
        {features.map((feat, i) => {
          const delay = i * 8;
          const cardProgress = spring({
            frame: frame - delay - 10,
            fps,
            config: { damping: 12, mass: 0.8 },
          });
          const cardScale = interpolate(cardProgress, [0, 1], [0.7, 1]);
          const cardOpacity = interpolate(cardProgress, [0, 1], [0, 1]);
          const cardRotateX = interpolate(cardProgress, [0, 1], [25, 0]);
          const floatY = Math.sin(frame * 0.04 + i * 1.2) * 5;
          const floatRotate = Math.sin(frame * 0.03 + i * 0.8) * 1.5;

          return (
            <div
              key={i}
              style={{
                opacity: Math.max(0, cardOpacity),
                transform: `scale(${cardScale}) rotateX(${cardRotateX}deg) translateY(${floatY}px) rotate(${floatRotate}deg)`,
                transformStyle: 'preserve-3d',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                borderRadius: 20,
                padding: 30,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  transform: `translateZ(40px) rotate(${Math.sin(frame * 0.06 + i) * 10}deg)`,
                }}
              >
                {FEATURE_ICONS[i]}
              </div>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {feat.title}
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: 'rgba(199, 199, 255, 0.7)',
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
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
