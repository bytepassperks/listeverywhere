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
  from: number;
  durationInFrames: number;
}> = ({ children, from, durationInFrames }) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - from;

  const fadeIn = interpolate(relativeFrame, [0, TRANSITION_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(
    relativeFrame,
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
    <AbsoluteFill style={{ background: '#050510' }}>
      <Sequence from={sceneStart(0)} durationInFrames={sceneDur}>
        <SceneWrapper from={sceneStart(0)} durationInFrames={sceneDur}>
          <IntroScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(1)} durationInFrames={sceneDur}>
        <SceneWrapper from={sceneStart(1)} durationInFrames={sceneDur}>
          <FeaturesScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(2)} durationInFrames={sceneDur}>
        <SceneWrapper from={sceneStart(2)} durationInFrames={sceneDur}>
          <ScreenshotsScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(3)} durationInFrames={sceneDur}>
        <SceneWrapper from={sceneStart(3)} durationInFrames={sceneDur}>
          <StatsScene data={data} />
        </SceneWrapper>
      </Sequence>

      <Sequence from={sceneStart(4)} durationInFrames={sceneDur}>
        <SceneWrapper from={sceneStart(4)} durationInFrames={sceneDur}>
          <OutroScene data={data} />
        </SceneWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
