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

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
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
      </AbsoluteFill>
      {/* Permanent fade-to-black at bottom/top edges — baked into the composition
          so html2canvas captures it as part of the scene content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.6) 50%, #000000 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 10,
        background: 'linear-gradient(to top, transparent 0%, #000000 100%)',
        pointerEvents: 'none',
      }} />
    </AbsoluteFill>
  );
};
