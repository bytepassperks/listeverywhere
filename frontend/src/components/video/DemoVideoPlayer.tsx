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
    <div className="demo-video-player-wrapper" style={{ width: '100%', maxWidth: 960, background: '#000000', borderRadius: 12, overflow: 'hidden' }}>
      <style>{`
        /* Force ALL elements inside the Remotion Player controls area to have dark backgrounds.
           The controls panel is an absolutely-positioned div at the bottom of the player.
           Without this, the semi-transparent gradient lets the white card background bleed through. */
        .demo-video-player-wrapper div[style*="box-sizing: border-box"][style*="position: absolute"][style*="bottom: 0"] {
          background: linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0.98) 100%) !important;
        }
        /* Seek bar track — make it dark instead of light */
        .demo-video-player-wrapper div[style*="touch-action: none"] {
          background: transparent !important;
        }
        .demo-video-player-wrapper div[style*="touch-action: none"] > div {
          background: rgba(255,255,255,0.15) !important;
        }
        .demo-video-player-wrapper div[style*="touch-action: none"] > div > div {
          background: rgba(139,92,246,0.8) !important;
        }
        /* Ensure the player container itself has black bg so rounded corners don't leak white */
        .demo-video-player-wrapper > div {
          background: #000000 !important;
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
          background: '#000000',
        }}
        controls
        autoPlay
        loop
      />
    </div>
  );
});

DemoVideoPlayer.displayName = 'DemoVideoPlayer';
