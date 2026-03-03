import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage('watch10-favorites', []);
  const [history, setHistory] = useLocalStorage('watch10-history', []);

  const toggleFavorite = useCallback(
    (video) => {
      setFavorites((prev) => {
        const exists = prev.some((v) => v.id === video.id);
        if (exists) return prev.filter((v) => v.id !== video.id);
        return [{ ...video, savedAt: Date.now() }, ...prev];
      });
    },
    [setFavorites]
  );

  const isFavorite = useCallback(
    (videoId) => favorites.some((v) => v.id === videoId),
    [favorites]
  );

  const addToHistory = useCallback(
    (video) => {
      setHistory((prev) => {
        const filtered = prev.filter((v) => v.id !== video.id);
        return [{ ...video, watchedAt: Date.now() }, ...filtered].slice(0, 50);
      });
    },
    [setHistory]
  );

  const clearHistory = useCallback(() => setHistory([]), [setHistory]);
  const clearFavorites = useCallback(() => setFavorites([]), [setFavorites]);

  return { favorites, history, toggleFavorite, isFavorite, addToHistory, clearHistory, clearFavorites };
}
