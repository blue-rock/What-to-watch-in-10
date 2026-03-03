import { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import MoodSelector from './components/MoodSelector';
import TimePicker from './components/TimePicker';
import VideoGrid from './components/VideoGrid';
import SkeletonGrid from './components/SkeletonGrid';
import Footer from './components/Footer';
import VideoPlayerModal from './components/VideoPlayerModal';
import FavoritesPanel from './components/FavoritesPanel';
import { useYouTube } from './hooks/useYouTube';
import { useTheme } from './hooks/useTheme';
import { useFavorites } from './hooks/useFavorites';
import { moods, durations } from './data/moods';
import './App.css';

const DEFAULT_SEARCH_TIME = 10;

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { favorites, history, toggleFavorite, isFavorite, addToHistory, clearHistory } = useFavorites();
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeVideo, setActiveVideo] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const { videos, loading, error, usingFallback, search, searchQuery, reset } = useYouTube();
  const resultsRef = useRef(null);

  // Auto-scroll to results area when loading starts or results arrive
  useEffect(() => {
    if ((loading || videos.length > 0) && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, videos]);

  const handleMoodSelect = useCallback(
    (mood) => {
      setSelectedMood(mood);
      setSelectedTime(null);
      setSearchTerm('');
      reset();
    },
    [reset]
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
    reset();
  }, [reset]);

  const handleSurpriseMe = useCallback(() => {
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const randomTime = durations[Math.floor(Math.random() * durations.length)];
    setSelectedMood(randomMood);
    setSelectedTime(randomTime);
    setSearchTerm('');
    search(randomMood, randomTime);
  }, [search]);

  const handleSearch = useCallback((query) => {
    setSearchTerm(query);
    setSelectedMood(null);
    setSelectedTime(DEFAULT_SEARCH_TIME);
    searchQuery(query, DEFAULT_SEARCH_TIME);
  }, [searchQuery]);

  const handlePlayVideo = useCallback((video) => {
    addToHistory(video);
    setActiveVideo(video);
  }, [addToHistory]);

  const handleClosePlayer = useCallback(() => {
    setActiveVideo(null);
  }, []);

  const showResults = videos.length > 0 && !loading;
  const showTimePicker = selectedMood || searchTerm;

  return (
    <div className="app">
      <Header
        onSurpriseMe={handleSurpriseMe}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenFavorites={() => setShowFavorites(true)}
      />

      <main className="app__main">
        <SearchBar onSearch={handleSearch} value={searchTerm} />
        <div className="app__divider">or pick a mood</div>
        <MoodSelector selected={selectedMood} onSelect={handleMoodSelect} />

        {showTimePicker && (
          <TimePicker selected={selectedTime} onSelect={handleTimeSelect} />
        )}

        {/* Scroll anchor — sits just above the results/skeleton area */}
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
                <>Showing results for "<strong>{searchTerm}</strong>" around <strong>{selectedTime} min</strong></>
              ) : (
                <>{selectedMood?.icon} Showing <strong>{selectedMood?.label}</strong> videos around <strong>{selectedTime} min</strong></>
              )}
              <span className="app__context-count">{videos.length} results</span>
            </div>
            <VideoGrid
              videos={videos}
              usingFallback={usingFallback}
              onPlay={handlePlayVideo}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
            <div className="app__actions">
              <button className="app__refresh-btn" onClick={handleRefresh}>
                Refresh results
              </button>
              <button className="app__reset-btn" onClick={handleReset}>
                Try another genre
              </button>
            </div>
          </>
        )}
      </main>

      <Footer />

      {activeVideo && (
        <VideoPlayerModal video={activeVideo} onClose={handleClosePlayer} />
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
        />
      )}
    </div>
  );
}
