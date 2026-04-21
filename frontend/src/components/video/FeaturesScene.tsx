import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

function deriveNotifications(data: DemoVideoProps): { name: string; action: string }[] {
  const name = data.companyName;
  const desc = (data.descriptionLong || data.descriptionShort || '').toLowerCase();
  const names = ['Sarah', 'Alex', 'James', 'Emma', 'David', 'Lisa'];

  if (desc.includes('detect') || desc.includes('humaniz')) {
    return [
      { name: names[0], action: 'just humanized 3 documents' },
      { name: names[1], action: 'passed AI detection 100%' },
      { name: names[2], action: `signed up for ${name}` },
      { name: names[3], action: 'upgraded to Pro plan' },
    ];
  }
  if (desc.includes('schedul')) {
    return [
      { name: names[0], action: 'scheduled 5 meetings' },
      { name: names[1], action: `just signed up for ${name}` },
      { name: names[2], action: 'saved 2 hours today' },
      { name: names[3], action: 'booked a team call' },
    ];
  }
  return [
    { name: names[0], action: `just signed up for ${name}` },
    { name: names[1], action: 'upgraded to Pro' },
    { name: names[2], action: 'invited their team' },
    { name: names[3], action: `loves ${name}!` },
  ];
}

function deriveUserCount(data: DemoVideoProps): string {
  const cats = data.categories || [];
  if (cats.length >= 4) return '10,000+';
  if (cats.length >= 2) return '5,000+';
  return '1,000+';
}

function deriveScarcityText(data: DemoVideoProps): string {
  const pricing = (data.pricingModel || 'freemium').toLowerCase();
  if (pricing === 'free') return 'Free Forever — Join Now';
  if (pricing === 'freemium') return 'Limited Free Plan Available';
  if (pricing === 'paid') return 'Early Access Pricing — Save 40%';
  return 'Special Launch Offer';
}

export const FeaturesScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const notifications = deriveNotifications(data);
  const userCount = deriveUserCount(data);
  const scarcityText = deriveScarcityText(data);

  const grad2X = 30 + Math.sin(frame * 0.012) * 20;
  const grad2Y = 40 + Math.cos(frame * 0.015) * 15;

  // "Trusted by" title
  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 80 } });
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  // User counter with counting animation
  const countProgress = spring({ frame: frame - 20, fps, config: { damping: 20, stiffness: 60 } });
  const targetCount = parseInt(userCount.replace(/[^0-9]/g, '')) || 10000;
  const displayCount = Math.floor(targetCount * Math.max(0, countProgress));

  // Star rating
  const starsProgress = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 90 } });

  // Notification toasts — staggered appearance
  const toastTimings = [55, 90, 130, 170];

  // Trust badges / categories
  const badgeStart = 50;

  // Scarcity banner
  const scarcityProgress = spring({ frame: frame - 120, fps, config: { damping: 14, stiffness: 80 } });
  const scarcityPulse = 1 + Math.sin(frame * 0.08) * 0.03;

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
      {/* Grid bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.4 }} />

      {/* "Trusted by" title */}
      <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'rgba(180, 180, 210, 0.6)',
            margin: 0,
            opacity: Math.max(0, titleProgress),
            filter: `blur(${titleBlur}px)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: 3,
            textTransform: 'uppercase',
          }}
        >
          Trusted by users worldwide
        </h2>
      </div>

      {/* Big user counter */}
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: -4,
          opacity: Math.max(0, countProgress),
          textShadow: '0 0 60px rgba(99, 102, 241, 0.4)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {displayCount.toLocaleString()}+
      </div>

      {/* "Users & Growing" subtitle */}
      <div
        style={{
          fontSize: 22,
          color: 'rgba(200, 200, 230, 0.7)',
          fontFamily: 'system-ui, sans-serif',
          marginTop: 4,
          opacity: Math.max(0, countProgress),
          zIndex: 2,
        }}
      >
        Happy Users & Growing
      </div>

      {/* Star rating */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginTop: 24,
          opacity: Math.max(0, starsProgress),
          transform: `scale(${interpolate(Math.max(0, starsProgress), [0, 1], [0.5, 1])})`,
          zIndex: 2,
        }}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <div
            key={star}
            style={{
              fontSize: 32,
              color: star <= 4 ? '#fbbf24' : '#fbbf24',
              textShadow: '0 0 20px rgba(251, 191, 36, 0.4)',
            }}
          >
            {'\u2605'}
          </div>
        ))}
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, marginLeft: 8, alignSelf: 'center', fontFamily: 'system-ui, sans-serif' }}>
          4.9/5
        </span>
      </div>

      {/* Category trust badges */}
      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
        {(data.categories || []).slice(0, 5).map((cat, i) => {
          const badgeProgress = spring({ frame: frame - badgeStart - i * 6, fps, config: { damping: 16, stiffness: 100 } });
          return (
            <div
              key={i}
              style={{
                padding: '8px 20px',
                borderRadius: 100,
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                color: 'rgba(200, 200, 240, 0.8)',
                fontSize: 15,
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

      {/* Notification toasts (right side) */}
      {notifications.map((notif, i) => {
        const toastFrame = frame - toastTimings[i];
        const toastIn = spring({ frame: toastFrame, fps, config: { damping: 14, stiffness: 100 } });
        const toastOut = interpolate(toastFrame, [40, 55], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        const toastOpacity = Math.min(Math.max(0, toastIn), toastOut);
        const toastX = interpolate(Math.max(0, toastIn), [0, 1], [200, 0]);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              right: 60,
              top: 200 + i * 70,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              opacity: toastOpacity,
              transform: `translateX(${toastX}px)`,
              zIndex: 10,
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: `hsl(${200 + i * 40}, 70%, 60%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'white',
            }}>
              {notif.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontFamily: 'system-ui, sans-serif' }}>
                {notif.name}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui, sans-serif' }}>
                {notif.action}
              </div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 8, fontFamily: 'system-ui, sans-serif' }}>
              just now
            </div>
          </div>
        );
      })}

      {/* Scarcity banner at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          padding: '14px 40px',
          borderRadius: 100,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          opacity: Math.max(0, scarcityProgress),
          transform: `scale(${scarcityPulse * interpolate(Math.max(0, scarcityProgress), [0, 1], [0.8, 1])})`,
          zIndex: 5,
        }}
      >
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#fbbf24',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 1,
        }}>
          {'\u26A1'} {scarcityText}
        </span>
      </div>
    </div>
  );
};
