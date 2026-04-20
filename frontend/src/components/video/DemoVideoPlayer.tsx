'use client';

import { Player, PlayerRef } from '@remotion/player';
import { forwardRef } from 'react';
import { DemoVideoComposition } from './DemoVideoComposition';
import { DemoVideoProps, VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, SCENE_DURATION_FRAMES, TRANSITION_FRAMES, TOTAL_SCENES } from './types';

interface DemoVideoPlayerProps {
  data: DemoVideoProps;
}

export const TOTAL_DURATION_FRAMES = TOTAL_SCENES * SCENE_DURATION_FRAMES - (TOTAL_SCENES - 1) * TRANSITION_FRAMES;

export const DemoVideoPlayer = forwardRef<PlayerRef, DemoVideoPlayerProps>(({ data }, ref) => {
  return (
    <div style={{ width: '100%', maxWidth: 960 }}>
      <Player
        ref={ref}
        component={DemoVideoComposition}
        inputProps={{ data }}
        durationInFrames={TOTAL_DURATION_FRAMES}
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
});

DemoVideoPlayer.displayName = 'DemoVideoPlayer';
