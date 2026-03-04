import { useState, useCallback } from 'react';
import { fetchVideos, searchByQuery } from '../services/youtube';
import { fallbackVideos } from '../data/fallback';
import { useSearchCache } from './useSearchCache';
import { useI18n } from './useI18n';

export function useYouTube() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const { get: getCache, set: setCache } = useSearchCache();
  const { locale, t } = useI18n();

  const search = useCallback(async (mood, maxMinutes) => {
    setVideos([]);
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    const cached = getCache('mood', mood.id, maxMinutes);
    if (cached) {
      setVideos(cached);
      setLoading(false);
      return;
    }

    try {
      const results = await fetchVideos(mood, maxMinutes, locale);

      if (results.length === 0) {
        const anyDuration = maxMinutes === 'any';
        const fb = (fallbackVideos[mood.id] || []).filter((v) => {
          if (anyDuration) return true;
          const minSeconds = Math.max(0, (maxMinutes - 3) * 60);
          const maxSeconds = (maxMinutes + 2) * 60;
          return v.durationSeconds >= minSeconds && v.durationSeconds <= maxSeconds;
        });

        if (fb.length > 0) {
          setVideos(fb);
          setUsingFallback(true);
        } else {
          setError(t('error.noMoodVideos'));
        }
      } else {
        setVideos(results);
        setCache('mood', mood.id, maxMinutes, results);
        try { localStorage.setItem('watch10-last-results', JSON.stringify(results)); } catch { /* */ }
      }
    } catch (err) {
      console.error('Video search error:', err);
      // Try offline localStorage fallback first
      try {
        const offline = JSON.parse(localStorage.getItem('watch10-last-results'));
        if (offline?.length) { setVideos(offline); setUsingFallback(true); setLoading(false); return; }
      } catch { /* */ }
      const anyDuration = maxMinutes === 'any';
      const fb = (fallbackVideos[mood.id] || []).filter((v) => {
        if (anyDuration) return true;
        const minSeconds = Math.max(0, (maxMinutes - 1) * 60);
        const maxSeconds = (maxMinutes + 1) * 60;
        return v.durationSeconds >= minSeconds && v.durationSeconds <= maxSeconds;
      });
      if (fb.length > 0) {
        setVideos(fb);
        setUsingFallback(true);
      } else {
        setError(t('error.generic'));
      }
    } finally {
      setLoading(false);
    }
  }, [getCache, setCache, locale, t]);

  const searchQuery = useCallback(async (query, maxMinutes) => {
    setVideos([]);
    setLoading(true);
    setError(null);
    setUsingFallback(false);

    const cached = getCache('query', query, maxMinutes);
    if (cached) {
      setVideos(cached);
      setLoading(false);
      return;
    }

    try {
      const results = await searchByQuery(query, maxMinutes, locale);

      if (results.length === 0) {
        setError(t('error.noSearchVideos'));
      } else {
        setVideos(results);
        setCache('query', query, maxMinutes, results);
        try { localStorage.setItem('watch10-last-results', JSON.stringify(results)); } catch { /* */ }
      }
    } catch (err) {
      console.error('Video search error:', err);
      try {
        const offline = JSON.parse(localStorage.getItem('watch10-last-results'));
        if (offline?.length) { setVideos(offline); setUsingFallback(true); setLoading(false); return; }
      } catch { /* */ }
      setError(t('error.generic'));
    } finally {
      setLoading(false);
    }
  }, [getCache, setCache, locale, t]);

  const reset = useCallback(() => {
    setVideos([]);
    setError(null);
    setUsingFallback(false);
  }, []);

  return { videos, loading, error, usingFallback, search, searchQuery, reset };
}
