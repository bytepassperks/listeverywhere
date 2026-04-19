'use client';

import { AbsoluteFill, Sequence } from 'remotion';
import { IntroScene } from './IntroScene';
import { FeaturesScene } from './FeaturesScene';
import { ScreenshotsScene } from './ScreenshotsScene';
import { StatsScene } from './StatsScene';
import { OutroScene } from './OutroScene';
import { DemoVideoProps, SCENE_DURATION_FRAMES } from './types';

export const DemoVideoComposition: React.FC<{ data: DemoVideoProps }> = ({ data }) => {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={SCENE_DURATION_FRAMES}>
        <IntroScene data={data} />
      </Sequence>

      <Sequence from={SCENE_DURATION_FRAMES} durationInFrames={SCENE_DURATION_FRAMES}>
        <FeaturesScene data={data} />
      </Sequence>

      <Sequence from={SCENE_DURATION_FRAMES * 2} durationInFrames={SCENE_DURATION_FRAMES}>
        <ScreenshotsScene data={data} />
      </Sequence>

      <Sequence from={SCENE_DURATION_FRAMES * 3} durationInFrames={SCENE_DURATION_FRAMES}>
        <StatsScene data={data} />
      </Sequence>

      <Sequence from={SCENE_DURATION_FRAMES * 4} durationInFrames={SCENE_DURATION_FRAMES}>
        <OutroScene data={data} />
      </Sequence>
    </AbsoluteFill>
  );
};
