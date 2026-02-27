# What Should I Watch in 10 Minutes? — Project Spec

## Overview
A curated short content discovery website that helps users find short-form video content (short films, YouTube documentaries, mini-episodes, TED talks) based on their mood and available time.

## Tech Stack
- **Frontend**: React 19 + Vite
- **Styling**: Plain CSS with CSS variables
- **API**: YouTube Data API v3
- **Font**: Inter (Google Fonts)

## Current Features (v1.0)
- [x] Mood selection (6 moods: Inspired, Curious, Relaxed, Adventurous, Thoughtful, Laugh)
- [x] Time picker (5, 10, 15, 20, 30 minutes)
- [x] YouTube API integration with mood-based search queries
- [x] Video results grid with thumbnails, titles, durations, and direct YouTube links
- [x] Fallback sample data when no API key is configured
- [x] Responsive design (mobile-first)
- [x] Clean/minimal design aesthetic

## Setup
1. Install Node.js (v18+)
2. Run `npm install` in the `watch-in-10/` directory
3. Copy `.env.example` to `.env` and add your YouTube API key
4. Run `npm run dev`

## API Key
- Get a YouTube Data API v3 key from https://console.cloud.google.com/
- Enable "YouTube Data API v3" in your Google Cloud project
- Add the key to `.env` as `VITE_YOUTUBE_API_KEY`

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

### YouTube API Strategy
- **Search API** finds videos matching mood keywords
- **Videos API** fetches exact durations for filtering
- Mood-to-query mapping lives in `src/data/moods.js`
- Duration filtering happens client-side after fetching

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
