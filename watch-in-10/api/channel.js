/**
 * Serverless API route: /api/channel
 *
 * Fetches a YouTube channel's page (banner, info, videos) using
 * YouTube's internal browse API (youtubei/v1/browse).
 *
 * Query params:
 *   channelId — YouTube channel ID starting with "UC..." (required)
 *   hl        — locale code (default: "en")
 */

const YOUTUBE_BROWSE_API = 'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false';

export default async function handler(req, res) {
  const { channelId, hl } = req.query || {};

  if (!channelId) {
    res.status(400).json({ error: 'Missing "channelId" query parameter' });
    return;
  }

  const clientCtx = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250227.00.00',
        hl: hl || 'en',
        gl: 'US',
      },
    },
    browseId: channelId,
  };

  try {
    // Fetch header (default browse) and latest videos (Videos tab sorted by date) in parallel
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
      res.status(headerRes.status).json({ error: `YouTube returned ${headerRes.status}` });
      return;
    }

    const [headerData, videosData] = await Promise.all([
      headerRes.ok ? headerRes.json() : null,
      videosRes.ok ? videosRes.json() : null,
    ]);

    const channel = extractChannelData(headerData, videosData);

    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    res.status(200).json(channel);
  } catch (err) {
    console.error('YouTube channel proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch from YouTube' });
  }
}

function extractChannelData(headerData, videosData) {
  const result = {
    name: '',
    handle: '',
    avatar: '',
    banner: '',
    subscriberCount: '',
    videos: [],
  };

  try {
    // Extract header info from the default browse response
    if (headerData) {
      const header = headerData?.header?.c4TabbedHeaderRenderer;
      const pageHeader = headerData?.header?.pageHeaderRenderer;

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
    }

    // Extract latest videos from the Videos tab response
    const data = videosData || headerData;
    if (data) {
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      for (const tab of tabs) {
        const tabContent = tab?.tabRenderer?.content;
        if (!tabContent) continue;

        const richGrid = tabContent?.richGridRenderer?.contents || [];
        for (const item of richGrid) {
          // Classic videoRenderer
          const vr = item?.richItemRenderer?.content?.videoRenderer;
          if (vr) { addVideo(result.videos, vr); continue; }
          // Newer lockupViewModel format
          const lvm = item?.richItemRenderer?.content?.lockupViewModel;
          if (lvm) addVideoFromLockup(result.videos, lvm);
        }

        if (result.videos.length === 0) {
          const sections = tabContent?.sectionListRenderer?.contents || [];
          for (const section of sections) {
            const shelfItems = section?.itemSectionRenderer?.contents || [];
            for (const shelf of shelfItems) {
              const items = shelf?.shelfRenderer?.content?.horizontalListRenderer?.items || [];
              for (const gridItem of items) {
                const vr = gridItem?.gridVideoRenderer;
                if (vr) addVideo(result.videos, vr);
              }
            }
          }
        }

        if (result.videos.length > 0) break;
      }
    }
  } catch (e) {
    console.error('Error parsing channel response:', e);
  }

  return result;
}

function addVideo(videos, vr) {
  const durationText = vr.lengthText?.simpleText || vr.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || '';
  const durationSeconds = parseDurationText(durationText);
  if (durationSeconds <= 0) return;

  const viewText = vr.viewCountText?.simpleText || vr.shortViewCountText?.simpleText || '';
  const viewCount = parseInt(viewText.replace(/[^0-9]/g, ''), 10) || 0;

  videos.push({
    id: vr.videoId,
    title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
    thumbnail:
      vr.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ||
      `https://i.ytimg.com/vi/${vr.videoId}/hqdefault.jpg`,
    durationSeconds,
    viewCount,
    publishedAt: vr.publishedTimeText?.simpleText || '',
    url: `https://www.youtube.com/watch?v=${vr.videoId}`,
  });
}

/** Handle newer lockupViewModel format used by YouTube */
function addVideoFromLockup(videos, lvm) {
  const videoId = lvm.contentId;
  if (!videoId) return;

  const meta = lvm.metadata?.lockupMetadataViewModel;
  const title = meta?.title?.content || '';

  // Duration from overlay
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

  // View count + published from metadata description
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

  videos.push({
    id: videoId,
    title,
    thumbnail: thumb,
    durationSeconds,
    viewCount,
    publishedAt,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  });
}

function parseDurationText(text) {
  if (!text) return 0;
  const parts = text.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}
