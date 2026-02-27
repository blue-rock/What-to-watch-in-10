import { useState, useCallback } from 'react';
import { fetchVideos } from '../services/youtube';
import { fallbackVideos } from '../data/fallback';

export function useYouTube() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const search = useCallback(async (mood, maxMinutes) => {
    // Clear old results immediately so stale data never shows
    setVideos([]);
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const results = await fetchVideos(mood, maxMinutes);

      if (results === null) {
        // No API key — use fallback data
        const minSeconds = Math.max(0, (maxMinutes - 1) * 60);
        const maxSeconds = (maxMinutes + 1) * 60;
        const fb = (fallbackVideos[mood.id] || []).filter(
          (v) => v.durationSeconds >= minSeconds && v.durationSeconds <= maxSeconds
        );
        setVideos(fb);
        setUsingFallback(true);
      } else if (results.length === 0) {
        setVideos([]);
        setError('No videos found for this mood and duration. Try a different combination!');
      } else {
        setVideos(results);
      }
    } catch (err) {
      console.error('YouTube API error:', err);
      setError(`API error: ${err.message}`);
      // Fall back to sample data on error
      const minSeconds = Math.max(0, (maxMinutes - 1) * 60);
      const maxSeconds = (maxMinutes + 1) * 60;
      const fb = (fallbackVideos[mood.id] || []).filter(
        (v) => v.durationSeconds >= minSeconds && v.durationSeconds <= maxSeconds
      );
      if (fb.length > 0) {
        setVideos(fb);
        setUsingFallback(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setVideos([]);
    setError(null);
    setUsingFallback(false);
  }, []);

  return { videos, loading, error, usingFallback, search, reset };
}
