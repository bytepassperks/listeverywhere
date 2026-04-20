import { useCurrentFrame, useVideoConfig, spring, interpolate, Img } from 'remotion';
import { DemoVideoProps } from './types';

export const ScreenshotsScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const grad2X = 60 + Math.sin(frame * 0.01) * 15;
  const grad2Y = 40 + Math.cos(frame * 0.013) * 15;

  // Browser entrance
  const browserProgress = spring({ frame: frame - 5, fps, config: { damping: 14, mass: 0.8, stiffness: 70 } });
  const browserScale = interpolate(Math.max(0, browserProgress), [0, 1], [0.7, 1]);
  const browserY = interpolate(Math.max(0, browserProgress), [0, 1], [80, 0]);
  const browserBlur = interpolate(Math.max(0, browserProgress), [0, 1], [15, 0]);

  // 3D tilt with gentle floating
  const tiltX = interpolate(frame, [0, 60, 180, 240], [-8, 2, -1, 3], { extrapolateRight: 'clamp' });
  const tiltY = interpolate(frame, [0, 80, 160, 240], [12, -3, 2, -4], { extrapolateRight: 'clamp' });
  const floatY = Math.sin(frame * 0.025) * 4;

  // Title
  const titleProgress = spring({ frame, fps, config: { damping: 16, stiffness: 80 } });
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  const screenshots = data.screenshots.length > 0
    ? data.screenshots
    : [
        { type: 'homepage', file_url: '' },
        { type: 'features', file_url: '' },
        { type: 'pricing', file_url: '' },
      ];

  const hasRealScreenshots = screenshots.some(s => s.file_url && (s.file_url.startsWith('http') || s.file_url.startsWith('/')));

  // Screenshot carousel: switch between screenshots over time
  const screenshotCycleDuration = 70; // frames per screenshot
  const currentScreenshotIndex = hasRealScreenshots
    ? Math.floor(((frame - 30) < 0 ? 0 : (frame - 30)) / screenshotCycleDuration) % screenshots.filter(s => s.file_url).length
    : 0;

  // Crossfade between screenshots
  const cycleFrame = ((frame - 30) < 0 ? 0 : (frame - 30)) % screenshotCycleDuration;
  const screenshotOpacity = interpolate(
    cycleFrame,
    [0, 8, screenshotCycleDuration - 8, screenshotCycleDuration],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const screenshotsWithUrls = screenshots.filter(s => s.file_url && (s.file_url.startsWith('http') || s.file_url.startsWith('/')));
  const currentScreenshot = screenshotsWithUrls[currentScreenshotIndex];

  // Page label
  const pageLabels: Record<string, string> = {
    homepage: 'Homepage',
    features: 'Features',
    pricing: 'Pricing',
  };

  // Annotations
  const annotations = [
    { text: data.categories?.[0] || 'Key Feature', x: -80, y: -60, delay: 60 },
    { text: data.pricingModel ? `${data.pricingModel.charAt(0).toUpperCase() + data.pricingModel.slice(1)} Plans` : 'Flexible Pricing', x: 460, y: 40, delay: 80 },
    { text: data.categories?.[1] || 'Built for You', x: -60, y: 120, delay: 100 },
  ];

  // Floating tech badges
  const badges = [
    { text: data.categories?.[2] || 'Powerful', x: -140, y: -40, delay: 70, color: '#6366f1' },
    { text: data.categories?.[3] || 'Reliable', x: 530, y: -30, delay: 90, color: '#22c55e' },
    { text: 'Try it Free', x: 510, y: 160, delay: 105, color: '#8b5cf6' },
  ];

  // Thumbnail strip timing
  const thumbStartFrame = 120;

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
      {/* Perspective grid floor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          transform: 'perspective(1000px) rotateX(60deg) translateY(-200px)',
          transformOrigin: 'center top',
          opacity: 0.5,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 40,
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
          See{' '}
          <span
            style={{
              color: '#818cf8',
            }}
          >
            {data.companyName} in Action
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
          {data.tagline || data.descriptionShort || `Explore what ${data.companyName} has to offer`}
        </p>
      </div>

      {/* Main browser mockup with 3D perspective */}
      <div
        style={{
          transform: `
            scale(${browserScale})
            translateY(${browserY + floatY + 10}px)
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
            width: 780,
            height: 470,
            borderRadius: 16,
            overflow: 'hidden',
            background: 'rgba(15, 15, 30, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            boxShadow: `
              0 40px 80px rgba(0, 0, 0, 0.6),
              0 0 80px rgba(99, 102, 241, 0.1)
            `,
          }}
        >
          {/* Title bar */}
          <div
            style={{
              height: 42,
              background: 'linear-gradient(180deg, rgba(25, 25, 50, 0.98) 0%, rgba(20, 20, 40, 0.98) 100%)',
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
                height: 26,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span
                style={{
                  fontSize: 11.5,
                  color: 'rgba(200, 200, 230, 0.5)',
                  fontFamily: 'ui-monospace, "SF Mono", monospace',
                  letterSpacing: 0.3,
                }}
              >
                {data.website}
              </span>
            </div>
            {/* Current page indicator */}
            {hasRealScreenshots && currentScreenshot && (
              <div
                style={{
                  padding: '3px 10px',
                  borderRadius: 6,
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  fontSize: 10,
                  color: 'rgba(165, 165, 220, 0.8)',
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {pageLabels[currentScreenshot.type] || currentScreenshot.type}
              </div>
            )}
          </div>

          {/* Content area */}
          <div
            style={{
              width: '100%',
              height: 'calc(100% - 42px)',
              position: 'relative',
              overflow: 'hidden',
              background: '#0a0a1a',
            }}
          >
            {hasRealScreenshots && currentScreenshot ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <Img
                  src={currentScreenshot.file_url}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top center',
                    opacity: screenshotOpacity,
                  }}
                />
                {/* Bottom fade to hide white edge from screenshots */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 40,
                    background: 'linear-gradient(transparent, #0a0a1a)',
                    zIndex: 2,
                  }}
                />
                {/* Scan line effect over real screenshot */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
                    transform: `translateY(${interpolate(frame % 90, [0, 90], [0, 430])}px)`,
                    opacity: frame > 30 && frame < 180 ? 0.3 : 0,
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(180deg, rgba(15, 15, 40, 1) 0%, rgba(20, 20, 50, 1) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {/* Simulated website fallback */}
                <div style={{ width: '80%', display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
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
            background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.05), transparent)',
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
              top: `calc(50% + ${ann.y + 10}px)`,
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

      {/* Floating tech badges */}
      {badges.map((badge, i) => {
        const badgeProgress = spring({
          frame: frame - badge.delay,
          fps,
          config: { damping: 14, mass: 0.5, stiffness: 90 },
        });
        const badgeOpacity = interpolate(Math.max(0, badgeProgress), [0, 1], [0, 0.8]);
        const badgeY = interpolate(Math.max(0, badgeProgress), [0, 1], [15, 0]);
        const floatBadgeY = Math.sin(frame * 0.025 + i * 2) * 3;

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `calc(50% + ${badge.x}px)`,
              top: `calc(50% + ${badge.y}px)`,
              opacity: badgeOpacity,
              transform: `translateY(${badgeY + floatBadgeY}px)`,
              zIndex: 12,
            }}
          >
            <div
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                background: `${badge.color}15`,
                border: `1px solid ${badge.color}30`,
                color: badge.color,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'ui-monospace, "SF Mono", monospace',
                letterSpacing: 0.5,
              }}
            >
              {badge.text}
            </div>
          </div>
        );
      })}

      {/* Thumbnail strip at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          gap: 20,
          zIndex: 10,
        }}
      >
        {['Homepage', 'Features', 'Pricing'].map((label, i) => {
          const thumbProgress = spring({
            frame: frame - thumbStartFrame - i * 10,
            fps,
            config: { damping: 14, stiffness: 100 },
          });
          const thumbOpacity = interpolate(Math.max(0, thumbProgress), [0, 1], [0, 1]);
          const thumbY = interpolate(Math.max(0, thumbProgress), [0, 1], [20, 0]);
          const thumbScale = interpolate(Math.max(0, thumbProgress), [0, 1], [0.8, 1]);
          const isActive = hasRealScreenshots && currentScreenshot?.type === screenshots[i]?.type;

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
                  width: 150,
                  height: 85,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: i === 0
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))'
                    : i === 1
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1))'
                    : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(6, 182, 212, 0.1))',
                  border: isActive
                    ? '2px solid rgba(99, 102, 241, 0.6)'
                    : `1px solid ${i === 0 ? 'rgba(99, 102, 241, 0.2)' : i === 1 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive
                    ? '0 4px 24px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99,102,241,0.1)'
                    : '0 4px 16px rgba(0, 0, 0, 0.2)',
                  transition: 'border-color 0.3s',
                }}
              >
                {screenshots[i]?.file_url && screenshots[i].file_url.startsWith('http') ? (
                  <Img
                    src={screenshots[i].file_url}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
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
                  color: isActive ? 'rgba(129, 140, 248, 0.9)' : 'rgba(180, 180, 210, 0.6)',
                  fontWeight: isActive ? 700 : 500,
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
