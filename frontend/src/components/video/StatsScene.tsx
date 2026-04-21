import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

const FEATURE_COLORS = [
  { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)', accent: '#818cf8', icon: '\uD83D\uDE80' },
  { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)', accent: '#a78bfa', icon: '\uD83E\uDDE0' },
  { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', accent: '#22d3ee', icon: '\u26A1' },
  { bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.3)', accent: '#4ade80', icon: '\uD83D\uDEE1\uFE0F' },
  { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', accent: '#fbbf24', icon: '\uD83D\uDCCA' },
  { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', accent: '#f472b6', icon: '\uD83C\uDF1F' },
];

function deriveFeatures(data: DemoVideoProps): { title: string; desc: string }[] {
  const features: { title: string; desc: string }[] = [];
  const cats = data.categories || [];
  const desc = (data.descriptionLong || data.descriptionShort || '').toLowerCase();
  const name = data.companyName;

  for (const cat of cats.slice(0, 4)) {
    const cl = cat.toLowerCase();
    if (cl.includes('ai') || cl.includes('artificial intelligence')) features.push({ title: 'AI-Powered Engine', desc: 'Advanced AI delivers intelligent, accurate results every time' });
    else if (cl.includes('content creation')) features.push({ title: 'Content Creation', desc: 'Create polished, professional content that converts' });
    else if (cl.includes('writing')) features.push({ title: 'Writing Suite', desc: 'Advanced writing tools to craft perfect content' });
    else if (cl.includes('productivity')) features.push({ title: 'Boost Productivity', desc: 'Accomplish more in less time, automatically' });
    else if (cl.includes('marketing')) features.push({ title: 'Marketing Suite', desc: 'Tools designed to maximize your conversion rate' });
    else if (cl.includes('analytics')) features.push({ title: 'Deep Analytics', desc: 'Data-driven intelligence for smarter decisions' });
    else if (cl.includes('seo')) features.push({ title: 'SEO Optimization', desc: 'Rank higher with intelligent content optimization' });
    else if (cl.includes('plagiarism') || cl.includes('detection')) features.push({ title: 'Detection Engine', desc: 'Industry-leading accuracy with advanced algorithms' });
    else if (cl.includes('scheduling')) features.push({ title: 'Smart Scheduling', desc: 'Intelligent scheduling that adapts to your needs' });
    else if (cl.includes('project')) features.push({ title: 'Project Management', desc: 'Plan, track, and deliver with clarity and speed' });
    else features.push({ title: cat, desc: `Best-in-class ${cat.toLowerCase()} capabilities` });
  }

  if (desc.includes('humaniz') && features.length < 6) features.push({ title: 'Text Humanization', desc: 'Transform AI text into natural, human-sounding content' });
  if ((desc.includes('accuracy') || desc.includes('99%')) && features.length < 6) features.push({ title: '99% Accuracy', desc: 'Industry-leading precision powered by advanced ML' });
  if (desc.includes('free') && features.length < 6) features.push({ title: 'Free to Start', desc: 'Get started for free with generous usage limits' });

  const pricing = data.pricingModel || 'freemium';
  if (features.length < 6) {
    const pl: Record<string, { title: string; desc: string }> = {
      free: { title: 'Free Forever', desc: 'No hidden costs, no credit card required' },
      freemium: { title: 'Flexible Pricing', desc: 'Start free and scale as you grow' },
      paid: { title: 'Pro Plans', desc: 'Premium features for serious users' },
    };
    features.push(pl[pricing] || pl['freemium']);
  }

  const fallbacks = [
    { title: 'Lightning Fast', desc: 'Results in seconds, not minutes' },
    { title: 'Secure by Design', desc: 'Enterprise-grade security at every layer' },
    { title: 'Easy Integration', desc: 'Connect with your favorite tools instantly' },
  ];
  let fi = 0;
  while (features.length < 6 && fi < fallbacks.length) { features.push(fallbacks[fi]); fi++; }
  return features.slice(0, 6);
}

function derivePricingHighlight(data: DemoVideoProps): string {
  const pricing = (data.pricingModel || 'freemium').toLowerCase();
  if (pricing === 'free') return 'Free Forever';
  if (pricing === 'freemium') return 'Starting FREE';
  if (pricing === 'paid') return 'From $9/mo';
  return 'Try It Free';
}

export const StatsScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = deriveFeatures(data);
  const pricingText = derivePricingHighlight(data);

  const grad2X = 40 + Math.sin(frame * 0.012) * 20;
  const grad2Y = 50 + Math.cos(frame * 0.015) * 15;

  // Title
  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 80 } });
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  // Feature cards — rapid-fire stagger (30 frames apart each)
  const featureStagger = 25;
  const featureStart = 30;

  // Pricing highlight at the end
  const pricingProgress = spring({ frame: frame - 190, fps, config: { damping: 12, mass: 0.6, stiffness: 90 } });
  const pricingPulse = 1 + Math.sin(frame * 0.1) * 0.02;

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
      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.4 }} />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 2 }}>
        <h2 style={{
          fontSize: 48,
          fontWeight: 800,
          color: 'white',
          margin: 0,
          opacity: Math.max(0, titleProgress),
          filter: `blur(${titleBlur}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          letterSpacing: -1.5,
        }}>
          Why{' '}
          <span style={{ color: '#a78bfa' }}>{data.companyName}</span>
          ?
        </h2>
        <p style={{
          fontSize: 18,
          color: 'rgba(180, 180, 210, 0.6)',
          margin: '10px 0 0',
          opacity: Math.max(0, spring({ frame: frame - 15, fps, config: { damping: 16 } })),
          fontFamily: 'system-ui, sans-serif',
        }}>
          Everything you need, nothing you don&#39;t
        </p>
        {/* Decorative line */}
        <div style={{
          width: interpolate(spring({ frame: frame - 25, fps, config: { damping: 20, stiffness: 60 } }), [0, 1], [0, 120]),
          height: 3,
          background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
          borderRadius: 2,
          margin: '16px auto 0',
        }} />
      </div>

      {/* Feature cards — 2x3 grid with rapid-fire entrance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 280px)',
        gap: 20,
        position: 'relative',
        zIndex: 2,
      }}>
        {features.map((feat, i) => {
          const cardFrame = frame - featureStart - i * featureStagger;
          const cardProgress = spring({ frame: cardFrame, fps, config: { damping: 12, mass: 0.4, stiffness: 120 } });
          const cardScale = interpolate(Math.max(0, cardProgress), [0, 1], [0.3, 1]);
          const cardY = interpolate(Math.max(0, cardProgress), [0, 1], [60, 0]);
          const cardBlur = interpolate(Math.max(0, cardProgress), [0, 1], [10, 0]);
          const color = FEATURE_COLORS[i % FEATURE_COLORS.length];
          const cardFloat = Math.sin(frame * 0.03 + i * 1.2) * 3;

          return (
            <div
              key={i}
              style={{
                padding: '20px 24px',
                borderRadius: 16,
                background: color.bg,
                border: `1px solid ${color.border}`,
                opacity: Math.max(0, cardProgress),
                transform: `scale(${cardScale}) translateY(${cardY + cardFloat}px)`,
                filter: `blur(${cardBlur}px)`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: interpolate(cardFrame, [0, 40], [-100, 350], { extrapolateRight: 'clamp' }),
                width: 60,
                height: '200%',
                background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)`,
                transform: 'skewX(-20deg)',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{color.icon}</span>
                <div style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: color.accent,
                  fontFamily: 'system-ui, sans-serif',
                }}>
                  {feat.title}
                </div>
              </div>
              <div style={{
                fontSize: 13,
                color: 'rgba(200, 200, 230, 0.6)',
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.4,
              }}>
                {feat.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing highlight at bottom */}
      <div
        style={{
          marginTop: 36,
          padding: '14px 48px',
          borderRadius: 100,
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          opacity: Math.max(0, pricingProgress),
          transform: `scale(${pricingPulse * interpolate(Math.max(0, pricingProgress), [0, 1], [0.8, 1])})`,
          zIndex: 5,
        }}
      >
        <span style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#4ade80',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 0.5,
        }}>
          {'\uD83D\uDCB0'} {pricingText}
        </span>
      </div>
    </div>
  );
};
