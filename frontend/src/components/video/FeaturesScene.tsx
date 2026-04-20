import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { DemoVideoProps } from './types';

const GRADIENTS = [
  { gradient: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', iconBg: 'rgba(99, 102, 241, 0.15)', accent: '#818cf8' },
  { gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', iconBg: 'rgba(139, 92, 246, 0.15)', accent: '#a78bfa' },
  { gradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', iconBg: 'rgba(6, 182, 212, 0.15)', accent: '#22d3ee' },
  { gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', iconBg: 'rgba(245, 158, 11, 0.15)', accent: '#fbbf24' },
  { gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)', iconBg: 'rgba(34, 197, 94, 0.15)', accent: '#4ade80' },
  { gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', iconBg: 'rgba(236, 72, 153, 0.15)', accent: '#f472b6' },
];

const ICON_SVGS = [
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  ),
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
    </svg>
  ),
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  ),
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
    </svg>
  ),
  (accent: string) => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  ),
];

function deriveFeatures(data: DemoVideoProps) {
  const features: { title: string; desc: string }[] = [];
  const cats = data.categories || [];
  const desc = (data.descriptionLong || data.descriptionShort || '').toLowerCase();
  const name = data.companyName;

  // Extract meaningful features from categories
  for (const cat of cats.slice(0, 4)) {
    const catLower = cat.toLowerCase();
    if (catLower.includes('ai') || catLower.includes('artificial intelligence')) {
      features.push({ title: 'AI-Powered', desc: `${name} leverages advanced AI to deliver intelligent, accurate results` });
    } else if (catLower.includes('content creation')) {
      features.push({ title: 'Content Creation', desc: `Create polished, professional content that engages your audience` });
    } else if (catLower.includes('writing')) {
      features.push({ title: 'Writing Suite', desc: `Advanced writing tools to craft, edit, and perfect your content` });
    } else if (catLower.includes('productivity')) {
      features.push({ title: 'Productivity', desc: `Streamline your workflow and accomplish more in less time` });
    } else if (catLower.includes('marketing')) {
      features.push({ title: 'Marketing Suite', desc: `Tools designed to boost your marketing effectiveness and reach` });
    } else if (catLower.includes('analytics')) {
      features.push({ title: 'Analytics', desc: `Deep insights and data-driven intelligence for smarter decisions` });
    } else if (catLower.includes('seo')) {
      features.push({ title: 'SEO Tools', desc: `Optimize your content for search engines and improve rankings` });
    } else if (catLower.includes('plagiarism') || catLower.includes('detection')) {
      features.push({ title: 'Detection Engine', desc: `Advanced detection algorithms with industry-leading accuracy rates` });
    } else if (catLower.includes('saas')) {
      features.push({ title: 'Cloud Platform', desc: `Fully cloud-based platform accessible from anywhere, anytime` });
    } else if (catLower.includes('scheduling')) {
      features.push({ title: 'Smart Scheduling', desc: `Intelligent scheduling that adapts to your needs and preferences` });
    } else if (catLower.includes('project')) {
      features.push({ title: 'Project Management', desc: `Plan, track, and deliver projects with clarity and speed` });
    } else if (catLower.includes('developer') || catLower.includes('development')) {
      features.push({ title: 'Developer Tools', desc: `Built for developers with powerful APIs and integrations` });
    } else {
      features.push({ title: cat, desc: `${name} delivers best-in-class ${cat.toLowerCase()} capabilities` });
    }
  }

  // Add features from description keywords
  if (desc.includes('humaniz') && features.length < 6) {
    features.push({ title: 'Text Humanization', desc: `Transform AI-generated text into natural, human-sounding content` });
  }
  if ((desc.includes('accuracy') || desc.includes('99%')) && features.length < 6) {
    features.push({ title: '99% Accuracy', desc: `Industry-leading accuracy powered by advanced machine learning models` });
  }
  if (desc.includes('api') && features.length < 6) {
    features.push({ title: 'API Access', desc: `Integrate seamlessly with your existing tools via robust API` });
  }
  if (desc.includes('team') && features.length < 6) {
    features.push({ title: 'Team Collaboration', desc: `Work together seamlessly with built-in collaboration features` });
  }
  if (desc.includes('free') && features.length < 6) {
    features.push({ title: 'Free Tier', desc: `Get started for free with generous usage limits and core features` });
  }

  // Add pricing model feature
  if (features.length < 6) {
    const pricing = data.pricingModel || 'freemium';
    const pricingLabels: Record<string, { title: string; desc: string }> = {
      free: { title: 'Free Forever', desc: `${name} is completely free to use with no hidden costs` },
      freemium: { title: 'Flexible Pricing', desc: `Start free and scale up as your needs grow with flexible plans` },
      paid: { title: 'Professional Plans', desc: `Premium features and dedicated support for serious users` },
      enterprise: { title: 'Enterprise Ready', desc: `Enterprise-grade security, compliance, and dedicated support` },
      open_source: { title: 'Open Source', desc: `Transparent, community-driven development with full source access` },
    };
    const pf = pricingLabels[pricing] || pricingLabels['freemium'];
    features.push(pf);
  }

  // Pad to 6 features if needed
  const fallbacks = [
    { title: 'Fast & Reliable', desc: `Lightning-fast performance with 99.9% uptime guarantee` },
    { title: 'Secure by Design', desc: `Enterprise-grade security protecting your data at every layer` },
    { title: 'Easy Integration', desc: `Connect with your favorite tools in just a few clicks` },
    { title: 'Global Scale', desc: `Built to perform at scale with users worldwide` },
  ];
  let fbIdx = 0;
  while (features.length < 6 && fbIdx < fallbacks.length) {
    features.push(fallbacks[fbIdx]);
    fbIdx++;
  }

  return features.slice(0, 6);
}

