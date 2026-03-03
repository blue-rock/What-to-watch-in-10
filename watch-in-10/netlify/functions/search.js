/**
 * Netlify Serverless Function: /api/search → /.netlify/functions/search
 *
 * Proxies search requests to YouTube's internal API (youtubei/v1/search).
 * No API key required.
 *
 * Query params:
 *   q        — search query (required)
 *   duration — "short" (<4 min), "medium" (4-20 min), or "any" (default: "any")
 */

const YOUTUBE_API = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

const SP_FILTERS = {
  short: 'EgIYAQ%3D%3D',
  medium: 'EgIYAw%3D%3D',
  long: 'EgIYAg%3D%3D',
};

export default async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  const duration = url.searchParams.get('duration');

  if (!q) {
    return new Response(JSON.stringify({ error: 'Missing "q" query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250227.00.00',
        hl: 'en',
        gl: 'US',
      },
    },
    query: q,
  };

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
      return new Response(JSON.stringify({ error: `YouTube returned ${ytRes.status}` }), {
        status: ytRes.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await ytRes.json();
    const videos = extractVideos(data);

    return new Response(JSON.stringify({ items: videos }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (err) {
    console.error('YouTube search proxy error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch from YouTube' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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
        if (durationSeconds <= 0) continue;

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

function parseDurationText(text) {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
