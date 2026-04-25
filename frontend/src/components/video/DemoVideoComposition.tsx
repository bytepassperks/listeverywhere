'use client';

import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from 'remotion';
import { IntroScene } from './IntroScene';
import { FeaturesScene } from './FeaturesScene';
import { ScreenshotsScene } from './ScreenshotsScene';
import { StatsScene } from './StatsScene';
import { OutroScene } from './OutroScene';
import { DemoVideoProps, SCENE_DURATION_FRAMES, TRANSITION_FRAMES } from './types';

const SceneWrapper: React.FC<{
  children: React.ReactNode;
  durationInFrames: number;
}> = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - TRANSITION_FRAMES, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

export const DemoVideoComposition: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  const sceneDur = SCENE_DURATION_FRAMES;
  const overlap = TRANSITION_FRAMES;

  const sceneStart = (i: number) => i * (sceneDur - overlap);

  const hostname = (() => {
    try { return new URL(data.website).hostname; } catch { return data.website; }
  })();

  return (
    <AbsoluteFill style={{ background: '#050510' }}>
      <Sequence from={sceneStart(0)} durationInFrames={sceneDur}>
        <SceneWrapper durationInFrames={sceneDur}>
          <IntroScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(1)} durationInFrames={sceneDur}>
        <SceneWrapper durationInFrames={sceneDur}>
          <FeaturesScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(2)} durationInFrames={sceneDur}>
        <SceneWrapper durationInFrames={sceneDur}>
          <ScreenshotsScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(3)} durationInFrames={sceneDur}>
        <SceneWrapper durationInFrames={sceneDur}>
          <StatsScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(4)} durationInFrames={sceneDur}>
        <SceneWrapper durationInFrames={sceneDur}>
          <OutroScene data={data} />
        </SceneWrapper>
      </Sequence>

      {/* Persistent branded footer bar — provides visual content at the bottom
          so video player seek bars blend in rather than contrasting with black */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 48,
        background: 'linear-gradient(to bottom, rgba(10,10,30,0.0) 0%, rgba(10,10,30,0.95) 40%, rgba(15,15,35,1) 100%)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: 12,
        pointerEvents: 'none',
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: 13,
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '0.5px',
        }}>
          {hostname}
        </span>
      </div>
    </AbsoluteFill>
  );
};
