# What Should I Watch in 10 Minutes? — Project Spec

## Overview
A curated short content discovery website that helps users find short-form video content (short films, YouTube documentaries, mini-episodes, TED talks) based on their mood and available time.

## Tech Stack
- **Frontend**: React 19 + Vite
- **Styling**: Plain CSS with CSS variables
- **API**: YouTube internal API via serverless proxy (no key needed)
- **Font**: Inter (Google Fonts)

## Current Features (v1.0)
- [x] Mood selection (6 moods: Inspired, Curious, Relaxed, Adventurous, Thoughtful, Laugh)
- [x] Time picker (5, 10, 15, 20, 30 minutes)
- [x] YouTube API integration with mood-based search queries
- [x] Video results grid with thumbnails, titles, durations, and direct YouTube links
- [x] No API key required — uses YouTube's internal API via a lightweight server proxy
- [x] Fallback sample data when network is unavailable
- [x] Responsive design (mobile-first)
- [x] Clean/minimal design aesthetic

## Setup
1. Install Node.js (v18+)
2. Run `npm install` in the `watch-in-10/` directory
3. Run `npm run dev`

No API key or environment variables required.

---

## Future Tasks

<!-- Add your tasks below. Mark with [x] when complete. -->

### Enhancements
- [ ] Add "Surprise Me" button that picks a random mood + time
- [ ] Save favorite videos to local storage
- [ ] Watch history tracking
- [ ] Share a curated list via URL
- [ ] Dark mode toggle
- [ ] Add more mood categories (Nostalgic, Focused, Romantic, etc.)

### Content
- [ ] Integrate additional content sources (Vimeo, Dailymotion)
- [ ] Add content category filters (Short Film, TED Talk, Documentary, etc.)
- [ ] Allow users to submit/suggest content

### Technical
- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Set up CI/CD pipeline
- [ ] Add PWA support for offline use
- [ ] Implement caching for API responses
- [ ] Add analytics tracking
- [ ] Deploy to Vercel/Netlify

### UX
- [ ] Onboarding tutorial for first-time users
- [ ] Skeleton loading states
- [ ] Keyboard navigation support
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Architecture Notes

### Video Search Strategy
- **YouTube internal API** (`/youtubei/v1/search`) — same endpoint YouTube.com uses, no API key
- Server proxy at `/api/search` handles the POST request (Vite plugin in dev, serverless function in prod)
- Falls back to curated sample data (`src/data/fallback.js`) on network failure
- Mood-to-query mapping lives in `src/data/moods.js`
- 4-layer recommendation: tag search → keyword search → negative filtering → score + rank
- Deployable to Vercel/Netlify with zero configuration (serverless function in `api/search.js`)

### Component Hierarchy
```
App
├── Header
├── MoodSelector (mood grid)
├── TimePicker (duration pills)
├── VideoGrid
│   └── VideoCard (×N)
├── LoadingSpinner
└── Footer
```
