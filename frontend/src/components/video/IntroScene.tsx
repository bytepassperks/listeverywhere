import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

function deriveProblemStatement(data: DemoVideoProps): string {
  const desc = (data.descriptionLong || data.descriptionShort || '').toLowerCase();
  const cats = (data.categories || []).map(c => c.toLowerCase());

  if (cats.some(c => c.includes('ai')) && desc.includes('detect')) return 'Tired of AI-detected content?';
  if (cats.some(c => c.includes('ai')) && desc.includes('humaniz')) return 'AI content getting flagged?';
  if (cats.some(c => c.includes('scheduling'))) return 'Still scheduling meetings manually?';
  if (cats.some(c => c.includes('project'))) return 'Drowning in project chaos?';
  if (cats.some(c => c.includes('marketing'))) return 'Marketing not converting?';
  if (cats.some(c => c.includes('seo'))) return 'Invisible on Google?';
  if (cats.some(c => c.includes('analytics'))) return 'Flying blind without data?';
  if (cats.some(c => c.includes('writing'))) return 'Content taking too long?';
  if (cats.some(c => c.includes('productivity'))) return 'Wasting hours every day?';
  if (cats.some(c => c.includes('developer') || c.includes('development'))) return 'Building software the hard way?';
  if (cats.some(c => c.includes('content'))) return "Your content isn't working.";
  if (desc.includes('automat')) return 'Still doing it manually?';
  return `There's a better way.`;
}

function deriveSolutionLine(data: DemoVideoProps): string {
  const name = data.companyName;
  const desc = (data.descriptionLong || data.descriptionShort || '').toLowerCase();

  if (desc.includes('detect') && desc.includes('humaniz')) return `${name} detects & humanizes in seconds`;
  if (desc.includes('schedul')) return `${name} handles scheduling for you`;
  if (desc.includes('automat')) return `${name} automates the hard parts`;
  return data.tagline || `${name} changes everything`;
}

