import { useEffect } from 'react';

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const focusables = el.querySelectorAll(FOCUSABLE);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    const handler = (e) => {
      if (e.key !== 'Tab') return;
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    el.addEventListener('keydown', handler);
    first?.focus();
    return () => el.removeEventListener('keydown', handler);
  }, [containerRef]);
}
