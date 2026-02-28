import { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import MoodSelector from './components/MoodSelector';
import TimePicker from './components/TimePicker';
import VideoGrid from './components/VideoGrid';
import SkeletonGrid from './components/SkeletonGrid';
import Footer from './components/Footer';
import { useYouTube } from './hooks/useYouTube';
import { moods, durations } from './data/moods';
import './App.css';

export default function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const { videos, loading, error, usingFallback, search, reset } = useYouTube();
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
      reset();
    },
    [reset]
  );

  const handleTimeSelect = useCallback(
    (mins) => {
      setSelectedTime(mins);
      if (selectedMood) {
        search(selectedMood, mins);
      }
    },
    [selectedMood, search]
  );

  const handleRefresh = useCallback(() => {
    if (selectedMood && selectedTime) {
      search(selectedMood, selectedTime);
    }
  }, [selectedMood, selectedTime, search]);

  const handleReset = useCallback(() => {
    setSelectedMood(null);
    setSelectedTime(null);
    reset();
  }, [reset]);

  const handleSurpriseMe = useCallback(() => {
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    const randomTime = durations[Math.floor(Math.random() * durations.length)];
    setSelectedMood(randomMood);
    setSelectedTime(randomTime);
    search(randomMood, randomTime);
  }, [search]);

  const showResults = videos.length > 0 && !loading;

  return (
    <div className="app">
      <Header onSurpriseMe={handleSurpriseMe} />

      <main className="app__main">
        <MoodSelector selected={selectedMood} onSelect={handleMoodSelect} />

        {selectedMood && (
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
              {selectedMood?.icon} Showing <strong>{selectedMood?.label}</strong> videos around <strong>{selectedTime} min</strong>
              <span className="app__context-count">{videos.length} results</span>
            </div>
            <VideoGrid videos={videos} usingFallback={usingFallback} />
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
    </div>
  );
}
