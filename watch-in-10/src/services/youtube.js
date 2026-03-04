/**
 * YouTube video search service.
 *
 * Calls /api/search which proxies to YouTube's internal API.
 * - In development: handled by the Vite plugin (vite.config.js)
 * - In production:  handled by a Vercel/Netlify serverless function (api/search.js)
 *
 * No API key required anywhere in the chain.
 */

const FETCH_TIMEOUT = 12000; // ms

// ---------------------------------------------------------------------------
// Video availability check via oEmbed (lightweight — no API key needed)
// ---------------------------------------------------------------------------

async function checkAvailability(videos) {
  if (!videos.length) return videos;

  const checks = videos.map(async (video) => {
    const id = video.url?.match(/[?&]v=([^&]+)/)?.[1] || video.id;
    if (!id) return video;
    try {
      // Use noembed.com — a CORS-friendly oEmbed proxy
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) return null;
      const data = await res.json();
      // noembed returns an error field for unavailable videos
      return data.error ? null : video;
    } catch {
      return video; // on timeout/error, keep the video (don't block results)
    }
  });

  const results = await Promise.all(checks);
  return results.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Search helper
// ---------------------------------------------------------------------------

async function searchVideos(query, maxMinutes, hl = 'en') {
  const duration = maxMinutes === 'any' ? 'any' : maxMinutes <= 4 ? 'short' : 'medium';
  const url = `/api/search?q=${encodeURIComponent(query)}&duration=${duration}&hl=${hl}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item) => ({
      ...item,
      tags: extractTags(item.title),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Derive pseudo-tags from a title string (for scoring). */
function extractTags(title) {
  if (!title) return [];
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

// ---------------------------------------------------------------------------
// Scoring + ranking (preserved from original algorithm)
// ---------------------------------------------------------------------------

function scoreByTags(video, genreTags) {
  const tagSet = new Set(genreTags.map((t) => t.toLowerCase()));
  let score = 0;

  for (const tag of video.tags) {
    if (tagSet.has(tag)) {
      score += 2;
    } else {
      for (const gt of tagSet) {
        if (tag.includes(gt) || gt.includes(tag)) {
          score += 1;
          break;
        }
      }
    }
  }

  // Popularity bonus (capped)
  const viewBonus = Math.min(Math.log10(video.viewCount + 1) * 0.5, 1.5);

  return score + viewBonus;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function passesNegativeKeywords(video, negativeKeywords = []) {
  if (!negativeKeywords.length) return true;
  const titleLower = video.title.toLowerCase();
  return !negativeKeywords.some((kw) => titleLower.includes(kw.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Main export — tags-first search with engagement ranking
// ---------------------------------------------------------------------------

/**
 * Fetch and rank videos for a given mood + duration.
 * Returns an array of video objects (max 9), or an empty array on failure.
 */
export async function fetchVideos(mood, maxMinutes, hl = 'en') {
  const genreTags = mood.tags || [];
  const negativeKeywords = mood.negativeKeywords || [];

  // --- Layer 1: Tag-based search ---
  const shuffledTags = shuffle([...genreTags]);
  const tagQuery = shuffledTags.slice(0, 4).join(' | ');
  const tagResults = await searchVideos(tagQuery, maxMinutes, hl);

  // --- Layer 2: Keyword search (supplementary) ---
  const keyword = mood.queries[Math.floor(Math.random() * mood.queries.length)];
  const keywordResults = await searchVideos(keyword, maxMinutes, hl);

  // --- Layer 3 + 4: Merge, dedupe, filter, score, rank ---
  const seenIds = new Set();
  const anyDuration = maxMinutes === 'any';
  const minSeconds = anyDuration ? 0 : Math.max(0, (maxMinutes - 3) * 60);
  const maxSeconds = anyDuration ? Infinity : (maxMinutes + 2) * 60;

  const allResults = [...tagResults, ...keywordResults];
  const scored = [];

  for (const video of allResults) {
    if (!video.id || seenIds.has(video.id)) continue;
    seenIds.add(video.id);

    if (!anyDuration && (video.durationSeconds < minSeconds || video.durationSeconds > maxSeconds)) {
      continue;
    }

    if (!passesNegativeKeywords(video, negativeKeywords)) {
      continue;
    }

    video.relevanceScore = scoreByTags(video, genreTags);
    scored.push(video);
  }

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  const high = scored.filter((v) => v.relevanceScore >= 5);
  const med = scored.filter((v) => v.relevanceScore >= 3 && v.relevanceScore < 5);
  const low = scored.filter((v) => v.relevanceScore < 3);

  const result = [...shuffle(high), ...shuffle(med), ...shuffle(low)].slice(0, 9);

  const cleaned = result.map(({ relevanceScore, tags, ...video }) => video);
  return checkAvailability(cleaned);
}

/**
 * Search videos by a free-text query + duration.
 * Simpler path than fetchVideos — no tag scoring, just duration filter + popularity sort.
 * Returns an array of video objects (max 9), or an empty array on failure.
 */
export async function searchByQuery(query, maxMinutes, hl = 'en') {
  const results = await searchVideos(query, maxMinutes, hl);

  const seenIds = new Set();
  const anyDuration = maxMinutes === 'any';
  const minSeconds = anyDuration ? 0 : Math.max(0, (maxMinutes - 3) * 60);
  const maxSeconds = anyDuration ? Infinity : (maxMinutes + 2) * 60;
  const filtered = [];

  for (const video of results) {
    if (!video.id || seenIds.has(video.id)) continue;
    seenIds.add(video.id);

    if (!anyDuration && (video.durationSeconds < minSeconds || video.durationSeconds > maxSeconds)) {
      continue;
    }

    filtered.push(video);
  }

  filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

  const cleaned = filtered.slice(0, 9).map(({ tags, ...video }) => video);
  return checkAvailability(cleaned);
}
