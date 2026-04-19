import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

export const ScreenshotsScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grad2X = 60 + Math.sin(frame * 0.01) * 15;
  const grad2Y = 40 + Math.cos(frame * 0.013) * 15;

  // Main browser mockup entrance
  const browserProgress = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.8, stiffness: 70 } });
  const browserScale = interpolate(Math.max(0, browserProgress), [0, 1], [0.7, 1]);
  const browserY = interpolate(Math.max(0, browserProgress), [0, 1], [80, 0]);
  const browserBlur = interpolate(Math.max(0, browserProgress), [0, 1], [15, 0]);

  // 3D tilt for browser
  const tiltX = interpolate(frame, [0, 60, 180, 240], [-8, 2, -1, 3], { extrapolateRight: 'clamp' });
  const tiltY = interpolate(frame, [0, 80, 160, 240], [15, -3, 2, -5], { extrapolateRight: 'clamp' });
  const floatY = Math.sin(frame * 0.025) * 5;

  // Title
  const titleProgress = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  // Annotations
  const annotations = [
    { text: 'AI-Extracted Metadata', x: -60, y: -40, delay: 80 },
    { text: 'Auto-Generated Screenshots', x: 480, y: 60, delay: 100 },
    { text: 'Directory-Ready Format', x: -40, y: 220, delay: 120 },
  ];

  // Floating badges around browser
  const badges = [
    { text: '1920x1080', x: -120, y: -30, delay: 90, color: '#6366f1' },
    { text: 'HD Ready', x: 520, y: -20, delay: 105, color: '#22c55e' },
    { text: 'Auto-Captured', x: 500, y: 250, delay: 115, color: '#8b5cf6' },
  ];

  const screenshots = data.screenshots.length > 0
    ? data.screenshots
    : [
        { type: 'homepage', file_url: '' },
        { type: 'features', file_url: '' },
        { type: 'pricing', file_url: '' },
      ];

  // Mini thumbnail previews
  const thumbStartFrame = 140;

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
      {/* Subtle grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: `perspective(1000px) rotateX(60deg) translateY(-200px)`,
          transformOrigin: 'center top',
          opacity: 0.4,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 50,
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <h2
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            opacity: Math.max(0, titleProgress),
            filter: `blur(${titleBlur}px)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: -1.5,
          }}
        >
          Automated{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Screenshot Capture
          </span>
        </h2>
        <p
          style={{
            fontSize: 18,
            color: 'rgba(180, 180, 210, 0.6)',
            margin: '10px 0 0',
            opacity: Math.max(0, spring({ frame: frame - 15, fps, config: { damping: 16 } })),
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Pixel-perfect captures of {data.companyName} for every directory
        </p>
      </div>

      {/* Main browser mockup with 3D perspective */}
      <div
        style={{
          transform: `
            scale(${browserScale})
            translateY(${browserY + floatY + 20}px)
            perspective(1800px)
            rotateX(${tiltX}deg)
            rotateY(${tiltY}deg)
          `,
          filter: `blur(${browserBlur}px)`,
          transformStyle: 'preserve-3d',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            width: 720,
            height: 440,
            borderRadius: 16,
            overflow: 'hidden',
            background: 'rgba(15, 15, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: `
              0 40px 80px rgba(0, 0, 0, 0.6),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              0 0 60px rgba(99, 102, 241, 0.08)
            `,
          }}
        >
          {/* Title bar */}
          <div
            style={{
              height: 40,
              background: 'rgba(20, 20, 40, 0.95)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: 8,
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57', boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2)' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e', boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2)' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840', boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.2)' }} />
            <div
              style={{
                marginLeft: 16,
                flex: 1,
                height: 24,
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="3">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(200, 200, 230, 0.4)',
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  letterSpacing: 0.3,
                }}
              >
                {data.website}
              </span>
            </div>
          </div>

          {/* Content area */}
          <div
            style={{
              width: '100%',
              height: 'calc(100% - 40px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {screenshots[0]?.file_url ? (
              <img
                src={screenshots[0].file_url}
                alt="homepage"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: `
                    linear-gradient(180deg, rgba(15, 15, 40, 1) 0%, rgba(20, 20, 50, 1) 100%)
                  `,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Simulated website content */}
                <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  {/* Nav bar */}
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {data.logoUrl && (
                        <img src={data.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                      )}
                      <span style={{ fontSize: 16, fontWeight: 700, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
                        {data.companyName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {['Features', 'Pricing', 'Docs'].map((item) => (
                        <span key={item} style={{ fontSize: 12, color: 'rgba(180,180,210,0.5)', fontFamily: 'system-ui, sans-serif' }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Hero */}
                  <div style={{ textAlign: 'center', padding: '30px 0' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'white', fontFamily: 'system-ui, sans-serif', marginBottom: 8 }}>
                      {data.companyName}
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(180,180,210,0.6)', fontFamily: 'system-ui, sans-serif', maxWidth: 400 }}>
                      {data.tagline || data.descriptionShort}
                    </div>
                    <div
                      style={{
                        marginTop: 20,
                        display: 'inline-block',
                        padding: '8px 24px',
                        borderRadius: 8,
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'system-ui, sans-serif',
                      }}
                    >
                      Get Started
                    </div>
                  </div>
                  {/* Feature pills */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {data.categories.slice(0, 3).map((cat, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '4px 12px',
                          borderRadius: 12,
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.15)',
                          fontSize: 11,
                          color: 'rgba(165, 165, 220, 0.7)',
                          fontFamily: 'system-ui, sans-serif',
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Scan line effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.6), transparent)',
                    transform: `translateY(${interpolate(frame % 120, [0, 120], [0, 400])}px)`,
                    opacity: frame > 40 && frame < 160 ? 0.4 : 0,
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Browser reflection */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: 20,
            right: 20,
            height: 60,
            background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.04), transparent)',
            borderRadius: '0 0 12px 12px',
            filter: 'blur(8px)',
            transform: 'scaleY(-0.3)',
          }}
        />
      </div>

      {/* Floating annotation badges */}
      {annotations.map((ann, i) => {
        const annProgress = spring({
          frame: frame - ann.delay,
          fps,
          config: { damping: 14, mass: 0.5, stiffness: 100 },
        });
        const annOpacity = interpolate(Math.max(0, annProgress), [0, 1], [0, 1]);
        const annScale = interpolate(Math.max(0, annProgress), [0, 1], [0.6, 1]);
        const annX = interpolate(Math.max(0, annProgress), [0, 1], [i % 2 === 0 ? -30 : 30, 0]);
        const floatAnnY = Math.sin(frame * 0.03 + i * 1.5) * 4;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${ann.x}px)`,
              top: `calc(50% + ${ann.y + 20}px)`,
              opacity: annOpacity,
              transform: `scale(${annScale}) translateX(${annX}px) translateY(${floatAnnY}px)`,
              zIndex: 15,
            }}
          >
            <div
              style={{
                padding: '8px 18px',
                borderRadius: 12,
                background: 'rgba(99, 102, 241, 0.12)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                color: 'rgba(200, 200, 240, 0.9)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#818cf8',
                  boxShadow: '0 0 8px rgba(129, 140, 248, 0.5)',
                }}
              />
              {ann.text}
            </div>
          </div>
        );
      })}

      {/* Thumbnail strip at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          display: 'flex',
          gap: 16,
          zIndex: 10,
        }}
      >
        {['Homepage', 'Features', 'Pricing'].map((label, i) => {
          const thumbProgress = spring({
            frame: frame - thumbStartFrame - i * 8,
            fps,
            config: { damping: 14, stiffness: 100 },
          });
          const thumbOpacity = interpolate(Math.max(0, thumbProgress), [0, 1], [0, 1]);
          const thumbY = interpolate(Math.max(0, thumbProgress), [0, 1], [20, 0]);
          const thumbScale = interpolate(Math.max(0, thumbProgress), [0, 1], [0.8, 1]);

          return (
            <div
              key={i}
              style={{
                opacity: thumbOpacity,
                transform: `translateY(${thumbY}px) scale(${thumbScale})`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 140,
                  height: 80,
                  borderRadius: 10,
                  background: i === 0
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))'
                    : i === 1
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))'
                    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(6, 182, 212, 0.1))',
                  border: `1px solid ${i === 0 ? 'rgba(99, 102, 241, 0.25)' : i === 1 ? 'rgba(59, 130, 246, 0.25)' : 'rgba(34, 197, 94, 0.25)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                }}
              >
                {screenshots[i]?.file_url ? (
                  <img src={screenshots[i].file_url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(180,180,210,0.3)" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: 'rgba(180, 180, 210, 0.6)',
                  fontWeight: 500,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
