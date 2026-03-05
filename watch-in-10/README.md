# What Should I Watch in 10 Minutes?

A mood-based YouTube video discovery platform that curates short-form videos based on your mood and available time. Features real-time collaborative Watch Rooms, channel browsing, playlists, favorites, and more — all without requiring a YouTube API key.

![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-orange)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
  - [Video Discovery Algorithm](#video-discovery-algorithm)
  - [YouTube API Integration](#youtube-api-integration)
  - [Channel Browsing](#channel-browsing)
  - [Watch Rooms (Firebase)](#watch-rooms-firebase)
  - [Recommendation Engine](#recommendation-engine)
  - [Daily Picks Algorithm](#daily-picks-algorithm)
- [Architecture Deep Dive](#architecture-deep-dive)
  - [Serverless API Layer](#serverless-api-layer)
  - [Custom Hooks](#custom-hooks)
  - [State Management](#state-management)
  - [Theming System](#theming-system)
  - [Internationalization (i18n)](#internationalization-i18n)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Features

| Feature | Description |
|---------|-------------|
| **Mood-Based Discovery** | 19 mood categories (Music, Sports, Comedy, Motivation, etc.) with intelligent tag-based search |
| **Time Filtering** | Choose 5, 10, 15, 20, 30 min, or "Any" duration |
| **Channel Browsing** | Click any channel name to view full channel page with banner, avatar, subscriber count, and video grid |
| **Watch Rooms** | Real-time collaborative watching powered by Firebase — host controls playback for all guests |
| **Favorites & History** | Save favorite videos and track watch history (stored locally) |
| **Playlists** | Create custom named playlists, add/remove videos |
| **Watch Queue** | FIFO queue with auto-advance to next video |
| **Daily Picks** | 3 curated videos that refresh daily (deterministic seed) |
| **Trending** | Weekly trending videos in a horizontal carousel |
| **Free-Text Search** | Search any topic with duration filtering |
| **Mini Player** | Floating draggable player — keep watching while browsing |
| **Dark/Light Mode** | System preference detection + manual toggle |
| **4 Languages** | English, Hindi, Spanish, French |
| **Offline Support** | 200+ fallback videos, service worker caching, PWA-ready |
| **Swipe Gestures** | Swipe right to favorite, left to dismiss (mobile) |
| **Usage Stats** | Track top moods, channels, and search patterns |
| **Share** | Share videos via WhatsApp, Twitter, native share, or copy link |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 (functional components + hooks) |
| **Build Tool** | Vite 6 with custom plugin for dev API proxy |
| **Realtime DB** | Firebase Realtime Database (Watch Rooms) |
| **API** | YouTube's internal API (`youtubei/v1`) — no API key needed |
| **Serverless** | Netlify Functions / Vercel Serverless Functions |
| **Styling** | Vanilla CSS with custom properties, BEM naming |
| **i18n** | Custom React Context-based translation system |

**Dependencies (minimal):**
```
react@19       — UI framework
react-dom@19   — DOM rendering
firebase@12    — Realtime database for Watch Rooms
vite@6         — Build tool (dev dependency)
```

---

## Project Structure

```
watch-in-10/
├── api/                          # Vercel serverless functions
│   ├── search.js                 #   YouTube search proxy
│   └── channel.js                #   YouTube channel browse proxy
├── netlify/functions/            # Netlify serverless functions
│   ├── search.js                 #   YouTube search proxy
│   └── channel.js                #   YouTube channel browse proxy
├── public/                       # Static assets & PWA manifest
├── src/
│   ├── components/               # 25 React components
│   │   ├── App.jsx               #   Root — state management, routing
│   │   ├── Header.jsx            #   Navigation, language, theme toggle
│   │   ├── SearchBar.jsx         #   Free-text search input
│   │   ├── MoodSelector.jsx      #   19-mood grid selector
│   │   ├── TimePicker.jsx        #   Duration selector (5-30 min)
│   │   ├── VideoGrid.jsx         #   Infinite-scroll video grid
│   │   ├── VideoCard.jsx         #   Video thumbnail, title, actions
│   │   ├── VideoPlayerModal.jsx  #   Full-screen YouTube embed player
│   │   ├── MiniPlayer.jsx        #   Floating draggable player
│   │   ├── ChannelPage.jsx       #   Full channel page with inline player
│   │   ├── WatchRoom.jsx         #   Collaborative watching UI
│   │   ├── WatchRoomLobby.jsx    #   Create/join room interface
│   │   ├── DailyPicks.jsx        #   Daily curated videos
│   │   ├── TrendingSection.jsx   #   Trending carousel
│   │   ├── FavoritesPanel.jsx    #   Favorites + history sidebar
│   │   ├── PlaylistDetail.jsx    #   Playlist video list
│   │   ├── WatchQueue.jsx        #   Queue management panel
│   │   ├── CategoryTabs.jsx      #   Tab navigation
│   │   ├── SortFilter.jsx        #   Sort by relevance/views/duration
│   │   ├── AdvancedFilters.jsx   #   Upload date, HD filtering
│   │   ├── StatsPage.jsx         #   Usage statistics
│   │   ├── Onboarding.jsx        #   First-time walkthrough
│   │   ├── OfflineBanner.jsx     #   Offline indicator
│   │   ├── SkeletonGrid.jsx      #   Loading placeholders
│   │   ├── LoadingSpinner.jsx    #   Animated spinner
│   │   └── Footer.jsx            #   Footer
│   ├── hooks/                    # 15 custom React hooks
│   │   ├── useYouTube.js         #   Search orchestration + caching
│   │   ├── useWatchRoom.js       #   Firebase room logic
│   │   ├── useFavorites.js       #   Favorites + history
│   │   ├── usePlaylists.js       #   Playlist CRUD
│   │   ├── useWatchQueue.js      #   Queue operations
│   │   ├── useTheme.js           #   Dark/light mode
│   │   ├── useI18n.js            #   Translation context
│   │   ├── useUsageTracker.js    #   Usage analytics
│   │   ├── useStats.js           #   Stats computation
│   │   ├── useSearchCache.js     #   In-memory cache (5 min TTL)
│   │   ├── useKeyboardShortcuts.js # Global keyboard events
│   │   ├── useFocusTrap.js       #   Modal focus containment
│   │   ├── useSwipe.js           #   Touch gesture detection
│   │   ├── useShareList.js       #   URL-based result sharing
│   │   └── useLocalStorage.js    #   Persistent state
│   ├── services/
│   │   ├── youtube.js            #   fetchVideos, searchByQuery, fetchChannel
│   │   └── recommendations.js    #   getTopMoods, getSuggestedQueries, getTopChannels
│   ├── config/
│   │   └── firebase.js           #   Firebase initialization
│   ├── data/
│   │   ├── moods.js              #   19 mood definitions (tags, queries, filters)
│   │   └── fallback.js           #   200+ offline fallback videos
│   ├── i18n/
│   │   └── translations.js       #   EN, HI, ES, FR translations
│   ├── utils/
│   │   ├── duration.js           #   Duration formatting helpers
│   │   └── share.js              #   Share to WhatsApp, Twitter, copy link
│   ├── main.jsx                  #   Entry point + service worker registration
│   └── index.css                 #   Global styles + CSS custom properties
├── vite.config.js                # Vite config + YouTube API dev proxy
├── netlify.toml                  # Netlify deployment config
├── index.html                    # HTML entry point
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/blue-rock/What-to-watch-in-10.git
cd What-to-watch-in-10/watch-in-10

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173`. The Vite dev server includes a custom plugin that proxies `/api/search` and `/api/channel` requests to YouTube's internal API.

### Build for Production

```bash
npm run build    # Output → dist/
npm run preview  # Preview the production build locally
```

### Firebase Setup (for Watch Rooms)

Watch Rooms require Firebase Realtime Database. Skip this if you don't need collaborative watching.

1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Realtime Database**
3. Set database rules:
   ```json
   {
     "rules": {
       "rooms": {
         "$roomId": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```
4. Create a `.env` file (see [Environment Variables](#environment-variables))

---

## How It Works

### Video Discovery Algorithm

The core algorithm in [`src/services/youtube.js`](src/services/youtube.js) uses a multi-layer approach to find relevant videos:

#### Step 1: Dual Search Strategy

For each mood selection, two parallel searches are performed:

```
Layer 1 — Tag-Based Search
  Shuffles the mood's tags and picks 4 random tags
  Example: mood "Music" → tags ["acoustic", "live performance", "singing", "concert"]
  Query sent to YouTube: "acoustic | live performance | singing | concert"

Layer 2 — Keyword Search
  Picks a random query from the mood's predefined queries
  Example: "best music videos under 15 minutes"
```

This dual approach ensures both **relevance** (tags) and **variety** (keyword phrases).

#### Step 2: Duration Filtering

Videos are filtered by duration with a ±2 minute tolerance:

```
User selects 10 min → accepts videos from 7 to 12 minutes
User selects "Any"  → no duration filter applied
```

YouTube's API-level duration filter is also used:
- `short` (< 4 min) for 5-minute selection
- `medium` (4-20 min) for 10-20 minute selections
- `any` for 30 min or "Any" selection

#### Step 3: Negative Keyword Filtering

Each mood has a blacklist of keywords to exclude irrelevant content:

```javascript
// Music mood excludes:
negativeKeywords: ['remix', 'compilation', 'mix', 'dj', 'playlist']

// Sports mood excludes:
negativeKeywords: ['full match', 'live stream', 'streams', 'intro', 'reaction']
```

Videos whose titles contain any negative keyword are removed.

#### Step 4: Relevance Scoring

Each video is scored based on tag matching and popularity:

```
Tag Scoring:
  +2 points — exact match between video title word and mood tag
  +1 point  — substring match (partial overlap)

Popularity Bonus:
  +log10(viewCount) × 0.5 — capped at 1.5 points
  Example: 1M views → +3.0 × 0.5 = +1.5 (max)
  Example: 10K views → +2.0 × 0.5 = +1.0
```

#### Step 5: Tiered Shuffle

Videos are grouped into quality tiers and shuffled within each:

```
High tier  — score ≥ 5 (highly relevant, popular)
Medium tier — score 3-5 (moderately relevant)
Low tier   — score < 3 (loosely relevant)

Final result: [shuffle(high), shuffle(med), shuffle(low)].slice(0, 9)
```

This ensures the best matches appear first while maintaining variety within each tier.

#### Step 6: Availability Check

Before returning results, each video is checked via [noembed.com](https://noembed.com) (a CORS-friendly oEmbed proxy) to filter out deleted, private, or region-locked videos. No API key needed.

```
Video → noembed.com/embed?url=youtube.com/watch?v=ID
  ✓ Returns title/author → video is available
  ✗ Returns error field → video removed from results
  ⏱ Timeout (3s) → kept (don't block results)
```

#### Free-Text Search

When users search by keyword instead of mood, a simpler path is used:
- Single search query (no tag-based layer)
- No tag scoring — sorted by view count (popularity)
- Same duration filtering and availability checking

---

### YouTube API Integration

**No API key is required.** The app uses YouTube's internal `youtubei/v1` API — the same endpoint YouTube's own web client uses.

#### How It Works

```
User → React App → /api/search → YouTube Internal API → Response → Parsed Videos
```

The serverless function acts as a proxy:

```javascript
// Request to YouTube's internal search API
POST https://www.youtube.com/youtubei/v1/search

Body: {
  context: {
    client: {
      clientName: 'WEB',
      clientVersion: '2.20250227.00.00',
      hl: 'en',    // language
      gl: 'US',    // region
    }
  },
  query: 'acoustic live performance singing concert',
  params: 'EgIYAw%3D%3D',  // duration filter (protobuf-encoded)
}
```

#### Duration Filter Params (Base64-encoded protobuf)

| Duration | Param | Meaning |
|----------|-------|---------|
| Short (< 4 min) | `EgIYAQ%3D%3D` | YouTube "short" filter |
| Medium (4-20 min) | `EgIYAw%3D%3D` | YouTube "medium" filter |
| Long (> 20 min) | `EgIYAg%3D%3D` | YouTube "long" filter |

#### Response Parsing

YouTube's response is deeply nested. The proxy extracts video data from:

```
response
 └─ contents
     └─ twoColumnSearchResultsRenderer
         └─ primaryContents
             └─ sectionListRenderer
                 └─ contents[]
                     └─ itemSectionRenderer
                         └─ contents[]
                             └─ videoRenderer  ← extracted fields
```

**Extracted fields per video:**
- `id` — YouTube video ID
- `title` — video title
- `channel` — channel name
- `channelId` — channel ID (for channel browsing)
- `channelAvatar` — channel thumbnail URL
- `thumbnail` — video thumbnail URL
- `durationSeconds` — parsed from "MM:SS" or "H:MM:SS" text
- `viewCount` — parsed from "1,234,567 views" text
- `publishedAt` — relative time (e.g., "3 days ago")
- `url` — full YouTube watch URL

#### Three Parallel Implementations

The same proxy logic exists in three files for different environments:

| File | Environment | Format |
|------|------------|--------|
| [`vite.config.js`](vite.config.js) | Development (Vite dev server) | Express-style middleware |
| [`api/search.js`](api/search.js) | Vercel production | `handler(req, res)` |
| [`netlify/functions/search.js`](netlify/functions/search.js) | Netlify production | `(req) => Response` |

---

### Channel Browsing

Clicking a channel name anywhere in the app opens a full channel page with banner, avatar, subscriber count, and video grid.

#### How Channel Data Is Fetched

```
User clicks channel → /api/channel?channelId=UCxxxx → YouTube Browse API → Parsed Channel Data
```

```javascript
// Two parallel requests to YouTube's browse API
POST https://www.youtube.com/youtubei/v1/browse

// Request 1: Channel header (banner, avatar, name, subscriber count)
Body: { context: {...}, browseId: 'UCxxxx' }

// Request 2: Latest videos (Videos tab, sorted by newest)
Body: { context: {...}, browseId: 'UCxxxx', params: 'EgZ2aWRlb3PyBgQKAjoA' }
```

The `params: 'EgZ2aWRlb3PyBgQKAjoA'` is a protobuf-encoded parameter that tells YouTube to return the Videos tab sorted by "Latest" (newest first).

#### Channel Response Parsing

YouTube has two header formats that the parser handles:

```
Format 1 (Classic):  header.c4TabbedHeaderRenderer
Format 2 (Newer):    header.pageHeaderRenderer.content.pageHeaderViewModel
```

Videos also come in two formats:

```
Format 1 (Classic):  richItemRenderer.content.videoRenderer
Format 2 (Newer):    richItemRenderer.content.lockupViewModel
```

Both formats are parsed to ensure all videos are captured regardless of which format YouTube serves.

#### Inline Player

When a video is clicked on the channel page, it plays **inline** using the YouTube IFrame Player API (not in a separate modal). This prevents the issue of the video playing behind the channel overlay.

---

### Watch Rooms (Firebase)

Watch Rooms allow real-time collaborative video watching. One user (host) controls playback for all connected guests.

#### Architecture

```
                    Firebase Realtime Database
                    ┌─────────────────────┐
                    │  rooms/ABC123       │
     Host ─────────│    ├── host: id     │──────── Guest 1
     (controls)    │    ├── video: {...} │         (syncs)
                   │    ├── state:       │
     Guest 2 ─────│    │   ├── playing  │──────── Guest 3
     (syncs)      │    │   ├── time     │         (syncs)
                   │    │   └── updated  │
                   │    ├── participants │
                   │    └── reactions    │
                   └─────────────────────┘
```

#### Firebase Data Structure

```
rooms/{CODE}
  ├── host: "u1a2b3c4d"              # Host's user ID
  ├── video:                          # Currently playing video
  │     ├── id: "dQw4w9WgXcQ"
  │     ├── title: "Video Title"
  │     ├── channel: "Channel Name"
  │     ├── thumbnail: "https://..."
  │     ├── url: "https://youtube.com/..."
  │     └── durationSeconds: 600
  ├── state:                          # Playback state (synced)
  │     ├── playing: true/false
  │     ├── currentTime: 45.2         # Seconds
  │     ├── updatedAt: 1709654321000  # Timestamp
  │     └── updatedBy: "u1a2b3c4d"   # Who made the change
  ├── participants:                   # Connected users
  │     ├── u1a2b3c4d:
  │     │     ├── name: "Alice"
  │     │     ├── color: "#FF6B6B"
  │     │     └── joinedAt: timestamp
  │     └── u5e6f7g8h:
  │           ├── name: "Bob"
  │           ├── color: "#4ECDC4"
  │           └── joinedAt: timestamp
  ├── reactions:                      # Emoji reactions
  │     └── {pushId}:
  │           ├── emoji: "🔥"
  │           ├── userId: "u5e6f7g8h"
  │           ├── name: "Bob"
  │           └── timestamp: 1709654325000
  └── createdAt: 1709654300000
```

#### How Syncing Works

1. **Host creates room** → generates 6-character code (e.g., `ABC123`), writes room data to Firebase
2. **Guest joins** → enters code, subscribes to `rooms/{code}` via `onValue` listener
3. **Host plays/pauses/seeks** → updates `state.playing`, `state.currentTime`, `state.updatedAt` in Firebase
4. **Guest receives update** → Firebase listener fires, guest's player syncs to new state
5. **Host changes video** → updates `video` field, all guests load new video
6. **Reactions** → any user can send emoji reactions (pushed to `reactions/` node), displayed as floating animations
7. **Disconnect** → Firebase `onDisconnect()` automatically removes participant when they leave

#### Room Code Generation

```javascript
// Uses 30 unambiguous characters (no 0, O, 1, I to avoid confusion)
const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// Generates 6-character code → ~729 million combinations
```

#### Participant Colors

8 predefined colors are assigned randomly to participants:
`#FF6B6B`, `#4ECDC4`, `#45B7D1`, `#96CEB4`, `#FFEAA7`, `#DDA0DD`, `#98D8C8`, `#F7DC6F`

#### URL Sharing

Room codes can be shared via URL hash: `https://yoursite.com/#room=ABC123`. The app detects the hash on load and opens the join dialog automatically.

---

### Recommendation Engine

Located in [`src/services/recommendations.js`](src/services/recommendations.js), the recommendation engine uses locally-stored usage data (no external calls):

```
Usage Data (localStorage)
  ├── moods: { music: 15, comedy: 8, sports: 3 }     → getTopMoods()
  ├── searches: { "lofi beats": 5, "yoga": 3 }       → getSuggestedQueries()
  └── watches: [{ channel: "Veritasium", ... }, ...]  → getTopChannels()
```

- **Top Moods**: Sorted by usage count, displayed as quick-access buttons
- **Suggested Queries**: Past search terms sorted by frequency
- **Top Channels**: Aggregated from watch history, sorted by watch count

---

### Daily Picks Algorithm

Daily Picks shows 3 curated videos that remain the same all day and change at midnight UTC.

```javascript
// Deterministic seed from today's date
const seed = new Date().toISOString().slice(0, 10); // "2026-03-05"
// → Seeds a pseudo-random number generator
// → Selects 9 candidates from 200+ fallback videos
// → Checks availability via noembed.com
// → Returns first 3 available videos
```

This ensures:
- All users see the same picks on the same day
- Picks change every 24 hours automatically
- No API calls to YouTube (uses pre-curated fallback pool)

---

## Architecture Deep Dive

### Serverless API Layer

```
Development (Vite)                    Production
┌──────────────────┐                  ┌──────────────────┐
│  vite.config.js  │                  │  Netlify/Vercel  │
│  Custom Plugin   │                  │  Functions       │
│                  │                  │                  │
│  /api/search ────┼──┐              │  /api/search ────┼──┐
│  /api/channel ───┼──┤              │  /api/channel ───┼──┤
└──────────────────┘  │              └──────────────────┘  │
                      ▼                                    ▼
              YouTube Internal API              YouTube Internal API
              (youtubei/v1/search)              (youtubei/v1/search)
              (youtubei/v1/browse)              (youtubei/v1/browse)
```

The Vite plugin intercepts API requests during development and forwards them to YouTube, so no separate backend server is needed.

### Custom Hooks

| Hook | Storage | Purpose |
|------|---------|---------|
| `useYouTube` | Memory + localStorage | Orchestrates search, caching, fallback |
| `useWatchRoom` | Firebase | Room CRUD, real-time sync, reactions |
| `useFavorites` | `watch10-favorites` | Toggle favorites, track history (50 max) |
| `usePlaylists` | `watch10-playlists` | Create/edit/delete playlists |
| `useWatchQueue` | `watch10-queue` | FIFO queue with auto-advance |
| `useTheme` | `theme-preference` | Dark/light mode with system detection |
| `useI18n` | `watch10-locale` | Translation context (EN, HI, ES, FR) |
| `useUsageTracker` | `watch10-usage` | Track moods, searches, watches |
| `useSearchCache` | Memory (5 min TTL) | Prevent duplicate API calls |
| `useKeyboardShortcuts` | — | Global keyboard event handling |
| `useFocusTrap` | — | Modal focus containment (accessibility) |
| `useSwipe` | — | Touch gesture detection (mobile) |
| `useShareList` | URL hash | Share results via encoded URL |
| `useLocalStorage` | Any key | Generic persistent state hook |
| `useStats` | — | Compute stats from usage data |

### State Management

The app uses **React's built-in state** (no Redux, Zustand, etc.). State is managed at three levels:

```
App.jsx (root state)
  ├── selectedMood, maxMinutes     → Search parameters
  ├── videos, loading, error       → Search results
  ├── activeVideo                  → Currently playing video
  ├── channelView                  → Active channel page
  ├── showFavorites, showStats     → Panel visibility
  └── Custom hooks                 → Encapsulated domain state
      ├── useFavorites()           → favorites[], history[]
      ├── usePlaylists()           → playlists[]
      ├── useWatchQueue()          → queue[]
      ├── useWatchRoom()           → roomId, roomData, participants
      └── useUsageTracker()        → usage data
```

**Persistence**: All user data is stored in `localStorage` with `watch10-` prefixed keys. No server-side storage (except Firebase for Watch Rooms).

### Theming System

The app uses CSS custom properties for theming, toggled via `data-theme` attribute:

```css
/* Light mode (default) */
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #1e293b;
  --color-accent: #6366f1;
  /* ... */
}

/* Dark mode */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-accent: #818cf8;
  /* ... */
}
```

Theme detection priority:
1. User's manual choice (stored in `localStorage`)
2. System preference (`prefers-color-scheme: dark`)
3. Default: light mode

### Internationalization (i18n)

Custom context-based system supporting 4 languages:

```javascript
// Usage in components
const { t, locale, setLocale } = useI18n();

t('search.placeholder')              // → "Search for videos..."
t('playlist.videos', { count: 5 })   // → "5 videos" (with parameter substitution)
```

**Translation coverage**: Header, search, moods, time picker, results, sorting, errors, player, favorites, playlists, queue, sharing, trending, stats, watch rooms, channel browsing, onboarding, footer, offline banner.

**Language detection**: Auto-detects from `navigator.language`, falls back to English.

---

## Deployment

### Netlify (Recommended)

The project includes a [`netlify.toml`](netlify.toml) with all necessary configuration:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/api/search"
  to = "/.netlify/functions/search"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

1. Connect your GitHub repo to Netlify
2. Set environment variables in Netlify dashboard (see below)
3. Deploy — Netlify auto-builds on push

### Vercel

The `api/` directory contains Vercel-compatible serverless functions. No additional configuration needed — Vercel auto-detects them.

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

---

## Environment Variables

Create a `.env` file in the `watch-in-10/` directory:

```env
# Firebase (required only for Watch Rooms)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

> **Note**: The YouTube search/channel features work without any environment variables. Firebase is only needed for the Watch Room (collaborative watching) feature.

For production deployments, set these same variables in your Netlify or Vercel dashboard.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Ctrl/Cmd + L` | Toggle dark/light mode |
| `Ctrl/Cmd + F` | Open favorites panel |
| `Escape` | Close modals, players, channel page |

---

## localStorage Keys

| Key | Purpose | Type |
|-----|---------|------|
| `watch10-favorites` | Saved videos | `Array<Video>` |
| `watch10-history` | Watch history (last 50) | `Array<Video>` |
| `watch10-playlists` | Custom playlists | `Array<Playlist>` |
| `watch10-queue` | Watch queue | `Array<Video>` |
| `watch10-usage` | Mood/search/watch tracking | `Object` |
| `watch10-locale` | Language preference | `string` |
| `watch10-user-id` | Unique user ID (Watch Rooms) | `string` |
| `watch10-user-name` | Display name (Watch Rooms) | `string` |
| `watch10-last-results` | Cached results (offline) | `Array<Video>` |
| `watch10-trending` | Cached trending + timestamp | `Object` |
| `theme-preference` | Theme override | `"light" \| "dark"` |

---

## Performance

- **Search caching**: 5-minute in-memory cache per unique search
- **API caching**: 10-minute server-side cache via `Cache-Control` headers
- **Lazy loading**: Infinite scroll with `IntersectionObserver`
- **Image optimization**: YouTube's optimized thumbnail CDN
- **Minimal dependencies**: Only 3 production deps (React, ReactDOM, Firebase)
- **Service Worker**: PWA caching for offline support
- **Code splitting**: Vite's automatic chunk optimization

---

## License

MIT
