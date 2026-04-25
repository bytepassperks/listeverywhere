import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

function deriveCTAText(data: DemoVideoProps): string {
  const pricing = (data.pricingModel || 'freemium').toLowerCase();
  if (pricing === 'free') return 'Get Started Free';
  if (pricing === 'freemium') return 'Try Free Now';
  return 'Start Your Free Trial';
}

function deriveUrgencyText(data: DemoVideoProps): string {
  const cats = (data.categories || []).map(c => c.toLowerCase());
  const shortDesc = (data.descriptionShort || data.tagline || '').toLowerCase();

  if (cats.some(c => c.includes('seo'))) return 'Join 500+ businesses ranking #1';
  if (shortDesc.includes('detect') || shortDesc.includes('humaniz')) return 'Join 10K+ content creators';
  if (cats.some(c => c.includes('scheduling'))) return 'Save 5+ hours every week';
  if (cats.some(c => c.includes('content'))) return 'Join 1K+ content teams';
  if (cats.some(c => c.includes('marketing'))) return 'Boost conversions starting today';
  if (shortDesc.includes('automat')) return 'Automate your workflow today';
  return `Join thousands using ${data.companyName}`;
}

export const OutroScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaText = deriveCTAText(data);
  const urgencyText = deriveUrgencyText(data);

  const grad2X = 50 + Math.sin(frame * 0.01) * 15;
  const grad2Y = 50 + Math.cos(frame * 0.013) * 10;

  // Logo entrance
  const logoProgress = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.6, stiffness: 80 } });
  const logoScale = interpolate(Math.max(0, logoProgress), [0, 1], [0.4, 1]);
  const logoBlur = interpolate(Math.max(0, logoProgress), [0, 1], [15, 0]);
  const floatY = Math.sin(frame * 0.035) * 5;

  // Expanding glow rings
  const rings = Array.from({ length: 4 }, (_, i) => {
    const cycleLength = 120;
    const offset = (i / 4) * cycleLength;
    const progress = ((frame + offset) % cycleLength) / cycleLength;
    const scale = 0.3 + progress * 2.5;
    const opacity = (1 - progress) * 0.08;
    return { scale, opacity, i };
  });

  // Title
  const titleProgress = spring({ frame: frame - 20, fps, config: { damping: 16, stiffness: 80 } });
  const titleY = interpolate(Math.max(0, titleProgress), [0, 1], [30, 0]);
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [8, 0]);

  // Urgency text
  const urgencyProgress = spring({ frame: frame - 35, fps, config: { damping: 16, stiffness: 80 } });

  // CTA button — pulsing
  const ctaProgress = spring({ frame: frame - 50, fps, config: { damping: 12, mass: 0.6, stiffness: 90 } });
  const ctaScale = interpolate(Math.max(0, ctaProgress), [0, 1], [0.6, 1]);
  const ctaY = interpolate(Math.max(0, ctaProgress), [0, 1], [30, 0]);
  const ctaPulse = 1 + Math.sin(frame * 0.12) * 0.03;

  // Arrow bouncing on CTA
  const arrowBounce = Math.sin(frame * 0.15) * 3;

  // URL
  const urlProgress = spring({ frame: frame - 70, fps, config: { damping: 16, stiffness: 100 } });

  // Bottom stats
  const statsStart = 85;
  const catCount = (data.categories || []).length;
  const outroStats = [
    { label: 'Categories', value: `${catCount || 5}+` },
    { label: 'Pricing', value: (data.pricingModel || 'Free').charAt(0).toUpperCase() + (data.pricingModel || 'free').slice(1) },
    { label: 'Features', value: '6+' },
    { label: 'Available', value: '24/7' },
  ];

  // Countdown-style urgency number
  const countdownProgress = spring({ frame: frame - 40, fps, config: { damping: 20, stiffness: 60 } });
  const spotsLeft = Math.max(1, Math.floor(50 - 50 * Math.max(0, countdownProgress) * 0.6));

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
          linear-gradient(160deg, #050510 0%, #08081e 30%, #0c0a24 60%, #050510 100%)
        `,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Particles */}
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

      {/* Glow rings */}
      {rings.map((ring) => (
        <div
          key={ring.i}
          style={{
            position: 'absolute',
            top: '42%',
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

      {/* Central glow */}
      <div style={{
        position: 'absolute',
        top: '42%',
        left: '50%',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
        transform: 'translate(-50%, -50%)',
      }} />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale}) translateY(${floatY}px)`,
          filter: `blur(${logoBlur}px)`,
          marginBottom: 24,
          position: 'relative',
          zIndex: 5,
        }}
      >
        <div style={{ position: 'absolute', inset: -16, borderRadius: 36, background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)', filter: 'blur(16px)' }} />
        {data.logoUrl ? (
          <img
            src={data.logoUrl}
            alt={data.companyName}
            style={{
              width: 90,
              height: 90,
              borderRadius: 22,
              objectFit: 'cover',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
              position: 'relative',
            }}
          />
        ) : (
          <div style={{
            width: 90,
            height: 90,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            fontWeight: 800,
            color: 'white',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
            position: 'relative',
          }}>
            {data.companyName.charAt(0)}
          </div>
        )}
      </div>

      {/* "Try [Product] Today" */}
      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: -2,
          textAlign: 'center',
          opacity: Math.max(0, titleProgress),
          transform: `translateY(${titleY}px)`,
          filter: `blur(${titleBlur}px)`,
          textShadow: '0 4px 40px rgba(99, 102, 241, 0.3)',
          zIndex: 5,
          maxWidth: 800,
        }}
      >
        Try{' '}
        <span style={{ color: '#a78bfa' }}>{data.companyName}</span>
        {' '}Today
      </div>

      {/* Urgency text */}
      <div
        style={{
          fontSize: 20,
          color: 'rgba(200, 200, 230, 0.7)',
          fontFamily: 'system-ui, sans-serif',
          marginTop: 12,
          opacity: Math.max(0, urgencyProgress),
          zIndex: 5,
        }}
      >
        {urgencyText} {'\u2022'} Only{' '}
        <span style={{ color: '#fbbf24', fontWeight: 700 }}>{spotsLeft}</span>
        {' '}free spots left
      </div>

      {/* Pulsing CTA Button */}
      <div
        style={{
          marginTop: 32,
          opacity: Math.max(0, ctaProgress),
          transform: `scale(${ctaScale * ctaPulse}) translateY(${ctaY}px)`,
          zIndex: 5,
        }}
      >
        <div style={{
          padding: '18px 56px',
          borderRadius: 100,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{
            fontSize: 24,
            fontWeight: 800,
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: 0.5,
          }}>
            {ctaText}
          </span>
          <span style={{
            fontSize: 20,
            transform: `translateX(${arrowBounce}px)`,
            display: 'inline-block',
          }}>
            {'\u2192'}
          </span>
        </div>
      </div>

      {/* Website URL */}
      <div
        style={{
          marginTop: 20,
          opacity: Math.max(0, urlProgress),
          zIndex: 5,
        }}
      >
        <span style={{
          fontSize: 18,
          color: 'rgba(99, 102, 241, 0.7)',
          fontFamily: 'monospace',
          letterSpacing: 1,
        }}>
          {data.website}
        </span>
      </div>

      {/* Stats row at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 70,
        display: 'flex',
        gap: 60,
        zIndex: 5,
      }}>
        {outroStats.map((stat, i) => {
          const statProgress = spring({ frame: frame - statsStart - i * 8, fps, config: { damping: 16, stiffness: 90 } });
          return (
            <div
              key={i}
              style={{
                textAlign: 'center',
                opacity: Math.max(0, statProgress),
                transform: `translateY(${interpolate(Math.max(0, statProgress), [0, 1], [20, 0])}px)`,
              }}
            >
              <div style={{
                fontSize: 28,
                fontWeight: 800,
                color: 'white',
                fontFamily: 'system-ui, sans-serif',
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: 12,
                color: 'rgba(180, 180, 210, 0.5)',
                fontFamily: 'system-ui, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginTop: 4,
              }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
