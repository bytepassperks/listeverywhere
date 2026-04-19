import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

export const OutroScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.5 } });
  const floatY = Math.sin(frame * 0.05) * 6;
  const glowPulse = 0.5 + Math.sin(frame * 0.08) * 0.3;

  const titleOpacity = spring({ frame: frame - 15, fps, config: { damping: 15 } });
  const titleY = interpolate(
    spring({ frame: frame - 15, fps, config: { damping: 12 } }),
    [0, 1],
    [40, 0]
  );

  const ctaOpacity = spring({ frame: frame - 40, fps, config: { damping: 15 } });
  const ctaScale = spring({ frame: frame - 40, fps, config: { damping: 10, mass: 0.8 } });

  const ringCount = 3;
  const rings = Array.from({ length: ringCount }, (_, i) => {
    const progress = ((frame * 0.01 + i * 0.33) % 1);
    const scale = 0.5 + progress * 2;
    const opacity = (1 - progress) * 0.15;
    return { scale, opacity, i };
  });

  const particleCount = 30;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2 + frame * 0.015;
    const radius = 250 + Math.sin(frame * 0.02 + i * 0.5) * 80;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.5;
    const size = 2 + Math.sin(frame * 0.04 + i) * 1.5;
    const opacity = 0.2 + Math.sin(frame * 0.03 + i * 0.7) * 0.15;
    return { x, y, size, opacity, i };
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
        perspective: '1200px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {particles.map((p) => (
        <div
          key={p.i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${p.x}px)`,
            top: `calc(50% + ${p.y}px)`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `rgba(139, 92, 246, ${p.opacity})`,
            boxShadow: `0 0 ${p.size * 4}px rgba(139, 92, 246, ${p.opacity})`,
          }}
        />
      ))}

      {rings.map((ring) => (
        <div
          key={ring.i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 200,
            height: 200,
            borderRadius: '50%',
            border: `2px solid rgba(99, 102, 241, ${ring.opacity})`,
            transform: `translate(-50%, -50%) scale(${ring.scale})`,
          }}
        />
      ))}

      <div
        style={{
          transform: `scale(${logoScale}) translateY(${floatY}px)`,
          marginBottom: 30,
        }}
      >
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt={data.companyName}
            style={{
              width: 100,
              height: 100,
              borderRadius: 22,
              objectFit: 'cover',
              boxShadow: `0 16px 50px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, ${glowPulse * 0.3})`,
              border: '2px solid rgba(99, 102, 241, 0.3)',
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 800,
              color: 'white',
              boxShadow: `0 16px 50px rgba(99, 102, 241, 0.4), 0 0 30px rgba(99, 102, 241, ${glowPulse * 0.3})`,
            }}
          >
            {data.companyName.charAt(0)}
          </div>
        )}
      </div>

      <div
        style={{
          opacity: Math.max(0, titleOpacity),
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            letterSpacing: -2,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {data.companyName}
        </h1>
        <p
          style={{
            fontSize: 22,
            color: 'rgba(199, 199, 255, 0.7)',
            marginTop: 12,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Listed on {data.totalDirectories}+ startup directories
        </p>
      </div>

      <div
        style={{
          marginTop: 40,
          opacity: Math.max(0, ctaOpacity),
          transform: `scale(${ctaScale})`,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            padding: '18px 48px',
            borderRadius: 16,
            fontSize: 22,
            fontWeight: 700,
            color: 'white',
            boxShadow: `0 8px 30px rgba(99, 102, 241, 0.4), 0 0 20px rgba(99, 102, 241, ${glowPulse * 0.3})`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 0.5,
          }}
        >
          {data.website}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          gap: 24,
          opacity: Math.max(0, spring({ frame: frame - 60, fps, config: { damping: 15 } })),
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: 'rgba(199, 199, 255, 0.4)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Powered by ListEverywhere
        </span>
      </div>
    </div>
  );
};
