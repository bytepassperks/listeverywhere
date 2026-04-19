import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

export const ScreenshotsScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 15 } });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const screenshots = data.screenshots.length > 0
    ? data.screenshots
    : [
        { type: 'homepage', file_url: '' },
        { type: 'features', file_url: '' },
        { type: 'pricing', file_url: '' },
      ];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d0d2b 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '2000px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          left: -200,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%)',
        }}
      />

      <h2
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: 'white',
          marginBottom: 50,
          opacity: titleProgress,
          transform: `translateY(${titleY}px)`,
          textShadow: '0 4px 30px rgba(99, 102, 241, 0.3)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: -1,
        }}
      >
        Automated Screenshots
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 40,
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
        }}
      >
        {screenshots.slice(0, 3).map((ss, i) => {
          const delay = i * 12;
          const cardProgress = spring({
            frame: frame - delay - 15,
            fps,
            config: { damping: 10, mass: 1.2 },
          });
          const cardScale = interpolate(cardProgress, [0, 1], [0.3, 1]);
          const cardOpacity = interpolate(cardProgress, [0, 1], [0, 1]);

          const centerOffset = i - 1;
          const baseRotateY = centerOffset * -15;
          const floatRotateY = Math.sin(frame * 0.02 + i * 2) * 5;
          const floatY = Math.sin(frame * 0.035 + i * 1.5) * 8;
          const floatZ = Math.cos(frame * 0.025 + i) * 20;

          const annotationOpacity = spring({
            frame: frame - delay - 50,
            fps,
            config: { damping: 15 },
          });
          const annotationScale = spring({
            frame: frame - delay - 50,
            fps,
            config: { damping: 12, mass: 0.5 },
          });

          const labels = ['Homepage', 'Features', 'Pricing'];
          const annotations = [
            'Auto-captured at 1920x1080',
            'Key features highlighted',
            'Pricing comparison ready',
          ];

          return (
            <div
              key={i}
              style={{
                opacity: Math.max(0, cardOpacity),
                transform: `scale(${cardScale}) rotateY(${baseRotateY + floatRotateY}deg) translateY(${floatY}px) translateZ(${floatZ}px)`,
                transformStyle: 'preserve-3d',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 440,
                  height: 280,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '2px solid rgba(99, 102, 241, 0.2)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(99, 102, 241, 0.1)',
                  background: 'rgba(20, 20, 40, 0.8)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: 32,
                    background: 'rgba(30, 30, 60, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    gap: 6,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                  <div
                    style={{
                      marginLeft: 12,
                      flex: 1,
                      height: 18,
                      borderRadius: 9,
                      background: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: 'rgba(199, 199, 255, 0.5)',
                      fontFamily: 'system-ui, sans-serif',
                    }}
                  >
                    {data.website}
                  </div>
                </div>

                {ss.file_url ? (
                  <img
                    src={ss.file_url}
                    alt={ss.type}
                    style={{ width: '100%', height: 'calc(100% - 32px)', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 'calc(100% - 32px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)`,
                    }}
                  >
                    <span style={{ fontSize: 48, opacity: 0.3 }}>
                      {i === 0 ? '🏠' : i === 1 ? '⚡' : '💰'}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{
                  textAlign: 'center',
                  marginTop: 16,
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'white',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {labels[i] || ss.type}
              </div>

              <div
                style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  opacity: Math.max(0, annotationOpacity),
                  transform: `scale(${Math.max(0, annotationScale)}) translateZ(60px)`,
                  background: 'rgba(99, 102, 241, 0.9)',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {annotations[i]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
