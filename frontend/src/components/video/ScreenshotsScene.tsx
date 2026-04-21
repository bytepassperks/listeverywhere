import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { DemoVideoProps } from './types';

function deriveAnnotations(data: DemoVideoProps): { text: string; emoji: string }[] {
  const desc = (data.descriptionLong || data.descriptionShort || '').toLowerCase();
  const cats = (data.categories || []).map(c => c.toLowerCase());
  const annotations: { text: string; emoji: string }[] = [];

  if (desc.includes('detect') || cats.some(c => c.includes('detection'))) annotations.push({ text: 'AI Detection', emoji: '\uD83D\uDD0D' });
  if (desc.includes('humaniz')) annotations.push({ text: 'Text Humanizer', emoji: '\u2728' });
  if (desc.includes('plagiar')) annotations.push({ text: 'Plagiarism Check', emoji: '\uD83D\uDEE1\uFE0F' });
  if (cats.some(c => c.includes('writing'))) annotations.push({ text: 'Writing Tools', emoji: '\u270D\uFE0F' });
  if (cats.some(c => c.includes('content'))) annotations.push({ text: 'Content Engine', emoji: '\uD83D\uDCDD' });
  if (cats.some(c => c.includes('ai'))) annotations.push({ text: 'AI Powered', emoji: '\uD83E\uDD16' });
  if (cats.some(c => c.includes('scheduling'))) annotations.push({ text: 'Smart Scheduling', emoji: '\uD83D\uDCC5' });
  if (cats.some(c => c.includes('analytics'))) annotations.push({ text: 'Analytics', emoji: '\uD83D\uDCCA' });
  if (cats.some(c => c.includes('productivity'))) annotations.push({ text: 'Productivity', emoji: '\u26A1' });

  // Pad
  const fallbacks = [
    { text: 'Easy to Use', emoji: '\uD83D\uDE80' },
    { text: 'Lightning Fast', emoji: '\u26A1' },
    { text: 'Secure', emoji: '\uD83D\uDD12' },
  ];
  let fi = 0;
  while (annotations.length < 4 && fi < fallbacks.length) {
    annotations.push(fallbacks[fi]);
    fi++;
  }
  return annotations.slice(0, 4);
}

