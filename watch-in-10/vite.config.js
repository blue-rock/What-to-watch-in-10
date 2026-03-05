import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// YouTube internal API endpoints (no key needed)
const YOUTUBE_API = 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false';
const YOUTUBE_BROWSE_API = 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false';

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
          channelId: vr.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
          channelAvatar: vr.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url || '',
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

/** Extract channel data from YouTube's internal browse response. */
function extractChannelData(headerData, videosData) {
  const result = { name: '', handle: '', avatar: '', banner: '', subscriberCount: '', videos: [] };
  try {
    const data = headerData || videosData;
    const header = data?.header?.c4TabbedHeaderRenderer;
    const pageHeader = data?.header?.pageHeaderRenderer;

    if (header) {
      result.name = header.title || '';
      result.avatar = header.avatar?.thumbnails?.slice(-1)?.[0]?.url || '';
      result.banner = header.banner?.thumbnails?.slice(-1)?.[0]?.url || '';
      result.subscriberCount = header.subscriberCountText?.simpleText || '';
      result.handle = header.channelHandleText?.runs?.[0]?.text || '';
    } else if (pageHeader) {
      const content = pageHeader.content?.pageHeaderViewModel;
      result.name = content?.title?.dynamicTextViewModel?.text?.content || '';
      result.avatar = content?.image?.decoratedAvatarViewModel?.avatar?.avatarViewModel?.image?.sources?.slice(-1)?.[0]?.url || '';
      const banner = pageHeader.content?.pageHeaderViewModel?.banner;
      result.banner = banner?.imageBannerViewModel?.image?.sources?.slice(-1)?.[0]?.url || '';
      const metaRow = content?.metadata?.contentMetadataViewModel?.metadataRows;
      if (metaRow) {
        for (const row of metaRow) {
          for (const part of row?.metadataParts || []) {
            const text = part?.text?.content || '';
            if (text.startsWith('@')) result.handle = text;
            else if (text.includes('subscriber')) result.subscriberCount = text;
          }
        }
      }
    }

    const vidData = videosData || headerData;
    const tabs = vidData?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    for (const tab of tabs) {
      const tabContent = tab?.tabRenderer?.content;
      if (!tabContent) continue;
      const richGrid = tabContent?.richGridRenderer?.contents || [];
      for (const item of richGrid) {
        const vr = item?.richItemRenderer?.content?.videoRenderer;
        if (vr) { addChannelVideo(result.videos, vr); continue; }
        const lvm = item?.richItemRenderer?.content?.lockupViewModel;
        if (lvm) addChannelVideoFromLockup(result.videos, lvm);
      }
      if (result.videos.length === 0) {
        const sections = tabContent?.sectionListRenderer?.contents || [];
        for (const section of sections) {
          const shelfItems = section?.itemSectionRenderer?.contents || [];
          for (const shelf of shelfItems) {
            const items = shelf?.shelfRenderer?.content?.horizontalListRenderer?.items || [];
            for (const gridItem of items) {
              const vr = gridItem?.gridVideoRenderer;
              if (vr) addChannelVideo(result.videos, vr);
            }
          }
        }
      }
      if (result.videos.length > 0) break;
    }
  } catch (e) {
    console.error('Error parsing channel response:', e);
  }
  return result;
}

function addChannelVideo(videos, vr) {
  const durationText = vr.lengthText?.simpleText || vr.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || '';
  const durationSeconds = parseDurationText(durationText);
  if (durationSeconds <= 0) return;
  const viewText = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || '';
  const viewCount = parseInt(viewText.replace(/[^0-9]/g, ''), 10) || 0;
  videos.push({
    id: vr.videoId,
    title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
    thumbnail: vr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url || `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
    durationSeconds,
    viewCount,
    publishedAt: vr.publishedTimeText?.simpleText || '',
    url: `https://www.youtube.com/watch?v=${vr.videoId}`,
  });
}

function addChannelVideoFromLockup(videos, lvm) {
  const videoId = lvm.contentId;
  if (!videoId) return;
  const meta = lvm.metadata?.lockupMetadataViewModel;
  const title = meta?.title?.content || '';
  const overlay = lvm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.overlays;
  let durationText = '';
  if (overlay) {
    for (const o of overlay) {
      durationText = o?.thumbnailOverlayBadgeViewModel?.thumbnailBadges?.[0]?.thumbnailBadgeViewModel?.text || '';
      if (durationText) break;
    }
  }
  const durationSeconds = parseDurationText(durationText);
  if (durationSeconds <= 0) return;
  const descParts = meta?.metadata?.contentMetadataViewModel?.metadataRows?.[0]?.metadataParts || [];
  let viewCount = 0;
  let publishedAt = '';
  for (const part of descParts) {
    const text = part?.text?.content || '';
    if (text.includes('view')) viewCount = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    else if (text.includes('ago')) publishedAt = text;
  }
  const thumb = lvm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources?.slice(-1)?.[0]?.url
    || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  videos.push({ id: videoId, title, thumbnail: thumb, durationSeconds, viewCount, publishedAt, url: `https://www.youtube.com/watch?v=${videoId}` });
}

/**
 * Vite plugin that handles /api/search during development.
 * In production, the same logic runs as a Vercel/Netlify serverless function.
 */
function youtubeSearchPlugin() {
  return {
    name: 'youtube-search-api',
    configureServer(server) {
      // Channel browse endpoint
      server.middlewares.use('/api/channel', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const channelId = url.searchParams.get('channelId');
        const hl = url.searchParams.get('hl') || 'en';

        if (!channelId) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing "channelId" query parameter' }));
          return;
        }

        const clientCtx = {
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20250227.00.00',
              hl,
              gl: 'US',
            },
          },
          browseId: channelId,
        };

        try {
          // Fetch header and latest videos in parallel
          const [headerRes, videosRes] = await Promise.all([
            fetch(YOUTUBE_BROWSE_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(clientCtx),
            }),
            fetch(YOUTUBE_BROWSE_API, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...clientCtx, params: 'EgZ2aWRlb3PyBgQKAjoA' }),
            }),
          ]);

          if (!headerRes.ok && !videosRes.ok) {
            res.statusCode = headerRes.status;
            res.end(JSON.stringify({ error: `YouTube returned ${headerRes.status}` }));
            return;
          }

          const [headerData, videosData] = await Promise.all([
            headerRes.ok ? headerRes.json() : null,
            videosRes.ok ? videosRes.json() : null,
          ]);

          const channel = extractChannelData(headerData, videosData);

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(channel));
        } catch (err) {
          console.error('YouTube channel proxy error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to fetch from YouTube' }));
        }
      });

      // Search endpoint
      server.middlewares.use('/api/search', async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        const q = url.searchParams.get('q');
        const duration = url.searchParams.get('duration');
        const hl = url.searchParams.get('hl') || 'en';

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
              hl,
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
