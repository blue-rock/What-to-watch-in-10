import { useState, useEffect } from 'react';
import VideoCard from './VideoCard';
import './FavoritesPanel.css';

export default function FavoritesPanel({
  favorites,
  history,
  onClose,
  onPlay,
  onToggleFavorite,
  isFavorite,
  onClearHistory,
}) {
  const [tab, setTab] = useState('favorites');
  const items = tab === 'favorites' ? favorites : history;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      <div className="favorites-panel__backdrop" onClick={onClose} />
      <div className="favorites-panel" role="dialog" aria-modal="true" aria-label="Favorites and History">
        <div className="favorites-panel__header">
          <div className="favorites-panel__tabs" role="tablist">
            <button
              className={`favorites-panel__tab ${tab === 'favorites' ? 'favorites-panel__tab--active' : ''}`}
              onClick={() => setTab('favorites')}
              role="tab"
              aria-selected={tab === 'favorites'}
            >
              Favorites ({favorites.length})
            </button>
            <button
              className={`favorites-panel__tab ${tab === 'history' ? 'favorites-panel__tab--active' : ''}`}
              onClick={() => setTab('history')}
              role="tab"
              aria-selected={tab === 'history'}
            >
              History ({history.length})
            </button>
          </div>
          <button className="favorites-panel__close" onClick={onClose} aria-label="Close panel">
            &times;
          </button>
        </div>

        <div className="favorites-panel__body">
          {items.length === 0 ? (
            <p className="favorites-panel__empty">
              {tab === 'favorites'
                ? 'No favorites yet. Tap the heart on any video to save it.'
                : 'No watch history yet.'}
            </p>
          ) : (
            <>
              {tab === 'history' && (
                <button className="favorites-panel__clear" onClick={onClearHistory}>
                  Clear History
                </button>
              )}
              <div className="favorites-panel__grid">
                {items.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={onPlay}
                    onToggleFavorite={onToggleFavorite}
                    isFavorited={isFavorite(video.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
