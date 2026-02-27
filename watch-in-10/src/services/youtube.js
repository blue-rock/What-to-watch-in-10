import { parseDuration } from '../utils/duration';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey() {
  return import.meta.env.VITE_YOUTUBE_API_KEY || '';
}

/**
 * Search YouTube for videos matching a query.
 */
async function searchVideos(query, maxMinutes) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const videoDuration = maxMinutes <= 4 ? 'short' : 'medium';

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoDuration,
    maxResults: '20',
    relevanceLanguage: 'en',
    safeSearch: 'moderate',
    key: apiKey,
  });

  const res = await fetch(`${API_BASE}/search?${params}`);

  if (!res.ok) {
    const body = await res.text();
    console.error('YouTube Search API response:', res.status, body);
    throw new Error(`YouTube Search API error: ${res.status} — ${body}`);
  }

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    return [];
  }

  return data.items
    .map((item) => item.id?.videoId)
    .filter(Boolean);
}

/**
 * Get video details for a list of video IDs.
 */
async function getVideoDetails(videoIds) {
  const apiKey = getApiKey();
  if (!apiKey || videoIds.length === 0) return [];

  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
    key: apiKey,
  });

  const res = await fetch(`${API_BASE}/videos?${params}`);

  if (!res.ok) {
    const body = await res.text();
    console.error('YouTube Videos API response:', res.status, body);
    throw new Error(`YouTube Videos API error: ${res.status} — ${body}`);
  }

  const data = await res.json();
  return data.items || [];
}

/**
 * Normalize a raw API item into our video object.
 */
