import { useEffect } from 'react';

export function useKeyboardShortcuts({ onFocusSearch, onToggleTheme, onOpenFavorites }) {
  useEffect(() => {
    const handler = (e) => {
      // Don't trigger shortcuts when typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      // Don't trigger when modal/dialog is open
      if (document.querySelector('[aria-modal="true"]')) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          onFocusSearch?.();
          break;
        case 'd':
          if (!e.ctrlKey && !e.metaKey) onToggleTheme?.();
          break;
        case 'f':
          if (!e.ctrlKey && !e.metaKey) onOpenFavorites?.();
          break;
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onFocusSearch, onToggleTheme, onOpenFavorites]);
}
