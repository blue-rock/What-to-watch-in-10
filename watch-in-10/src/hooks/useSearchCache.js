import { useRef, useCallback } from 'react';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useSearchCache() {
  const cache = useRef(new Map());

  const getCacheKey = useCallback((type, query, duration) => {
    return `${type}:${query}:${duration}`;
  }, []);

  const get = useCallback((type, query, duration) => {
    const key = getCacheKey(type, query, duration);
    const entry = cache.current.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.current.delete(key);
      return null;
    }
    return entry.data;
  }, [getCacheKey]);

  const set = useCallback((type, query, duration, data) => {
    const key = getCacheKey(type, query, duration);
    cache.current.set(key, { data, timestamp: Date.now() });
    // Evict old entries if cache gets too large
    if (cache.current.size > 50) {
      const oldest = cache.current.keys().next().value;
      cache.current.delete(oldest);
    }
  }, [getCacheKey]);

  const clear = useCallback(() => {
    cache.current.clear();
  }, []);

  return { get, set, clear };
}
