import { useState, useCallback, useRef, useEffect, useMemo, lazy, Suspense } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import MoodSelector from './components/MoodSelector';
import TimePicker from './components/TimePicker';
import VideoGrid from './components/VideoGrid';
import SkeletonGrid from './components/SkeletonGrid';
import Footer from './components/Footer';
import Onboarding from './components/Onboarding';
import SortFilter from './components/SortFilter';
import CategoryTabs from './components/CategoryTabs';
import AdvancedFilters from './components/AdvancedFilters';
import MiniPlayer from './components/MiniPlayer';
import OfflineBanner from './components/OfflineBanner';

// Lazy-loaded components (conditionally rendered modals / full-screen views)
const VideoPlayerModal = lazy(() => import('./components/VideoPlayerModal'));
const FavoritesPanel = lazy(() => import('./components/FavoritesPanel'));
const DailyPicks = lazy(() => import('./components/DailyPicks'));
const TrendingSection = lazy(() => import('./components/TrendingSection'));
const WatchQueue = lazy(() => import('./components/WatchQueue'));
const StatsPage = lazy(() => import('./components/StatsPage'));
const WatchRoom = lazy(() => import('./components/WatchRoom'));
const WatchRoomLobby = lazy(() => import('./components/WatchRoomLobby'));
const ChannelPage = lazy(() => import('./components/ChannelPage'));
import { useYouTube } from './hooks/useYouTube';
import { useTheme } from './hooks/useTheme';
import { useFavorites } from './hooks/useFavorites';
import { usePlaylists } from './hooks/usePlaylists';
import { useWatchQueue } from './hooks/useWatchQueue';
import { useUsageTracker } from './hooks/useUsageTracker';
import { useShareList } from './hooks/useShareList';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWatchRoom } from './hooks/useWatchRoom';
import { useI18n } from './hooks/useI18n';
import { useCloudSync } from './hooks/useCloudSync';
import { copyVideoLink, shareNative } from './utils/share';
import { getTopMoods, getSuggestedQueries } from './services/recommendations';
import { moods, durations } from './data/moods';
import './App.css';

const DEFAULT_SEARCH_TIME = 10;
const VIDEOS_PER_PAGE = 9;

/**
 * Parse YouTube relative time strings like "2 hours ago", "3 days ago",
 * "1 week ago", "2 months ago" into approximate milliseconds-ago values.
 */
function parseRelativeTime(text) {
  if (!text) return Infinity;
  const lower = text.toLowerCase();
  const num = parseInt(lower, 10) || 1;
  if (lower.includes('second')) return num * 1000;
  if (lower.includes('minute')) return num * 60000;
  if (lower.includes('hour')) return num * 3600000;
  if (lower.includes('day')) return num * 86400000;
  if (lower.includes('week')) return num * 604800000;
  if (lower.includes('month')) return num * 2592000000;
  if (lower.includes('year')) return num * 31536000000;
  return Infinity; // unknown format — don't filter out
}

