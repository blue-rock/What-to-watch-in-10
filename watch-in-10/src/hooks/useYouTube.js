import { useState, useCallback } from 'react';
import { fetchVideos, searchByQuery } from '../services/youtube';
import { fallbackVideos } from '../data/fallback';

export function useYouTube() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const search = useCallback(async (mood, maxMinutes) => {
    setVideos([]);
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const results = await fetchVideos(mood, maxMinutes);

      if (results.length === 0) {
        // All proxy instances failed or no matches — use fallback data
        const minSeconds = Math.max(0, (maxMinutes - 3) * 60);
        const maxSeconds = (maxMinutes + 2) * 60;
        const fb = (fallbackVideos[mood.id] || []).filter(
          (v) => v.durationSeconds >= minSeconds && v.durationSeconds <= maxSeconds
        );

        if (fb.length > 0) {
          setVideos(fb);
          setUsingFallback(true);
        } else {
          setError('No videos found for this mood and duration. Try a different combination!');
        }
      } else {
        setVideos(results);
      }
    } catch (err) {
      console.error('Video search error:', err);
      // Fall back to sample data on error
      const minSeconds = Math.max(0, (maxMinutes - 1) * 60);
      const maxSeconds = (maxMinutes + 1) * 60;
      const fb = (fallbackVideos[mood.id] || []).filter(
        (v) => v.durationSeconds >= minSeconds && v.durationSeconds <= maxSeconds
      );
      if (fb.length > 0) {
        setVideos(fb);
        setUsingFallback(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const searchQuery = useCallback(async (query, maxMinutes) => {
    setVideos([]);
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      const results = await searchByQuery(query, maxMinutes);

      if (results.length === 0) {
        setError('No videos found for that search. Try different keywords or duration!');
      } else {
        setVideos(results);
      }
    } catch (err) {
      console.error('Video search error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setVideos([]);
    setError(null);
    setUsingFallback(false);
  }, []);

  return { videos, loading, error, usingFallback, search, searchQuery, reset };
}
