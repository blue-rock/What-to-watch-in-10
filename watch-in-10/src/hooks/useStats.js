import { useMemo } from 'react';

export function useStats(usage) {
  return useMemo(() => {
    const watches = usage?.watches || [];
    const totalWatched = watches.length;
    const totalSeconds = watches.reduce((sum, w) => sum + (w.durationSeconds || 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    // Top moods
    const moodCounts = {};
    for (const w of watches) {
      if (w.moodId) moodCounts[w.moodId] = (moodCounts[w.moodId] || 0) + 1;
    }
    const topMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));

    // Top channels
    const channelCounts = {};
    for (const w of watches) {
      if (w.channel) channelCounts[w.channel] = (channelCounts[w.channel] || 0) + 1;
    }
    const topChannels = Object.entries(channelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([channel, count]) => ({ channel, count }));

    return { totalWatched, totalMinutes, topMoods, topChannels };
  }, [usage]);
}