export default function App() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { favorites, history, toggleFavorite, isFavorite, addToHistory, clearHistory } = useFavorites();
  const { playlists, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, renamePlaylist } = usePlaylists();
  const { queue, addToQueue, removeFromQueue, clearQueue, nextInQueue } = useWatchQueue();
  const { usage, trackMood, trackSearch, trackWatch } = useUsageTracker();
  const { share } = useShareList();
  const room = useWatchRoom();
  useCloudSync();
  const [roomMode, setRoomMode] = useState(null); // null | 'lobby' | 'room'
  const [initialRoomCode, setInitialRoomCode] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [miniPlayerVideo, setMiniPlayerVideo] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState('forYou');
  const [sortBy, setSortBy] = useState('relevance');
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PER_PAGE);
  const [shareMsg, setShareMsg] = useState('');
  const [filters, setFilters] = useState({ uploadDate: 'any', hd: false });
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [channelView, setChannelView] = useState(null); // { channelId, channelName } or null
  const { videos, loading, error, usingFallback, search, searchQuery, reset } = useYouTube();
  const resultsRef = useRef(null);
  const searchBarRef = useRef(null);

  // Personalized recommendations from usage data
  const recommendedMoods = useMemo(() => getTopMoods(usage, 3), [usage]);
  const suggestedQueries = useMemo(() => getSuggestedQueries(usage, 5), [usage]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onFocusSearch: () => searchBarRef.current?.focus(),
    onToggleTheme: toggleTheme,
    onOpenFavorites: () => setShowFavorites(true),
  });

  // Auto-scroll to results area when loading starts or results arrive
  useEffect(() => {
    if ((loading || videos.length > 0) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, videos]);

  // Reset visible count when new results load
  useEffect(() => {
    setVisibleCount(VIDEOS_PER_PAGE);
    setSortBy('relevance');
  }, [videos]);

  // Sort and filter videos
  const sortedVideos = useMemo(() => {
    let result = [...videos];

    // Filter dismissed
    if (dismissedIds.size > 0) {
      result = result.filter((v) => !dismissedIds.has(v.id));
    }

    // Apply upload date filter by parsing relative time strings
    if (filters.uploadDate !== 'any') {
      const cutoffs = { today: 86400000, week: 604800000, month: 2592000000 };
      const cutoff = cutoffs[filters.uploadDate];
      if (cutoff) {
        result = result.filter((v) => {
          const ago = parseRelativeTime(v.publishedAt);
          return ago <= cutoff;
        });
      }
    }

    if (sortBy === 'relevance') return result;
    switch (sortBy) {
      case 'views':
        return result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      case 'shortest':
        return result.sort((a, b) => (a.durationSeconds || 0) - (b.durationSeconds || 0));
      case 'longest':
        return result.sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0));
      default:
        return result;
    }
  }, [videos, sortBy, dismissedIds, filters]);

  const displayedVideos = sortedVideos.slice(0, visibleCount);
  const hasMore = visibleCount < sortedVideos.length;

  // Related videos (other videos from current results, excluding active)
  const relatedVideos = useMemo(() => {
    if (!activeVideo || videos.length < 2) return [];
    return videos.filter((v) => v.id !== activeVideo.id).slice(0, 4);
  }, [activeVideo, videos]);

  const handleMoodSelect = useCallback(
    (mood) => {
      setSelectedMood(mood);
      setSelectedTime(null);
      setSearchTerm('');
      setActiveTab('forYou');
      reset();
      trackMood(mood.id);
    },
    [reset, trackMood]
  );

  const handleTimeSelect = useCallback(
    (mins) => {
      setSelectedTime(mins);
      if (searchTerm) {
        searchQuery(searchTerm, mins);
      } else if (selectedMood) {
        search(selectedMood, mins);
      }
    },
    [selectedMood, searchTerm, search, searchQuery]
  );

  const handleRefresh = useCallback(() => {
    if (searchTerm && selectedTime) {
      searchQuery(searchTerm, selectedTime);
    } else if (selectedMood && selectedTime) {
      search(selectedMood, selectedTime);
    }
  }, [selectedMood, selectedTime, searchTerm, search, searchQuery]);

  const handleReset = useCallback(() => {
    setSelectedMood(null);
    setSelectedTime(null);
    setSearchTerm('');
    setDismissedIds(new Set());
    reset();
  }, [reset]);

  const handleSurpriseMe = useCallback(() => {
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const randomTime = durations[Math.floor(Math.random() * durations.length)];
    setSelectedMood(randomMood);
    setSelectedTime(randomTime);
    setSearchTerm('');
    setActiveTab('forYou');
    search(randomMood, randomTime);
    trackMood(randomMood.id);
  }, [search, trackMood]);

  const handleSearch = useCallback((query) => {
    setSearchTerm(query);
    setSelectedMood(null);
    setSelectedTime(DEFAULT_SEARCH_TIME);
    setActiveTab('forYou');
    searchQuery(query, DEFAULT_SEARCH_TIME);
    trackSearch(query);
  }, [searchQuery, trackSearch]);

  const handleChannelClick = useCallback((channelName, channelId) => {
    if (channelId) {
      setChannelView({ channelId, channelName });
    } else {
      handleSearch(channelName);
    }
  }, [handleSearch]);

  const handlePlayVideo = useCallback((video) => {
    addToHistory(video);
    trackWatch(video, selectedMood?.id);
    setActiveVideo(video);
    setMiniPlayerVideo(null);
  }, [addToHistory, trackWatch, selectedMood]);

  const handleClosePlayer = useCallback(() => {
    setActiveVideo(null);
  }, []);

  const handleMinimizePlayer = useCallback(() => {
    setMiniPlayerVideo(activeVideo);
    setActiveVideo(null);
  }, [activeVideo]);

  const handleExpandMini = useCallback(() => {
    setActiveVideo(miniPlayerVideo);
    setMiniPlayerVideo(null);
  }, [miniPlayerVideo]);

  const handleCloseMini = useCallback(() => {
    setMiniPlayerVideo(null);
  }, []);

  const handleVideoEnd = useCallback(() => {
    const next = nextInQueue();
    if (next) {
      addToHistory(next);
      trackWatch(next, selectedMood?.id);
      setActiveVideo(next);
      setMiniPlayerVideo(null);
    }
  }, [nextInQueue, addToHistory, trackWatch, selectedMood]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + VIDEOS_PER_PAGE);
  }, []);

  const handleShare = useCallback(async () => {
    const ok = await share(displayedVideos, selectedMood, selectedTime, searchTerm);
    if (ok) {
      setShareMsg(t('results.linkCopied'));
      setTimeout(() => setShareMsg(''), 2000);
    }
  }, [share, displayedVideos, selectedMood, selectedTime, searchTerm, t]);

  const handleShareVideo = useCallback(async (video) => {
    const shared = await shareNative(video);
    if (!shared) await copyVideoLink(video);
  }, []);

  const handlePlayRelated = useCallback((video) => {
    addToHistory(video);
    trackWatch(video, selectedMood?.id);
    setActiveVideo(video);
  }, [addToHistory, trackWatch, selectedMood]);

  const handleDismiss = useCallback((videoId) => {
    setDismissedIds((prev) => new Set(prev).add(videoId));
  }, []);

  // Watch Room: check URL hash or stored session for auto-rejoin on mount
  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/#room=([A-Z0-9]+)/i);
    const storedCode = localStorage.getItem('watch10-room-code');

    if (match) {
      const code = match[1].toUpperCase();
      // If we have stored credentials for this room, auto-rejoin directly
      if (storedCode === code) {
        room.rejoinRoom(code).then((ok) => {
          if (!ok) {
            // Room no longer exists, show lobby
            setInitialRoomCode(code);
            setRoomMode('lobby');
          }
        });
      } else {
        setInitialRoomCode(code);
        setRoomMode('lobby');
      }
    } else if (storedCode) {
      // No hash but we have a stored room — try to rejoin
      room.rejoinRoom(storedCode).then((ok) => {
        if (!ok) {
          localStorage.removeItem('watch10-room-code');
          localStorage.removeItem('watch10-room-host');
        }
      });
    }
  }, []);

  // Watch Room: sync URL hash with room state
  useEffect(() => {
    if (room.roomId) {
      setRoomMode('room');
      window.location.hash = `room=${room.roomId}`;
    } else if (roomMode === 'room') {
      setRoomMode(null);
      history.replaceState(null, '', window.location.pathname);
    }
  }, [room.roomId]);

  const handleCreateRoom = useCallback(async (video, userName) => {
    const code = await room.createRoom(video, userName);
    if (code) setRoomMode('room');
  }, [room]);

  const handleJoinRoom = useCallback(async (code, userName) => {
    const ok = await room.joinRoom(code, userName);
    if (ok) setRoomMode('room');
    return ok;
  }, [room]);

  const handleLeaveRoom = useCallback(async () => {
    await room.leaveRoom();
    setRoomMode(null);
    history.replaceState(null, '', window.location.pathname);
  }, [room]);

  const handleWatchTogether = useCallback(async (video) => {
    const userName = localStorage.getItem('watch10-user-name') || 'Host';
    const code = await room.createRoom(video, userName);
    if (code) {
      setActiveVideo(null);
      setMiniPlayerVideo(null);
      setRoomMode('room');
    }
  }, [room]);

  const showResults = videos.length > 0 && !loading;
  const showTimePicker = selectedMood || searchTerm;
  const showDailyPicks = !selectedMood && !searchTerm && videos.length === 0 && !loading;
  const hasRecommendations = recommendedMoods.length > 0 || suggestedQueries.length > 0;

  return (
    <div className="app">
      <Onboarding />
      <OfflineBanner />

      <Header
        onSurpriseMe={handleSurpriseMe}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenFavorites={() => setShowFavorites(true)}
        onOpenQueue={() => setShowQueue(true)}
        onOpenStats={() => setShowStats(true)}
        onOpenRoom={() => setRoomMode('lobby')}
        queueCount={queue.length}
      />

      <Suspense fallback={null}>
      <main className="app__main" id="main-content">
        {showStats ? (
          <StatsPage usage={usage} onClose={() => setShowStats(false)} />
        ) : (
          <>
            <SearchBar ref={searchBarRef} onSearch={handleSearch} value={searchTerm} />
            <div className="app__divider">{t('divider.orPickMood')}</div>
            <MoodSelector selected={selectedMood} onSelect={handleMoodSelect} />

            <CategoryTabs active={activeTab} onChange={setActiveTab} />

            {activeTab === 'forYou' && (
              <>
                {showDailyPicks && hasRecommendations && (
                  <section className="app__recommendations">
                    {recommendedMoods.length > 0 && (
                      <div className="app__rec-row">
                        <span className="app__rec-label">{t('tabs.forYou')}:</span>
                        {recommendedMoods.map((mood) => (
                          <button
                            key={mood.id}
                            className="app__rec-chip"
                            onClick={() => { handleMoodSelect(mood); handleTimeSelect(10); }}
                          >
                            {mood.icon} {mood.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {suggestedQueries.length > 0 && (
                      <div className="app__rec-row">
                        <span className="app__rec-label">{t('search.button')}:</span>
                        {suggestedQueries.map((q) => (
                          <button
                            key={q}
                            className="app__rec-chip app__rec-chip--search"
                            onClick={() => handleSearch(q)}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {showDailyPicks && (
                  <DailyPicks
                    onPlay={handlePlayVideo}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                    onChannelClick={handleChannelClick}
                  />
                )}

                {showDailyPicks && (
                  <TrendingSection
                    onPlay={handlePlayVideo}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                    onChannelClick={handleChannelClick}
                  />
                )}

                {showTimePicker && (
                  <TimePicker selected={selectedTime} onSelect={handleTimeSelect} />
                )}

                <div ref={resultsRef} className="app__scroll-anchor" />

                {loading && <SkeletonGrid />}

                {error && (
                  <div className="app__error">
                    <p>{error}</p>
                  </div>
                )}

                {showResults && (
                  <>
                    <div className="app__context">
                      {searchTerm ? (
                        <>{t('results.showingFor')} &ldquo;<strong>{searchTerm}</strong>&rdquo;{selectedTime !== 'any' && <> {t('results.around')} <strong>{selectedTime} min</strong></>}</>
                      ) : (
                        <>{selectedMood?.icon} {t('results.showing')} <strong>{selectedMood?.label}</strong> {t('results.videos')}{selectedTime !== 'any' ? <> {t('results.around')} <strong>{selectedTime} min</strong></> : <> — <strong>{t('results.anyDuration')}</strong></>}</>
                      )}
                      <span className="app__context-count">{t('results.count', { count: sortedVideos.length })}</span>
                    </div>

                    <SortFilter sortBy={sortBy} onSortChange={setSortBy} />
                    <AdvancedFilters filters={filters} onChange={setFilters} />

                    <VideoGrid
                      videos={displayedVideos}
                      usingFallback={usingFallback}
                      onPlay={handlePlayVideo}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={isFavorite}
                      onLoadMore={handleLoadMore}
                      hasMore={hasMore}
                      playlists={playlists}
                      onAddToPlaylist={addToPlaylist}
                      onAddToQueue={addToQueue}
                      onShare={handleShareVideo}
                      onDismiss={handleDismiss}
                      onChannelClick={handleChannelClick}
                    />

                    <div className="app__actions">
                      <button className="app__refresh-btn" onClick={handleRefresh}>
                        {t('results.refresh')}
                      </button>
                      <button className="app__share-btn" onClick={handleShare}>
                        {shareMsg || t('results.share')}
                      </button>
                      <button className="app__reset-btn" onClick={handleReset}>
                        {t('results.tryAnother')}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {activeTab === 'trending' && (
              <TrendingSection
                onPlay={handlePlayVideo}
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite}
                onChannelClick={handleChannelClick}
              />
            )}

            {activeTab === 'favorites' && (
              <div className="app__tab-content">
                {favorites.length === 0 ? (
                  <p className="app__tab-empty">{t('fav.noFavorites')}</p>
                ) : (
                  <VideoGrid
                    videos={favorites}
                    onPlay={handlePlayVideo}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite}
                    onChannelClick={handleChannelClick}
                  />
                )}
              </div>
            )}

            {activeTab === 'playlists' && (
              <div className="app__tab-content">
                {playlists.length === 0 ? (
                  <p className="app__tab-empty">{t('playlist.empty')}</p>
                ) : (
                  <div className="app__playlist-grid">
                    {playlists.map((pl) => (
                      <button
                        key={pl.id}
                        className="app__playlist-card"
                        onClick={() => { setShowFavorites(true); }}
                      >
                        <span className="app__playlist-card-name">{pl.name}</span>
                        <span className="app__playlist-card-count">{t('playlist.videos', { count: pl.videos.length })}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={handleClosePlayer}
          onMinimize={handleMinimizePlayer}
          relatedVideos={relatedVideos}
          onPlayRelated={handlePlayRelated}
          onVideoEnd={handleVideoEnd}
          onWatchTogether={handleWatchTogether}
          onChannelClick={handleChannelClick}
        />
      )}

      {miniPlayerVideo && !activeVideo && (
        <MiniPlayer
          video={miniPlayerVideo}
          onExpand={handleExpandMini}
          onClose={handleCloseMini}
          onVideoEnd={handleVideoEnd}
        />
      )}

      {showFavorites && (
        <FavoritesPanel
          favorites={favorites}
          history={history}
          onClose={() => setShowFavorites(false)}
          onPlay={handlePlayVideo}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
          onClearHistory={clearHistory}
          playlists={playlists}
          onCreatePlaylist={createPlaylist}
          onDeletePlaylist={deletePlaylist}
          onRenamePlaylist={renamePlaylist}
          onRemoveFromPlaylist={removeFromPlaylist}
          onChannelClick={handleChannelClick}
        />
      )}

      {showQueue && (
        <WatchQueue
          queue={queue}
          onPlay={(video) => { handlePlayVideo(video); setShowQueue(false); }}
          onRemove={removeFromQueue}
          onClear={clearQueue}
          onClose={() => setShowQueue(false)}
        />
      )}

      {roomMode === 'lobby' && (
        <WatchRoomLobby
          isConfigured={room.configured}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onClose={() => { setRoomMode(null); setInitialRoomCode(''); history.replaceState(null, '', window.location.pathname); }}
          error={room.error}
          initialRoomCode={initialRoomCode}
        />
      )}

      {roomMode === 'room' && room.roomId && (
        <WatchRoom
          roomId={room.roomId}
          roomData={room.roomData}
          isHost={room.isHost}
          participants={room.participants}
          reactions={room.reactions}
          messages={room.messages}
          userId={room.userId}
          onSyncPlayback={room.syncPlayback}
          onSendReaction={room.sendReaction}
          onSendMessage={room.sendMessage}
          onSetVideo={room.setVideo}
          onLeave={handleLeaveRoom}
          onToggleSharedControl={room.toggleSharedControl}
          onSetMeetLink={room.setMeetLink}
          onClearMeetLink={room.clearMeetLink}
        />
      )}

      {channelView && (
        <ChannelPage
          channelId={channelView.channelId}
          channelName={channelView.channelName}
          onClose={() => setChannelView(null)}
          onPlay={(video) => { addToHistory(video); trackWatch(video, selectedMood?.id); }}
        />
      )}
      </Suspense>
    </div>
  );
}
