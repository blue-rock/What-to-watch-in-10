/**
 * Social share utilities for individual videos.
 */

export function shareToWhatsApp(video) {
  const text = `Check out: ${video.title}\n${video.url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

export function shareToTwitter(video) {
  const text = `${video.title}`;
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(video.url)}`,
    '_blank'
  );
}

export async function copyVideoLink(video) {
  try {
    await navigator.clipboard.writeText(video.url);
    return true;
  } catch {
    return false;
  }
}

export async function shareNative(video) {
  if (!navigator.share) return false;
  try {
    await navigator.share({
      title: video.title,
      text: `Watch: ${video.title}`,
      url: video.url,
    });
    return true;
  } catch {
    return false;
  }
}
