export const SEEK_SECONDS = 10;

export function clampPlaybackTime(time: number, duration: number) {
  const limit = duration > 0 ? duration : time;
  return Math.min(Math.max(time, 0), limit);
}

export function playbackProgress(position: number, duration: number) {
  if (duration <= 0) {
    return 0;
  }
  return Math.min(position / duration, 1);
}

export function isPlaybackEnded(position: number, duration: number) {
  return duration > 0 && position >= duration - 1;
}

export function seekStepLabel(delta: number, seconds = SEEK_SECONDS) {
  return delta > 0 ? `+${seconds}s` : `−${seconds}s`;
}
