import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

export const StatsScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 15 } });
  const titleY = interpolate(titleProgress, [0, 1], [40, 0]);

  const stats = [
    {
      label: 'Directories',
      value: data.totalDirectories,
      suffix: '+',
      color: '#6366f1',
      icon: '📁',
    },
    {
      label: 'Auto Submitted',
      value: data.submissionStats['auto_submitted'] || 0,
      suffix: '',
      color: '#22c55e',
      icon: '🚀',
    },
    {
      label: 'Manual Ready',
      value: data.submissionStats['manual_ready'] || 0,
      suffix: '',
      color: '#3b82f6',
      icon: '📋',
    },
    {
      label: 'Email Ready',
      value: data.submissionStats['email_ready'] || 0,
      suffix: '',
      color: '#8b5cf6',
      icon: '📧',
    },
  ];

  const barData = [
    { label: 'Queued', value: data.submissionStats['queued'] || 0, color: '#f59e0b' },
    { label: 'Submitted', value: data.submissionStats['auto_submitted'] || 0, color: '#22c55e' },
    { label: 'Manual', value: data.submissionStats['manual_ready'] || 0, color: '#3b82f6' },
    { label: 'Email', value: data.submissionStats['email_ready'] || 0, color: '#8b5cf6' },
    { label: 'Approved', value: data.submissionStats['approved'] || 0, color: '#06b6d4' },
    { label: 'Retrying', value: data.submissionStats['retrying'] || 0, color: '#ef4444' },
  ];

  const maxBarValue = Math.max(...barData.map((b) => b.value), 1);

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
        perspective: '1200px',
        overflow: 'hidden',
        position: 'relative',
        padding: 60,
      }}
    >
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
        Submission Dashboard
      </h2>

      <div
        style={{
          display: 'flex',
          gap: 30,
          marginBottom: 50,
        }}
      >
        {stats.map((stat, i) => {
          const delay = i * 10;
          const cardProgress = spring({
            frame: frame - delay - 10,
            fps,
            config: { damping: 12, mass: 0.8 },
          });
          const cardScale = interpolate(cardProgress, [0, 1], [0.5, 1]);
          const cardOpacity = interpolate(cardProgress, [0, 1], [0, 1]);
          const floatY = Math.sin(frame * 0.04 + i * 1.5) * 5;

          const countProgress = spring({
            frame: frame - delay - 20,
            fps,
            config: { damping: 20, mass: 2 },
          });
          const displayValue = Math.round(stat.value * countProgress);

          return (
            <div
              key={i}
              style={{
                opacity: Math.max(0, cardOpacity),
                transform: `scale(${cardScale}) translateY(${floatY}px)`,
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${stat.color}33`,
                borderRadius: 20,
                padding: '28px 36px',
                textAlign: 'center',
                minWidth: 180,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px ${stat.color}11`,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: stat.color,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  lineHeight: 1,
                }}
              >
                {displayValue}{stat.suffix}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'rgba(199, 199, 255, 0.6)',
                  marginTop: 8,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {barData.map((bar, i) => {
          const delay = i * 6 + 40;
          const barProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 15, mass: 1 },
          });
          const barWidth = interpolate(barProgress, [0, 1], [0, (bar.value / maxBarValue) * 100]);
          const barOpacity = interpolate(barProgress, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: Math.max(0, barOpacity),
              }}
            >
              <div
                style={{
                  width: 100,
                  fontSize: 14,
                  color: 'rgba(199, 199, 255, 0.7)',
                  textAlign: 'right',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {bar.label}
              </div>
              <div
                style={{
                  flex: 1,
                  height: 28,
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(barWidth, 0)}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${bar.color}, ${bar.color}cc)`,
                    borderRadius: 14,
                    boxShadow: `0 0 20px ${bar.color}44`,
                    transition: 'width 0.1s',
                  }}
                />
              </div>
              <div
                style={{
                  width: 40,
                  fontSize: 16,
                  fontWeight: 700,
                  color: bar.color,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              >
                {Math.round(bar.value * barProgress)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