export const ScreenshotsScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grad2X = 60 + Math.sin(frame * 0.01) * 15;
  const grad2Y = 40 + Math.cos(frame * 0.013) * 15;

  const annotations = deriveAnnotations(data);

  // Browser entrance
  const browserProgress = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.8, stiffness: 70 } });
  const browserScale = interpolate(Math.max(0, browserProgress), [0, 1], [0.7, 1]);
  const browserY = interpolate(Math.max(0, browserProgress), [0, 1], [80, 0]);
  const browserBlur = interpolate(Math.max(0, browserProgress), [0, 1], [15, 0]);

  // 3D tilt
  const tiltX = interpolate(frame, [0, 60, 180, 240], [-8, 2, -1, 3], { extrapolateRight: 'clamp' });
  const tiltY = interpolate(frame, [0, 80, 160, 240], [12, -3, 2, -4], { extrapolateRight: 'clamp' });
  const floatY = Math.sin(frame * 0.025) * 4;

  // Title
  const titleProgress = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  const screenshots = data.screenshots.filter(s => s.file_url && (s.file_url.startsWith('http') || s.file_url.startsWith('/')));
  const hasReal = screenshots.length > 0;

  // Screenshot carousel
  const cycleDuration = 70;
  const currentIdx = hasReal ? Math.floor(((frame - 30) < 0 ? 0 : (frame - 30)) / cycleDuration) % screenshots.length : 0;
  const cycleFrame = ((frame - 30) < 0 ? 0 : (frame - 30)) % cycleDuration;
  const ssOpacity = interpolate(cycleFrame, [0, 8, cycleDuration - 8, cycleDuration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const currentSS = screenshots[currentIdx];

  const pageLabels: Record<string, string> = { homepage: 'Homepage', features: 'Features', pricing: 'Pricing' };

  // Cursor animation — moves across the screenshot
  const cursorX = interpolate(frame, [30, 80, 140, 200], [200, 400, 300, 500], { extrapolateRight: 'clamp' });
  const cursorY = interpolate(frame, [30, 80, 140, 200], [100, 200, 150, 250], { extrapolateRight: 'clamp' });
  const cursorOpacity = interpolate(frame, [25, 35, 220, 240], [0, 0.8, 0.8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Click ripple effect at cursor position
  const clickFrames = [80, 140, 200];
  const clickRipples = clickFrames.map((cf, i) => {
    const rippleLife = Math.max(0, frame - cf);
    const rippleScale = rippleLife * 0.15;
    const rippleOpacity = interpolate(rippleLife, [0, 5, 20], [0, 0.4, 0], { extrapolateRight: 'clamp' });
    const cx = interpolate(cf, [30, 80, 140, 200], [200, 400, 300, 500], { extrapolateRight: 'clamp' });
    const cy = interpolate(cf, [30, 80, 140, 200], [100, 200, 150, 250], { extrapolateRight: 'clamp' });
    return { scale: rippleScale, opacity: rippleOpacity, x: cx, y: cy, i };
  });

  // Annotation positions around browser
  const annotPositions = [
    { x: -120, y: -40 },
    { x: 520, y: 30 },
    { x: -100, y: 180 },
    { x: 500, y: 200 },
  ];

  // Zoom effect
  const zoomScale = interpolate(frame, [60, 120, 180, 240], [1, 1.08, 1.03, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(ellipse at ${grad2X}% ${grad2Y}%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at ${100 - grad2X}% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 40%),
          linear-gradient(160deg, #050510 0%, #0a0a20 40%, #080818 70%, #050510 100%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        perspective: '1800px',
      }}
    >
      {/* Grid floor */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', transform: 'perspective(1000px) rotateX(60deg) translateY(-200px)', transformOrigin: 'center top', opacity: 0.5 }} />

      {/* Title */}
      <div style={{ position: 'absolute', top: 30, textAlign: 'center', zIndex: 10 }}>
        <h2 style={{
          fontSize: 44,
          fontWeight: 800,
          color: 'white',
          margin: 0,
          opacity: Math.max(0, titleProgress),
          filter: `blur(${titleBlur}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: -1.5,
        }}>
          See{' '}
          <span style={{ color: '#a78bfa' }}>{data.companyName}</span>
          {' '}in Action
        </h2>
        <p style={{
          fontSize: 18,
          color: 'rgba(180, 180, 210, 0.6)',
          margin: '8px 0 0',
          opacity: Math.max(0, spring({ frame: frame - 15, fps, config: { damping: 16 } })),
          fontFamily: 'system-ui, sans-serif',
        }}>
          {data.tagline || `Discover what ${data.companyName} can do for you`}
        </p>
      </div>

      {/* Browser mockup */}
      <div
        style={{
          transform: `
            scale(${browserScale * zoomScale})
            translateY(${browserY + floatY + 15}px)
            perspective(1800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)
          `,
          filter: `blur(${browserBlur}px)`,
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Browser chrome */}
        <div style={{
          width: 680,
          borderRadius: '12px 12px 0 0',
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 -2px 20px rgba(0,0,0,0.3)',
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
              {data.website}
            </span>
          </div>
        </div>

        {/* Browser content area */}
        <div style={{
          width: 680,
          height: 380,
          background: '#0a0a1a',
          borderRadius: '0 0 12px 12px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}>
          {hasReal && currentSS ? (
            <Img
              src={currentSS.file_url}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: ssOpacity,
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0f0f2a 0%, #1a1a3e 50%, #0f0f2a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'rgba(255,255,255,0.1)', fontFamily: 'system-ui, sans-serif' }}>{data.companyName}</div>
            </div>
          )}

          {/* Cursor */}
          <div style={{
            position: 'absolute',
            left: cursorX,
            top: cursorY,
            opacity: cursorOpacity,
            zIndex: 20,
            pointerEvents: 'none',
            transition: 'none',
          }}>
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
              <path d="M1 1L1 18L6 13L12 22L15 20L9 11L16 10L1 1Z" fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Click ripples */}
          {clickRipples.map((r) => (
            <div key={r.i} style={{
              position: 'absolute',
              left: r.x - 15,
              top: r.y - 15,
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: '2px solid rgba(139, 92, 246, 0.8)',
              opacity: r.opacity,
              transform: `scale(${1 + r.scale})`,
              pointerEvents: 'none',
            }} />
          ))}

          {/* Dark overlay at bottom for brand consistency */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'linear-gradient(transparent, rgba(10,10,26,0.95))',
          }} />

          {/* Page label */}
          {hasReal && currentSS && (
            <div style={{
              position: 'absolute',
              bottom: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '4px 16px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.08)',
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'system-ui, sans-serif',
            }}>
              {pageLabels[currentSS.type] || currentSS.type}
            </div>
          )}
        </div>

        {/* Annotation callouts */}
        {annotations.map((ann, i) => {
          const annProgress = spring({ frame: frame - 50 - i * 15, fps, config: { damping: 14, stiffness: 90 } });
          const pos = annotPositions[i];
          const annFloat = Math.sin(frame * 0.03 + i * 1.5) * 4;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(50% + ${pos.x}px)`,
                top: `calc(50% + ${pos.y + annFloat}px)`,
                padding: '8px 16px',
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                backdropFilter: 'blur(8px)',
                opacity: Math.max(0, annProgress),
                transform: `scale(${interpolate(Math.max(0, annProgress), [0, 1], [0.7, 1])})`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                zIndex: 15,
              }}
            >
              <span style={{ fontSize: 16 }}>{ann.emoji}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'system-ui, sans-serif' }}>{ann.text}</span>
            </div>
          );
        })}
      </div>

      {/* Thumbnail strip */}
      {hasReal && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 20,
          position: 'relative',
          zIndex: 5,
        }}>
          {screenshots.slice(0, 3).map((ss, i) => {
            const thumbProgress = spring({ frame: frame - 120 - i * 10, fps, config: { damping: 16, stiffness: 90 } });
            const isActive = i === currentIdx;
            return (
              <div key={i} style={{
                width: 100,
                height: 60,
                borderRadius: 8,
                overflow: 'hidden',
                opacity: Math.max(0, thumbProgress),
                transform: `scale(${interpolate(Math.max(0, thumbProgress), [0, 1], [0.7, 1])})`,
                border: isActive ? '2px solid rgba(139, 92, 246, 0.6)' : '1px solid rgba(255,255,255,0.08)',
                boxShadow: isActive ? '0 0 15px rgba(139, 92, 246, 0.3)' : 'none',
              }}>
                <Img src={ss.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '2px 0',
                  textAlign: 'center',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.6)',
                  background: 'rgba(0,0,0,0.6)',
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {pageLabels[ss.type] || ss.type}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
