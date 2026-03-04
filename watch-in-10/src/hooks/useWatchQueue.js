import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function useWatchQueue() {
  const [queue, setQueue] = useLocalStorage('watch10-queue', []);

  const addToQueue = useCallback(
    (video) => {
      setQueue((prev) => {
        if (prev.some((v) => v.id === video.id)) return prev;
        return [...prev, video];
      });
    },
    [setQueue]
  );

  const removeFromQueue = useCallback(
    (videoId) => {
      setQueue((prev) => prev.filter((v) => v.id !== videoId));
    },
    [setQueue]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, [setQueue]);

  const nextInQueue = useCallback(() => {
    if (queue.length === 0) return null;
    const next = queue[0];
    setQueue((prev) => prev.slice(1));
    return next;
  }, [queue, setQueue]);

  const reorder = useCallback(
    (fromIndex, toIndex) => {
      setQueue((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return updated;
      });
    },
    [setQueue]
  );

  return { queue, addToQueue, removeFromQueue, clearQueue, nextInQueue, reorder };
}
