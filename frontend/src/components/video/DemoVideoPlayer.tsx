'use client';

import { Player } from '@remotion/player';
import { DemoVideoComposition } from './DemoVideoComposition';
import { DemoVideoProps, VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, SCENE_DURATION_FRAMES } from './types';

interface DemoVideoPlayerProps {
  data: DemoVideoProps;
}

export const DemoVideoPlayer: React.FC<DemoVideoPlayerProps> = ({ data }) => {
  const totalDuration = SCENE_DURATION_FRAMES * 5;

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
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        controls
        autoPlay
        loop
      />
    </div>
  );
};
