import { useState, useCallback } from 'react';
import Header from './components/Header';
import MoodSelector from './components/MoodSelector';
import TimePicker from './components/TimePicker';
import VideoGrid from './components/VideoGrid';
import LoadingSpinner from './components/LoadingSpinner';
import Footer from './components/Footer';
import { useYouTube } from './hooks/useYouTube';
import './App.css';

export default function App() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const { videos, loading, error, usingFallback, search, reset } = useYouTube();

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
        // Always fires a fresh search — even if same time is re-clicked
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

  const showResults = videos.length > 0 && !loading;

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        <MoodSelector selected={selectedMood} onSelect={handleMoodSelect} />

        {selectedMood && (
          <TimePicker selected={selectedTime} onSelect={handleTimeSelect} />
        )}

        {loading && <LoadingSpinner />}

        {error && (
          <div className="app__error">
            <p>{error}</p>
          </div>
        )}

        {showResults && (
          <>
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
