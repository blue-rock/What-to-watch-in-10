import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useUsageTracker() {
  const [usage, setUsage] = useLocalStorage('watch10-usage', {
    moods: {},
    searches: {},
    watches: [],
  });

  const trackMood = useCallback(
    (moodId) => {
      setUsage((prev) => ({
        ...prev,
        moods: { ...prev.moods, [moodId]: (prev.moods[moodId] || 0) + 1 },
      }));
    },
    [setUsage]
  );

  const trackSearch = useCallback(
    (query) => {
      const key = query.toLowerCase().trim();
      if (!key) return;
      setUsage((prev) => ({
        ...prev,
        searches: { ...prev.searches, [key]: (prev.searches[key] || 0) + 1 },
      }));
    },
    [setUsage]
  );

  const trackWatch = useCallback(
    (video, moodId) => {
      setUsage((prev) => ({
        ...prev,
        watches: [
          { id: video.id, title: video.title, channel: video.channel, durationSeconds: video.durationSeconds, moodId, timestamp: Date.now() },
          ...prev.watches,
        ].slice(0, 200), // keep last 200
      }));
    },
    [setUsage]
  );

  return { usage, trackMood, trackSearch, trackWatch };
}
