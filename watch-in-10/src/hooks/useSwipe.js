import { useRef, useCallback } from 'react';

const THRESHOLD = 80;

export function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = true;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!swiping.current) return;
    swiping.current = false;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX.current;
    const dy = Math.abs(endY - startY.current);

    // Only trigger horizontal swipes (not vertical scroll)
    if (dy > Math.abs(dx)) return;

    if (dx > THRESHOLD) {
      onSwipeRight?.();
    } else if (dx < -THRESHOLD) {
      onSwipeLeft?.();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}
