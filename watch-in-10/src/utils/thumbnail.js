/**
 * Generate srcSet for YouTube video thumbnails using built-in size variants.
 * Falls back gracefully if the URL is not a standard YouTube thumbnail.
 */
export function getThumbnailSrcSet(thumbnail, videoId) {
  const id = videoId || extractVideoId(thumbnail);
  if (!id) return '';

  return [
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg 320w`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg 480w`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg 640w`,
  ].join(', ');
}

function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/\/vi\/([^/]+)\//);
  return match ? match[1] : null;
}
