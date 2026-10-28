export function formatClock(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const minuteSecond = `${minutes}:${String(seconds).padStart(2, '0')}`;
  if (hours === 0) {
    return minuteSecond;
  }
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(
    seconds,
  ).padStart(2, '0')}`;
}
