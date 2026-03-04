import { useState, useEffect, useRef } from 'react';
import VideoCard from './VideoCard';
import PlaylistDetail from './PlaylistDetail';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useI18n } from '../hooks/useI18n';
import './FavoritesPanel.css';

export default function FavoritesPanel({
  favorites,
  history,
  onClose,
  onPlay,
  onToggleFavorite,
  isFavorite,
  onClearHistory,
  playlists,
  onCreatePlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onRemoveFromPlaylist,
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState('favorites');
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const panelRef = useRef(null);
  useFocusTrap(panelRef);

  const items = tab === 'favorites' ? favorites : tab === 'history' ? history : [];

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleCreatePlaylist = () => {
    const name = newPlaylistName.trim();
    if (!name) return;
    onCreatePlaylist?.(name);
    setNewPlaylistName('');
  };

  // If viewing a specific playlist
  if (activePlaylist) {
    const pl = playlists?.find((p) => p.id === activePlaylist);
    if (!pl) {
      setActivePlaylist(null);
      return null;
    }
    return (
      <>
        <div className="favorites-panel__backdrop" onClick={onClose} />
        <div className="favorites-panel" role="dialog" aria-modal="true" aria-label={pl.name} ref={panelRef}>
          <div className="favorites-panel__header">
            <span className="favorites-panel__header-title">{pl.name}</span>
            <button className="favorites-panel__close" onClick={onClose} aria-label={t('fav.closePanel')}>
              &times;
            </button>
          </div>
          <div className="favorites-panel__body">
            <PlaylistDetail
              playlist={pl}
              onBack={() => setActivePlaylist(null)}
              onPlay={onPlay}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFavorite}
              onRemoveFromPlaylist={onRemoveFromPlaylist}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="favorites-panel__backdrop" onClick={onClose} />
      <div className="favorites-panel" role="dialog" aria-modal="true" aria-label={t('fav.favorites')} ref={panelRef}>
        <div className="favorites-panel__header">
          <div className="favorites-panel__tabs" role="tablist">
            <button
              className={`favorites-panel__tab ${tab === 'favorites' ? 'favorites-panel__tab--active' : ''}`}
              onClick={() => setTab('favorites')}
              role="tab"
              aria-selected={tab === 'favorites'}
            >
              {t('fav.favorites')} ({favorites.length})
            </button>
            <button
              className={`favorites-panel__tab ${tab === 'history' ? 'favorites-panel__tab--active' : ''}`}
              onClick={() => setTab('history')}
              role="tab"
              aria-selected={tab === 'history'}
            >
              {t('fav.history')} ({history.length})
            </button>
            {playlists && (
              <button
                className={`favorites-panel__tab ${tab === 'playlists' ? 'favorites-panel__tab--active' : ''}`}
                onClick={() => setTab('playlists')}
                role="tab"
                aria-selected={tab === 'playlists'}
              >
                {t('playlist.playlists')} ({playlists.length})
              </button>
            )}
          </div>
          <button className="favorites-panel__close" onClick={onClose} aria-label={t('fav.closePanel')}>
            &times;
          </button>
        </div>

        <div className="favorites-panel__body">
          {tab === 'playlists' ? (
            <>
              <div className="favorites-panel__playlist-create">
                <input
                  className="favorites-panel__playlist-input"
                  type="text"
                  placeholder={t('playlist.namePlaceholder')}
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                />
                <button className="favorites-panel__playlist-add-btn" onClick={handleCreatePlaylist}>
                  + {t('playlist.create')}
                </button>
              </div>
              {(!playlists || playlists.length === 0) ? (
                <p className="favorites-panel__empty">{t('playlist.empty')}</p>
              ) : (
                <div className="favorites-panel__playlist-list">
                  {playlists.map((pl) => (
                    <div key={pl.id} className="favorites-panel__playlist-item">
                      <button
                        className="favorites-panel__playlist-name"
                        onClick={() => setActivePlaylist(pl.id)}
                      >
                        {pl.name}
                        <span className="favorites-panel__playlist-count">
                          {t('playlist.videos', { count: pl.videos.length })}
                        </span>
                      </button>
                      <div className="favorites-panel__playlist-actions">
                        <button
                          className="favorites-panel__playlist-action"
                          onClick={() => {
                            const name = prompt('Rename playlist:', pl.name);
                            if (name?.trim()) onRenamePlaylist?.(pl.id, name.trim());
                          }}
                          title={t('playlist.rename')}
                        >
                          &#9998;
                        </button>
                        <button
                          className="favorites-panel__playlist-action favorites-panel__playlist-action--delete"
                          onClick={() => onDeletePlaylist?.(pl.id)}
                          title={t('playlist.delete')}
                        >
                          &#128465;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : items.length === 0 ? (
            <p className="favorites-panel__empty">
              {tab === 'favorites' ? t('fav.noFavorites') : t('fav.noHistory')}
            </p>
          ) : (
            <>
              {tab === 'history' && (
                <button className="favorites-panel__clear" onClick={onClearHistory}>
                  {t('fav.clearHistory')}
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
