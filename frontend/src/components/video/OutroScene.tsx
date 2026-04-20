import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

export const OutroScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grad2X = 50 + Math.sin(frame * 0.01) * 15;
  const grad2Y = 50 + Math.cos(frame * 0.013) * 10;

  // Logo entrance
  const logoProgress = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.6, stiffness: 80 } });
  const logoScale = interpolate(Math.max(0, logoProgress), [0, 1], [0.4, 1]);
  const logoBlur = interpolate(Math.max(0, logoProgress), [0, 1], [15, 0]);
  const floatY = Math.sin(frame * 0.035) * 5;
  const floatRotX = Math.sin(frame * 0.02) * 2;
  const floatRotY = Math.cos(frame * 0.025) * 2;

  // Glow rings expanding outward
  const ringCount = 4;
  const rings = Array.from({ length: ringCount }, (_, i) => {
    const cycleLength = 120;
    const offset = (i / ringCount) * cycleLength;
    const progress = ((frame + offset) % cycleLength) / cycleLength;
    const scale = 0.3 + progress * 2.5;
    const opacity = (1 - progress) * 0.08;
    return { scale, opacity, i };
  });

  // Title text
  const titleProgress = spring({ frame: frame - 20, fps, config: { damping: 16, stiffness: 80 } });
  const titleY = interpolate(Math.max(0, titleProgress), [0, 1], [30, 0]);
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [8, 0]);

  // Subtitle
  const subProgress = spring({ frame: frame - 35, fps, config: { damping: 16, stiffness: 80 } });
  const subY = interpolate(Math.max(0, subProgress), [0, 1], [20, 0]);

  // CTA button
  const ctaProgress = spring({ frame: frame - 55, fps, config: { damping: 12, mass: 0.6, stiffness: 90 } });
  const ctaScale = interpolate(Math.max(0, ctaProgress), [0, 1], [0.8, 1]);
  const ctaY = interpolate(Math.max(0, ctaProgress), [0, 1], [20, 0]);

  // Stats row at bottom
  const statsStartFrame = 70;
  const catCount = (data.categories || []).length;
  const outroStats = [
    { label: 'Categories', value: `${catCount || 5}+` },
    { label: 'Pricing', value: (data.pricingModel || 'Free').charAt(0).toUpperCase() + (data.pricingModel || 'free').slice(1) },
    { label: 'Features', value: '6+' },
    { label: 'Availability', value: '24/7' },
  ];

  // Ambient particles
  const particles = Array.from({ length: 50 }, (_, i) => {
    const seed = i * 137.508;
    const baseAngle = (seed % 360) * (Math.PI / 180);
    const speed = 0.006 + (i % 6) * 0.002;
    const radius = 250 + (i % 8) * 50;
    const angle = baseAngle + frame * speed;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.5;
    const size = 1 + (i % 3) * 0.7;
    const brightness = 0.1 + Math.sin(frame * 0.025 + i * 0.6) * 0.08;
    const hue = 250 + (i % 4) * 25;
    return { x, y, size, brightness, hue, i };
  });

  // Decorative line
  const lineWidth = interpolate(
    Math.max(0, spring({ frame: frame - 45, fps, config: { damping: 20, stiffness: 60 } })),
    [0, 1],
    [0, 200]
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `
          radial-gradient(ellipse at ${grad2X}% ${grad2Y}%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at ${100 - grad2X}% ${100 - grad2Y}%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
          linear-gradient(160deg, #050510 0%, #08081e 30%, #0c0a24 60%, #050510 100%)
        `,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ambient particles */}
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
            background: `hsla(${p.hue}, 80%, 70%, ${p.brightness})`,
            boxShadow: `0 0 ${p.size * 5}px hsla(${p.hue}, 80%, 60%, ${p.brightness * 0.5})`,
          }}
        />
      ))}

      {/* Expanding glow rings */}
      {rings.map((ring) => (
        <div
          key={ring.i}
          style={{
            position: 'absolute',
            top: '45%',
            left: '50%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: `1.5px solid rgba(99, 102, 241, ${ring.opacity})`,
            transform: `translate(-50%, -50%) scale(${ring.scale})`,
            boxShadow: `0 0 20px rgba(99, 102, 241, ${ring.opacity * 0.3})`,
          }}
        />
      ))}

      {/* Central large glow */}
      <div
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(99, 102, 241, ${0.12 + Math.sin(frame * 0.05) * 0.04}) 0%, transparent 60%)`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale}) translateY(${floatY}px) perspective(600px) rotateX(${floatRotX}deg) rotateY(${floatRotY}deg)`,
          filter: `blur(${logoBlur}px)`,
          marginBottom: 28,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -16,
            borderRadius: 36,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
            filter: 'blur(16px)',
          }}
        />
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt={data.companyName}
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              objectFit: 'cover',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              position: 'relative',
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 800,
              color: 'white',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              position: 'relative',
            }}
          >
            {data.companyName.charAt(0)}
          </div>
        )}
      </div>

      {/* Main title */}
      <div
        style={{
          opacity: Math.max(0, titleProgress),
          transform: `translateY(${titleY}px)`,
          filter: `blur(${titleBlur}px)`,
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <h1
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            letterSpacing: -2.5,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Try{' '}
          <span
            style={{
              color: '#a78bfa',
            }}
          >
            {data.companyName} Today
          </span>
        </h1>
      </div>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 20,
          color: 'rgba(180, 180, 210, 0.7)',
          marginTop: 14,
          opacity: Math.max(0, subProgress),
          transform: `translateY(${subY}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 400,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {data.tagline || data.descriptionShort || `Discover what ${data.companyName} can do for you`}
      </p>

      {/* Decorative line */}
      <div
        style={{
          width: lineWidth,
          height: 1.5,
          background: 'linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.4), transparent)',
          margin: '24px 0',
          borderRadius: 1,
          position: 'relative',
          zIndex: 2,
        }}
      />

      {/* CTA button */}
      <div
        style={{
          opacity: Math.max(0, ctaProgress),
          transform: `scale(${ctaScale}) translateY(${ctaY}px)`,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            padding: '14px 40px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            letterSpacing: -0.3,
          }}
        >
          <span>{data.website}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          display: 'flex',
          gap: 48,
          zIndex: 2,
        }}
      >
        {outroStats.map((stat, i) => {
          const statProgress = spring({
            frame: frame - statsStartFrame - i * 6,
            fps,
            config: { damping: 14, stiffness: 100 },
          });
          const statOpacity = interpolate(Math.max(0, statProgress), [0, 1], [0, 1]);
          const statY = interpolate(Math.max(0, statProgress), [0, 1], [15, 0]);

          return (
            <div
              key={i}
              style={{
                textAlign: 'center',
                opacity: statOpacity,
                transform: `translateY(${statY}px)`,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: 'white',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: -0.5,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(180, 180, 210, 0.5)',
                  fontWeight: 500,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  marginTop: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom gradient */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          background: 'linear-gradient(to top, rgba(5, 5, 16, 0.5) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
