import { useCallback } from 'react';

export function useShareList() {
  const generateShareUrl = useCallback((videos, mood, time, searchTerm) => {
    const ids = videos.map((v) => v.id).join(',');
    const params = new URLSearchParams();
    params.set('v', ids);
    if (mood) params.set('mood', mood.id);
    if (time) params.set('t', time);
    if (searchTerm) params.set('q', searchTerm);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, []);

  const share = useCallback(async (videos, mood, time, searchTerm) => {
    const url = generateShareUrl(videos, mood, time, searchTerm);
    const title = mood
      ? `${mood.icon} ${mood.label} videos — What Should I Watch in 10 Minutes?`
      : `"${searchTerm}" — What Should I Watch in 10 Minutes?`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return true;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }, [generateShareUrl]);

  return { share, generateShareUrl };
}