function normalizeVideo(item) {
  const durationSeconds = parseDuration(item.contentDetails.duration);
  const viewCount = parseInt(item.statistics?.viewCount || '0', 10);
  const commentCount = parseInt(item.statistics?.commentCount || '0', 10);
  const likeCount = parseInt(item.statistics?.likeCount || '0', 10);
  
  // Calculate engagement metrics
  const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
  const virality = Math.sqrt(viewCount); // Sqrt to avoid huge numbers dominating score
  
  return {
    id: item.id,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail:
      item.snippet.thumbnails.high?.url ||
      item.snippet.thumbnails.medium?.url ||
      item.snippet.thumbnails.default?.url,
    durationSeconds,
    viewCount,
    likeCount,
    commentCount,
    engagementRate,
    virality,
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id}`,
    tags: (item.snippet.tags || []).map((t) => t.toLowerCase()),
  };
}

/**
 * Score a video by how many of the genre's tags it matches.
 * Also incorporate engagement metrics and recency bonus.
 * Higher score = more relevant to the genre.
 */
function scoreByTags(video, genreTags) {
  const tagSet = new Set(genreTags.map((t) => t.toLowerCase()));
  let score = 0;
  
  // Tag matching (primary score)
  for (const tag of video.tags) {
    if (tagSet.has(tag)) {
      score += 2; // exact match
    } else {
      // partial match — tag contains a genre keyword or vice versa
      for (const gt of tagSet) {
        if (tag.includes(gt) || gt.includes(tag)) {
          score += 1;
          break;
        }
      }
    }
  }
  
  // Engagement bonus (secondary score)
  // Videos with higher engagement are naturally more appealing
  const engagementBonus = video.engagementRate * 2; // 0-2 extra points
  const viewBonus = Math.min(Math.log10(video.viewCount + 1) * 0.5, 1.5); // Capped at 1.5
  
  // Recency bonus (tertiary score)
  // Recent videos are fresher and more relevant to current trends
  const publishedDate = new Date(video.publishedAt);
  const daysSincePublish = (new Date() - publishedDate) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 1 - (daysSincePublish / 365)); // Decays over a year
  
  return score + engagementBonus + viewBonus + recencyBonus;
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Check if a video should be filtered out based on negative keywords.
 * Returns true if video SHOULD BE KEPT, false if it should be filtered out.
 */
function passesNegativeKeywords(video, negativeKeywords = []) {
  if (!negativeKeywords || negativeKeywords.length === 0) return true;
  
  const titleLower = video.title.toLowerCase();
  const negativeSet = new Set(negativeKeywords.map((k) => k.toLowerCase()));
  
  for (const keyword of negativeSet) {
    if (titleLower.includes(keyword)) {
      return false; // Filter out this video
    }
  }
  
  return true; // Keep this video
}

/**
 * Tags-first search algorithm with engagement ranking:
 *
 *  Layer 1 — TAG SEARCH (primary)
 *    Pick 3-4 random tags from the genre's tag list, search YouTube with them.
 *    Get video details including each video's own tags.
 *    Score every result by how many genre tags it matches + engagement metrics.
 *
 *  Layer 2 — KEYWORD SEARCH (supplementary)
 *    Search with a random keyword query from the genre to fill gaps.
 *    Score these results the same way.
 *
 *  Layer 3 — NEGATIVE FILTERING
 *    Remove videos matching negative keywords for the genre.
 *
 *  Layer 4 — MERGE + RANK + FILTER
 *    Deduplicate, sort by tag-relevance + engagement score, filter by duration,
 *    then shuffle within score tiers so it feels fresh.
 */
export async function fetchVideos(mood, maxMinutes) {
  const genreTags = mood.tags || [];
  const negativeKeywords = mood.negativeKeywords || [];

  // --- Layer 1: Tag-based search ---
  // Pick 3-4 random tags and join with | (OR) for broader results
  const shuffledTags = shuffle([...genreTags]);
  const tagQuery = shuffledTags.slice(0, 4).join(' | ');

  const tagIds = await searchVideos(tagQuery, maxMinutes);
  if (tagIds === null) return null; // no API key

  let tagDetails = [];
  if (tagIds.length > 0) {
    tagDetails = await getVideoDetails(tagIds);
  }

  // --- Layer 2: Keyword search (supplementary) ---
  const keyword = mood.queries[Math.floor(Math.random() * mood.queries.length)];
  const keywordIds = await searchVideos(keyword, maxMinutes);

  let keywordDetails = [];
  if (keywordIds && keywordIds.length > 0) {
    const existingIds = new Set(tagIds || []);
    const newIds = keywordIds.filter((id) => !existingIds.has(id));
    if (newIds.length > 0) {
      keywordDetails = await getVideoDetails(newIds);
    }
  }

  // --- Layer 3 + 4: Merge, filter, score, rank ---
  const allDetails = [...tagDetails, ...keywordDetails];
  const seen = new Set();
  const minSeconds = Math.max(0, (maxMinutes - 1) * 60);
  const maxSeconds = (maxMinutes + 1) * 60;

  const scored = [];
  for (const item of allDetails) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);

    const video = normalizeVideo(item);

    // Duration filter
    if (video.durationSeconds < minSeconds || video.durationSeconds > maxSeconds) {
      continue;
    }

    // Negative keywords filter
    if (!passesNegativeKeywords(video, negativeKeywords)) {
      continue;
    }

    video.relevanceScore = scoreByTags(video, genreTags);
    scored.push(video);
  }

  // Sort by relevance score (highest first)
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Group into tiers and shuffle within each tier for variety
  const highRelevance = scored.filter((v) => v.relevanceScore >= 5);
  const medRelevance = scored.filter((v) => v.relevanceScore >= 3 && v.relevanceScore < 5);
  const lowRelevance = scored.filter((v) => v.relevanceScore < 3);

  const result = [
    ...shuffle(highRelevance),
    ...shuffle(medRelevance),
    ...shuffle(lowRelevance),
  ].slice(0, 9);

  // Clean up internal fields before returning
  return result.map(({ relevanceScore, tags, engagementRate, virality, likeCount, commentCount, ...video }) => video);
}
