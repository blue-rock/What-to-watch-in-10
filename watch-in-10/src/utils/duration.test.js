import { describe, it, expect } from 'vitest';
import { parseDuration, formatDuration } from './duration';

describe('parseDuration', () => {
  it('parses minutes and seconds', () => {
    expect(parseDuration('PT4M13S')).toBe(253);
  });

  it('parses hours, minutes, seconds', () => {
    expect(parseDuration('PT1H2M30S')).toBe(3750);
  });

  it('parses minutes only', () => {
    expect(parseDuration('PT10M')).toBe(600);
  });

  it('parses seconds only', () => {
    expect(parseDuration('PT45S')).toBe(45);
  });

  it('returns 0 for invalid input', () => {
    expect(parseDuration('invalid')).toBe(0);
    expect(parseDuration('')).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats seconds under an hour as m:ss', () => {
    expect(formatDuration(253)).toBe('4:13');
  });

  it('formats exactly one minute', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  it('formats with hours', () => {
    expect(formatDuration(3750)).toBe('1:02:30');
  });

  it('formats zero seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  it('pads seconds correctly', () => {
    expect(formatDuration(65)).toBe('1:05');
  });
});
