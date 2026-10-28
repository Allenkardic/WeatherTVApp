import { formatClock } from './formatClock';

test('formats zero and sub-minute times as m:ss', () => {
  expect(formatClock(0)).toBe('0:00');
  expect(formatClock(5)).toBe('0:05');
  expect(formatClock(59)).toBe('0:59');
});

test('formats minutes without an hour prefix', () => {
  expect(formatClock(60)).toBe('1:00');
  expect(formatClock(125)).toBe('2:05');
  expect(formatClock(3599)).toBe('59:59');
});

test('formats hours as h:mm:ss', () => {
  expect(formatClock(3600)).toBe('1:00:00');
  expect(formatClock(3661)).toBe('1:01:01');
  expect(formatClock(7322)).toBe('2:02:02');
});

test('floors partial seconds and treats invalid values as zero', () => {
  expect(formatClock(65.9)).toBe('1:05');
  expect(formatClock(-8)).toBe('0:00');
  expect(formatClock(Number.NaN)).toBe('0:00');
});
