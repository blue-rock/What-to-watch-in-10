import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// YouTube internal API endpoint (no key needed)
const YOUTUBE_API = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';

const SP_FILTERS = {
  short: 'EgIYAQ%3D%3D',
  medium: 'EgIYAw%3D%3D',
  long: 'EgIYAg%3D%3D',
};

/** Parse "3:45" or "1:23:45" to seconds. */
function parseDurationText(text) {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/** Extract videos from YouTube's internal search response. */
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

/**
 * Vite plugin that handles /api/search during development.
 * In production, the same logic runs as a Vercel/Netlify serverless function.
 */
function youtubeSearchPlugin() {
  return {
    name: 'youtube-search-api',
    configureServer(server) {
      server.middlewares.use('/api/search', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const q = url.searchParams.get('q');
        const duration = url.searchParams.get('duration');

        if (!q) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing "q" query parameter' }));
          return;
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
            res.statusCode = ytRes.status;
            res.end(JSON.stringify({ error: `YouTube returned ${ytRes.status}` }));
            return;
          }

          const data = await ytRes.json();
          const videos = extractVideos(data);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ items: videos }));
        } catch (err) {
          console.error('YouTube search proxy error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to fetch from YouTube' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), youtubeSearchPlugin()],
})
