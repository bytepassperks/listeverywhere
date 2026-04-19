'use client';

import { Player } from '@remotion/player';
import { DemoVideoComposition } from './DemoVideoComposition';
import { DemoVideoProps, VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, SCENE_DURATION_FRAMES, TRANSITION_FRAMES, TOTAL_SCENES } from './types';

interface DemoVideoPlayerProps {
  data: DemoVideoProps;
}

export const DemoVideoPlayer: React.FC<DemoVideoPlayerProps> = ({ data }) => {
  const totalDuration = TOTAL_SCENES * SCENE_DURATION_FRAMES - (TOTAL_SCENES - 1) * TRANSITION_FRAMES;

  return (
    <div style={{ width: '100%', maxWidth: 960 }}>
      <Player
        component={DemoVideoComposition}
        inputProps={{ data }}
        durationInFrames={totalDuration}
        compositionWidth={VIDEO_WIDTH}
        compositionHeight={VIDEO_HEIGHT}
        fps={VIDEO_FPS}
        style={{
          width: '100%',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
        controls
        autoPlay
        loop
      />
    </div>
  );
};
