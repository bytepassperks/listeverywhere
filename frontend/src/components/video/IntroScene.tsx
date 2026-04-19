import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

export const IntroScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Mesh gradient animation
  const gradAngle = interpolate(frame, [0, 240], [135, 180], { extrapolateRight: 'clamp' });
  const grad2X = 50 + Math.sin(frame * 0.015) * 20;
  const grad2Y = 50 + Math.cos(frame * 0.012) * 20;

  // Logo entrance - scale + subtle 3D tilt
  const logoProgress = spring({ frame, fps, config: { damping: 14, mass: 0.6, stiffness: 80 } });
  const logoScale = interpolate(logoProgress, [0, 1], [0.3, 1]);
  const logoBlur = interpolate(logoProgress, [0, 1], [20, 0]);
  const logoY = interpolate(logoProgress, [0, 1], [40, 0]);

  // Floating motion for logo
  const floatY = Math.sin(frame * 0.04) * 6;
  const floatRotX = Math.sin(frame * 0.025) * 3;
  const floatRotY = Math.cos(frame * 0.03) * 3;

  // Glow ring that pulses
  const glowScale = 1 + Math.sin(frame * 0.06) * 0.08;
  const glowOpacity = 0.12 + Math.sin(frame * 0.06) * 0.06;

  // Company name - character-by-character reveal
  const nameChars = data.companyName.split('');
  const nameStartFrame = 25;

  // Tagline - word-by-word fade up
  const taglineText = data.tagline || data.descriptionShort || '';
  const taglineWords = taglineText.split(' ');
  const taglineStartFrame = 55;

  // Website URL pill
  const urlProgress = spring({ frame: frame - 80, fps, config: { damping: 16, stiffness: 100 } });
  const urlScale = interpolate(Math.max(0, urlProgress), [0, 1], [0.8, 1]);
  const urlOpacity = Math.max(0, urlProgress);

  // Category badges stagger
  const catStartFrame = 100;

  // Ambient particles - more refined, varied sizes
  const particles = Array.from({ length: 40 }, (_, i) => {
    const seed = i * 137.508;
    const baseAngle = (seed % 360) * (Math.PI / 180);
    const speed = 0.008 + (i % 5) * 0.003;
    const radius = 300 + (i % 7) * 60;
    const angle = baseAngle + frame * speed;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.45;
    const size = 1.5 + (i % 4) * 0.8;
    const brightness = 0.15 + Math.sin(frame * 0.03 + i * 0.8) * 0.1;
    const hue = 240 + (i % 3) * 30;
    return { x, y, size, brightness, hue, i };
  });

  // Decorative orbit rings
  const orbitRings = Array.from({ length: 3 }, (_, i) => {
    const ringProgress = spring({ frame: frame - i * 15, fps, config: { damping: 20, stiffness: 60 } });
    const scale = interpolate(Math.max(0, ringProgress), [0, 1], [0.3, 0.8 + i * 0.25]);
    const opacity = interpolate(Math.max(0, ringProgress), [0, 1], [0, 0.06 - i * 0.015]);
    const rotation = frame * (0.15 - i * 0.03);
    return { scale, opacity, rotation, i };
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
        background: `
          radial-gradient(ellipse at ${grad2X}% ${grad2Y}%, rgba(99, 102, 241, 0.12) 0%, transparent 50%),
          radial-gradient(ellipse at ${100 - grad2X}% ${100 - grad2Y}%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
          linear-gradient(${gradAngle}deg, #050510 0%, #0a0a20 40%, #0c0820 70%, #050510 100%)
        `,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
        }}
      />

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
            boxShadow: `0 0 ${p.size * 6}px hsla(${p.hue}, 80%, 60%, ${p.brightness * 0.5})`,
          }}
        />
      ))}

      {/* Orbit rings */}
      {orbitRings.map((ring) => (
        <div
          key={ring.i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            border: `1px solid rgba(99, 102, 241, ${Math.max(0, ring.opacity)})`,
            transform: `translate(-50%, -50%) scale(${Math.max(0.01, ring.scale)}) rotate(${ring.rotation}deg)`,
          }}
        />
      ))}

      {/* Central glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(99, 102, 241, ${glowOpacity}) 0%, transparent 70%)`,
          transform: `translate(-50%, -60%) scale(${glowScale})`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale}) translateY(${logoY + floatY}px) perspective(800px) rotateX(${floatRotX}deg) rotateY(${floatRotY}deg)`,
          filter: `blur(${logoBlur}px)`,
          marginBottom: 36,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: 40,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt={data.companyName}
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              objectFit: 'cover',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              position: 'relative',
            }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 52,
              fontWeight: 800,
              color: 'white',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              position: 'relative',
            }}
          >
            {data.companyName.charAt(0)}
          </div>
        )}
      </div>

      {/* Company name - character reveal */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            letterSpacing: -3,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {nameChars.map((char, i) => {
            const charProgress = spring({
              frame: frame - nameStartFrame - i * 2,
              fps,
              config: { damping: 15, mass: 0.4, stiffness: 120 },
            });
            const charOpacity = interpolate(Math.max(0, charProgress), [0, 1], [0, 1]);
            const charY = interpolate(Math.max(0, charProgress), [0, 1], [30, 0]);
            const charBlur = interpolate(Math.max(0, charProgress), [0, 1], [8, 0]);

            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: charOpacity,
                  transform: `translateY(${charY}px)`,
                  filter: `blur(${charBlur}px)`,
                  textShadow: '0 4px 40px rgba(99, 102, 241, 0.3)',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
        </h1>
      </div>

      {/* Tagline - word-by-word */}
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: 800,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {taglineWords.map((word, i) => {
          const wordProgress = spring({
            frame: frame - taglineStartFrame - i * 3,
            fps,
            config: { damping: 18, mass: 0.5 },
          });
          const wordOpacity = interpolate(Math.max(0, wordProgress), [0, 1], [0, 1]);
          const wordY = interpolate(Math.max(0, wordProgress), [0, 1], [20, 0]);

          return (
            <span
              key={i}
              style={{
                fontSize: 28,
                color: 'rgba(200, 200, 230, 0.85)',
                fontWeight: 400,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                opacity: wordOpacity,
                transform: `translateY(${wordY}px)`,
                display: 'inline-block',
                lineHeight: 1.5,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      {/* Website URL glass pill */}
      <div
        style={{
          marginTop: 32,
          opacity: urlOpacity,
          transform: `scale(${urlScale})`,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            padding: '10px 28px',
            borderRadius: 50,
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)',
            }}
          />
          <span
            style={{
              fontSize: 16,
              color: 'rgba(200, 200, 230, 0.7)',
              fontFamily: 'ui-monospace, "SF Mono", monospace',
              fontWeight: 500,
              letterSpacing: 0.5,
            }}
          >
            {data.website}
          </span>
        </div>
      </div>

      {/* Category badges */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          display: 'flex',
          gap: 12,
          zIndex: 2,
        }}
      >
        {data.categories.slice(0, 4).map((cat, i) => {
          const catProgress = spring({
            frame: frame - catStartFrame - i * 6,
            fps,
            config: { damping: 14, stiffness: 100 },
          });
          const catOpacity = interpolate(Math.max(0, catProgress), [0, 1], [0, 1]);
          const catY = interpolate(Math.max(0, catProgress), [0, 1], [20, 0]);
          const catScale = interpolate(Math.max(0, catProgress), [0, 1], [0.8, 1]);
          const floatCatY = Math.sin(frame * 0.035 + i * 1.2) * 3;

          return (
            <div
              key={i}
              style={{
                padding: '8px 22px',
                borderRadius: 24,
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                color: 'rgba(165, 165, 220, 0.9)',
                fontSize: 15,
                fontWeight: 500,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                opacity: catOpacity,
                transform: `translateY(${catY + floatCatY}px) scale(${catScale})`,
                backdropFilter: 'blur(8px)',
              }}
            >
              {cat}
            </div>
          );
        })}
      </div>

      {/* Subtle bottom gradient fade */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          background: 'linear-gradient(to top, rgba(5, 5, 16, 0.6) 0%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