export const FeaturesScene: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const features = deriveFeatures(data);

  const grad2X = 30 + Math.sin(frame * 0.012) * 20;
  const grad2Y = 40 + Math.cos(frame * 0.015) * 15;

  const titleProgress = spring({ frame: frame - 5, fps, config: { damping: 16, stiffness: 80 } });
  const titleY = interpolate(Math.max(0, titleProgress), [0, 1], [40, 0]);
  const titleBlur = interpolate(Math.max(0, titleProgress), [0, 1], [10, 0]);

  const subProgress = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 80 } });
  const subY = interpolate(Math.max(0, subProgress), [0, 1], [30, 0]);

  const lineWidth = interpolate(
    spring({ frame: frame - 25, fps, config: { damping: 20, stiffness: 60 } }),
    [0, 1],
    [0, 120]
  );

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
        padding: 80,
      }}
    >
      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          opacity: 0.5,
        }}
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 56, position: 'relative', zIndex: 2 }}>
        <h2
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: 'white',
            margin: 0,
            opacity: Math.max(0, titleProgress),
            transform: `translateY(${titleY}px)`,
            filter: `blur(${titleBlur}px)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: -2,
          }}
        >
          Why{' '}
          <span
            style={{
              color: '#a78bfa',
            }}
          >
            {data.companyName}
          </span>
          ?
        </h2>
        <p
          style={{
            fontSize: 20,
            color: 'rgba(180, 180, 210, 0.7)',
            margin: 0,
            marginTop: 14,
            opacity: Math.max(0, subProgress),
            transform: `translateY(${subY}px)`,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 400,
          }}
        >
          {data.tagline || data.descriptionShort}
        </p>
        <div
          style={{
            width: lineWidth,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent)',
            margin: '20px auto 0',
            borderRadius: 1,
          }}
        />
      </div>

      {/* Feature cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          maxWidth: 1280,
          width: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {features.map((feat, i) => {
          const delay = 30 + i * 10;
          const style = GRADIENTS[i % GRADIENTS.length];
          const cardProgress = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14, mass: 0.6, stiffness: 90 },
          });
          const cardScale = interpolate(Math.max(0, cardProgress), [0, 1], [0.85, 1]);
          const cardOpacity = interpolate(Math.max(0, cardProgress), [0, 1], [0, 1]);
          const cardY = interpolate(Math.max(0, cardProgress), [0, 1], [40, 0]);
          const cardBlur = interpolate(Math.max(0, cardProgress), [0, 1], [6, 0]);

          const floatY = Math.sin(frame * 0.03 + i * 1.1) * 3;
          const floatRotate = Math.sin(frame * 0.02 + i * 0.9) * 0.5;
          const iconRotate = Math.sin(frame * 0.04 + i * 0.7) * 5;

          return (
            <div
              key={i}
              style={{
                opacity: Math.max(0, cardOpacity),
                transform: `scale(${cardScale}) translateY(${cardY + floatY}px) rotate(${floatRotate}deg)`,
                filter: `blur(${cardBlur}px)`,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 20,
                padding: 32,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${style.accent}33, transparent)`,
                }}
              />

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: style.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `rotate(${iconRotate}deg)`,
                  border: `1px solid ${style.accent}22`,
                }}
              >
                {ICON_SVGS[i % ICON_SVGS.length](style.accent)}
              </div>

              <h3
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'white',
                  margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  letterSpacing: -0.3,
                }}
              >
                {feat.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(180, 180, 210, 0.6)',
                  margin: 0,
                  lineHeight: 1.6,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontWeight: 400,
                }}
              >
                {feat.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
