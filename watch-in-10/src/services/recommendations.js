/**
 * Recommendation engine based on usage tracking data.
 * All data comes from localStorage — no external API calls.
 */

import { moods } from '../data/moods';

/** Get top moods sorted by usage count. */
export function getTopMoods(usage, limit = 3) {
  const entries = Object.entries(usage.moods || {});
  if (entries.length === 0) return [];

  return entries
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([id]) => moods.find((m) => m.id === id))
    .filter(Boolean);
}

/** Get suggested search queries from past searches. */
export function getSuggestedQueries(usage, limit = 5) {
  const entries = Object.entries(usage.searches || {});
  if (entries.length === 0) return [];

  return entries
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([query]) => query);
}

/** Get top watched channels. */
export function getTopChannels(usage, limit = 5) {
  const channelMap = {};
  for (const w of usage.watches || []) {
    if (w.channel) {
      channelMap[w.channel] = (channelMap[w.channel] || 0) + 1;
    }
  }
  return Object.entries(channelMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([channel, count]) => ({ channel, count }));
}
