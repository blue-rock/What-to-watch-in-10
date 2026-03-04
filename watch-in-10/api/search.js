/**
 * Serverless API route: /api/search
 *
 * Proxies search requests to YouTube's internal API (youtubei/v1/search).
 * No API key required — this is the same endpoint youtube.com itself uses.
 *
 * Works on:  Vercel (out-of-the-box), Netlify (with redirects), Node/Express.
 * Locally:   Vite dev server proxies /api → this handler or directly to YouTube.
 *
 * Query params:
 *   q        — search query (required)
 *   duration — "short" (<4 min), "medium" (4-20 min), or "any" (default: "any")
 */

const YOUTUBE_API = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

// Duration filter param values that YouTube's internal API accepts
const SP_FILTERS = {
  short: 'EgIYAQ%3D%3D',   // Under 4 minutes
  medium: 'EgIYAw%3D%3D',  // 4–20 minutes
  long: 'EgIYAg%3D%3D',    // Over 20 minutes
};

export default async function handler(req, res) {
  const { q, duration, hl } = req.query || {};

  if (!q) {
    res.status(400).json({ error: 'Missing "q" query parameter' });
    return;
  }

  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250227.00.00',
        hl: hl || 'en',
        gl: 'US',
      },
    },
    query: q,
  };

  // Add duration filter if specified
  if (duration && SP_FILTERS[duration]) {
    body.params = SP_FILTERS[duration];
  }

  try {
    const ytRes = await fetch(YOUTUBE_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!ytRes.ok) {
      res.status(ytRes.status).json({ error: `YouTube returned ${ytRes.status}` });
      return;
    }

    const data = await ytRes.json();
    const videos = extractVideos(data);

    // Cache for 10 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    res.status(200).json({ items: videos });
  } catch (err) {
    console.error('YouTube search proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch from YouTube' });
  }
}

/**
 * Extract video data from YouTube's internal API response.
 * The response structure is deeply nested — we dig through it to find
 * videoRenderer objects which contain all the metadata we need.
 */
function extractVideos(data) {
  const videos = [];

  try {
    const contents =
      data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents || [];

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || [];
      for (const item of items) {
        const vr = item?.videoRenderer;
        if (!vr) continue;

        const durationText = vr.lengthText?.simpleText || '';
        const durationSeconds = parseDurationText(durationText);
        if (durationSeconds <= 0) continue; // skip live streams / unknown

        const viewText = vr.viewCountText?.simpleText || '';
        const viewCount = parseInt(viewText.replace(/[^0-9]/g, ''), 10) || 0;

        videos.push({
          id: vr.videoId,
          title: vr.title?.runs?.[0]?.text || '',
          channel: vr.ownerText?.runs?.[0]?.text || '',
          thumbnail:
            vr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
            `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
          durationSeconds,
          viewCount,
          publishedAt: vr.publishedTimeText?.simpleText || '',
          url: `https://www.youtube.com/watch?v=${vr.videoId}`,
        });
      }
    }
  } catch (e) {
    console.error('Error parsing YouTube response:', e);
  }

  return videos;
}

/** Convert "3:45" or "1:23:45" to total seconds. */
function parseDurationText(text) {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