export const IntroScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const problem = deriveProblemStatement(data);
  const solution = deriveSolutionLine(data);

  // Mesh gradient
  const grad2X = 50 + Math.sin(frame * 0.015) * 20;
  const grad2Y = 50 + Math.cos(frame * 0.012) * 20;

  // Phase 1: Problem statement (frames 0-80)
  const problemProgress = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const problemShake = frame > 50 && frame < 65 ? Math.sin(frame * 2.5) * 3 : 0;
  const problemFade = interpolate(frame, [70, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Phase 2: Product reveal (frames 80+)
  const revealFrame = Math.max(0, frame - 85);

  // Explosion particles
  const explosionParticles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const speed = 3 + (i % 5) * 2;
    const life = interpolate(revealFrame, [0, 5, 40], [0, 1, 0], { extrapolateRight: 'clamp' });
    const dist = revealFrame * speed;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const hue = 240 + (i % 3) * 40;
    const size = 3 + (i % 3) * 2;
    return { x, y, hue, size, life, i };
  });

  // Logo entrance
  const logoProgress = spring({ frame: revealFrame, fps, config: { damping: 12, mass: 0.5, stiffness: 100 } });
  const logoScale = interpolate(Math.max(0, logoProgress), [0, 1], [0.1, 1]);
  const logoBlur = interpolate(Math.max(0, logoProgress), [0, 1], [30, 0]);

  // Company name
  const nameProgress = spring({ frame: revealFrame - 10, fps, config: { damping: 14, stiffness: 90 } });
  const nameY = interpolate(Math.max(0, nameProgress), [0, 1], [50, 0]);

  // Solution line
  const solProgress = spring({ frame: revealFrame - 25, fps, config: { damping: 16, stiffness: 80 } });
  const solY = interpolate(Math.max(0, solProgress), [0, 1], [30, 0]);

  // URL pill
  const urlProgress = spring({ frame: revealFrame - 40, fps, config: { damping: 16, stiffness: 100 } });

  // Category badges
  const catStartFrame = revealFrame - 55;

  // Floating particles
  const floatY = Math.sin(frame * 0.04) * 6;

  // Ambient particles
  const particles = Array.from({ length: 35 }, (_, i) => {
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

  // Pulsing glow
  const glowScale = 1 + Math.sin(frame * 0.06) * 0.08;
  const glowOpacity = 0.12 + Math.sin(frame * 0.06) * 0.06;

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
          linear-gradient(160deg, #050510 0%, #0a0a20 40%, #0c0820 70%, #050510 100%)
        `,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Noise */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '256px 256px' }} />

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

      {/* PHASE 1: Problem statement */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: problemFade,
          transform: `translateX(${problemShake}px)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#ef4444',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: -3,
            textAlign: 'center',
            opacity: Math.max(0, problemProgress),
            textShadow: '0 0 60px rgba(239, 68, 68, 0.4), 0 4px 20px rgba(0,0,0,0.5)',
            maxWidth: 900,
            lineHeight: 1.1,
          }}
        >
          {problem}
        </div>
        {/* Red underline */}
        <div
          style={{
            width: interpolate(
              spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } }),
              [0, 1], [0, 300]
            ),
            height: 4,
            background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
            borderRadius: 2,
            marginTop: 20,
          }}
        />
      </div>

      {/* PHASE 2: Product reveal */}
      {frame > 80 && (
        <>
          {/* Explosion particles */}
          {explosionParticles.map((p) => (
            <div
              key={`exp-${p.i}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${p.x}px)`,
                top: `calc(45% + ${p.y}px)`,
                width: p.size,
                height: p.size,
                borderRadius: '50%',
                background: `hsla(${p.hue}, 90%, 70%, ${p.life})`,
                boxShadow: `0 0 ${p.size * 4}px hsla(${p.hue}, 90%, 60%, ${p.life * 0.5})`,
              }}
            />
          ))}

          {/* Logo */}
          <div
            style={{
              transform: `scale(${logoScale}) translateY(${floatY}px)`,
              filter: `blur(${logoBlur}px)`,
              marginBottom: 30,
              position: 'relative',
              zIndex: 5,
            }}
          >
            <div style={{ position: 'absolute', inset: -20, borderRadius: 40, background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)', filter: 'blur(20px)' }} />
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt={data.companyName}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 26,
                  objectFit: 'cover',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                  position: 'relative',
                }}
              />
            ) : (
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 26,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  fontWeight: 800,
                  color: 'white',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
                  position: 'relative',
                }}
              >
                {data.companyName.charAt(0)}
              </div>
            )}
          </div>

          {/* Company name */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: 'white',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: -3,
              textShadow: '0 4px 40px rgba(99, 102, 241, 0.3)',
              opacity: Math.max(0, nameProgress),
              transform: `translateY(${nameY}px)`,
              zIndex: 5,
            }}
          >
            {data.companyName}
          </div>

          {/* Solution line */}
          <div
            style={{
              fontSize: 28,
              color: 'rgba(200, 200, 230, 0.85)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              marginTop: 12,
              opacity: Math.max(0, solProgress),
              transform: `translateY(${solY}px)`,
              zIndex: 5,
            }}
          >
            {solution}
          </div>

          {/* URL pill */}
          <div
            style={{
              marginTop: 24,
              padding: '8px 24px',
              borderRadius: 100,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              opacity: Math.max(0, urlProgress),
              transform: `scale(${interpolate(Math.max(0, urlProgress), [0, 1], [0.8, 1])})`,
              zIndex: 5,
            }}
          >
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
              {data.website}
            </span>
          </div>

          {/* Category badges */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center', zIndex: 5 }}>
            {(data.categories || []).slice(0, 4).map((cat, i) => {
              const badgeProgress = spring({ frame: catStartFrame - i * 5, fps, config: { damping: 16, stiffness: 100 } });
              return (
                <div
                  key={i}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 100,
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    color: 'rgba(200, 200, 240, 0.8)',
                    fontSize: 14,
                    fontFamily: 'system-ui, sans-serif',
                    opacity: Math.max(0, badgeProgress),
                    transform: `scale(${interpolate(Math.max(0, badgeProgress), [0, 1], [0.7, 1])})`,
                  }}
                >
                  {cat}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
