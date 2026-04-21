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
    <div className="demo-video-player-wrapper" style={{ width: '100%', maxWidth: 960 }}>
      <style>{`
        /* Make Remotion Player control bar fully opaque dark background
           so there is no semi-transparent lighter strip at the bottom */
        .demo-video-player-wrapper div[style*="position: absolute"][style*="bottom: 0px"] {
          background: rgba(5, 5, 16, 0.97) !important;
        }
        /* Fallback: target any child container near the bottom that acts as controls */
        .demo-video-player-wrapper > div > div:last-child {
          background: transparent !important;
        }
      `}</style>
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
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
        }}
        controls
        autoPlay
        loop
      />
    </div>
  );
});

DemoVideoPlayer.displayName = 'DemoVideoPlayer';
