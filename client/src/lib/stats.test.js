import { describe, it, expect } from 'vitest';
import { computeStats } from './stats';

const entry = (date, extra = {}) => ({ date, content: '<p>One two three.</p>', grade: 7, emoji: 'happy', ...extra });

describe('computeStats', () => {
  it('returns null for an empty journal', () => {
    expect(computeStats([])).toBeNull();
  });

  it('counts words, grades and moods', () => {
    const stats = computeStats([
      entry('2026-10-01', { grade: 9, emoji: 'happy' }),
      entry('2026-10-01', { grade: 5, emoji: 'sad', content: '<p>Hi&nbsp;there! Bye.</p>' }),
      entry('2026-10-03', { grade: 7, emoji: 'happy' }),
    ], { today: new Date('2026-10-20T12:00:00Z') });
    expect(stats.totalEntries).toBe(3);
    expect(stats.daysJournaled).toBe(2);
    expect(stats.totalWords).toBe(9);
    expect(stats.avgGrade).toBe(7);
    expect(stats.topMood).toBe('happy');
    expect(stats.maxEntriesInDay).toBe(2);
    expect(stats.currentStreak).toBe(0);
  });

  it('keeps the current streak alive before today is written', () => {
    const stats = computeStats(
      [entry('2026-10-27'), entry('2026-10-28'), entry('2026-10-29')],
      { today: new Date('2026-10-30T09:00:00Z') },
    );
    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
  });

  it('reads the weekday of a date the same everywhere', () => {
    const stats = computeStats([entry('2026-10-26')]); // a Monday
    expect(stats.peakDay).toBe('Monday');
  });
});
