import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

export const IntroScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, mass: 0.5 } });
  const logoRotateY = interpolate(frame, [0, 150], [0, 360], { extrapolateRight: 'clamp' });
  const titleOpacity = spring({ frame: frame - 20, fps, config: { damping: 15 } });
  const titleY = interpolate(
    spring({ frame: frame - 20, fps, config: { damping: 12 } }),
    [0, 1],
    [60, 0]
  );
  const taglineOpacity = spring({ frame: frame - 40, fps, config: { damping: 15 } });
  const taglineY = interpolate(
    spring({ frame: frame - 40, fps, config: { damping: 12 } }),
    [0, 1],
    [40, 0]
  );

  const floatY = Math.sin(frame * 0.05) * 8;
  const glowPulse = 0.5 + Math.sin(frame * 0.08) * 0.3;

  const particleCount = 20;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2 + frame * 0.02;
    const radius = 200 + Math.sin(frame * 0.03 + i) * 50;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.4;
    const z = Math.sin(angle + frame * 0.01) * 100;
    const size = 3 + Math.sin(frame * 0.05 + i * 0.5) * 2;
    const opacity = 0.3 + Math.sin(frame * 0.04 + i) * 0.2;
    return { x, y, z, size, opacity, i };
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
            background: `rgba(99, 102, 241, ${p.opacity})`,
            transform: `translateZ(${p.z}px)`,
            boxShadow: `0 0 ${p.size * 3}px rgba(99, 102, 241, ${p.opacity})`,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(99, 102, 241, ${glowPulse * 0.15}) 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div
        style={{
          transform: `scale(${logoScale}) rotateY(${logoRotateY}deg) translateY(${floatY}px)`,
          transformStyle: 'preserve-3d',
          marginBottom: 40,
        }}
      >
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt={data.companyName}
            style={{
              width: 140,
              height: 140,
              borderRadius: 28,
              objectFit: 'cover',
              boxShadow: `0 20px 60px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, ${glowPulse * 0.3})`,
              border: '3px solid rgba(99, 102, 241, 0.3)',
            }}
          />
        ) : (
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 28,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 60,
              fontWeight: 800,
              color: 'white',
              boxShadow: `0 20px 60px rgba(99, 102, 241, 0.4), 0 0 40px rgba(99, 102, 241, ${glowPulse * 0.3})`,
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
            fontSize: 72,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            letterSpacing: -2,
            textShadow: '0 4px 30px rgba(99, 102, 241, 0.5)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {data.companyName}
        </h1>
      </div>

      <div
        style={{
          opacity: Math.max(0, taglineOpacity),
          transform: `translateY(${taglineY}px)`,
          textAlign: 'center',
          marginTop: 16,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: 'rgba(199, 199, 255, 0.9)',
            margin: 0,
            fontWeight: 400,
            maxWidth: 700,
            lineHeight: 1.4,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {data.tagline || data.descriptionShort}
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 50,
          display: 'flex',
          gap: 12,
          opacity: Math.max(0, spring({ frame: frame - 60, fps, config: { damping: 15 } })),
        }}
      >
        {data.categories.slice(0, 4).map((cat, i) => (
          <div
            key={i}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: 'rgba(199, 199, 255, 0.9)',
              fontSize: 16,
              fontFamily: 'system-ui, -apple-system, sans-serif',
              transform: `translateY(${Math.sin(frame * 0.04 + i * 0.8) * 4}px)`,
            }}
          >
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
};
