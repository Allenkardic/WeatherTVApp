import { useCallback } from 'react';
import { useTVEventHandler } from 'react-native';
import { SEEK_SECONDS } from '../utils';

type IPlayerRemoteOptions = {
  failed: boolean;
  onTogglePlayback: () => void;
  onSeekBy: (delta: number) => void;
  onExit: () => void;
};

export function usePlayerRemote({
  failed,
  onTogglePlayback,
  onSeekBy,
  onExit,
}: IPlayerRemoteOptions) {
  useTVEventHandler(
    useCallback(
      event => {
        // A completed press is delivered as key-up. Key-down repeats while
        // the button is held, so acting on it toggles or seeks twice.
        if (event.eventKeyAction === 0) {
          return;
        }
        switch (event.eventType) {
          case 'select':
          case 'playPause':
            if (!failed) {
              onTogglePlayback();
            }
            break;
          case 'left':
          case 'rewind':
          case 'longLeft':
            if (!failed) {
              onSeekBy(-SEEK_SECONDS);
            }
            break;
          case 'right':
          case 'fastForward':
          case 'longRight':
            if (!failed) {
              onSeekBy(SEEK_SECONDS);
            }
            break;
          case 'menu':
          case 'back':
            onExit();
            break;
          default:
            break;
        }
      },
      [failed, onExit, onSeekBy, onTogglePlayback],
    ),
  );
}
