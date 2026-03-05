import { useEffect, useRef } from 'react';
import VideoCard from './VideoCard';
import { useI18n } from '../hooks/useI18n';
import { useSwipe } from '../hooks/useSwipe';
import './VideoGrid.css';

export default function VideoGrid({
  videos,
  usingFallback,
  onPlay,
  onToggleFavorite,
  isFavorite,
  onLoadMore,
  hasMore,
  playlists,
  onAddToPlaylist,
  onAddToQueue,
  onShare,
  onDismiss,
  onChannelClick,
}) {
  const { t } = useI18n();
  const sentinelRef = useRef(null);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || !onLoadMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onLoadMore(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  return (
    <section className="video-grid-section">
      {usingFallback && (
        <p className="video-grid__fallback-note">
          {t('results.fallbackNote')}
        </p>
      )}
      <div className="video-grid">
        {videos.map((video, i) => (
          <SwipeableCard
            key={video.id}
            video={video}
            index={i}
            onPlay={onPlay}
            onToggleFavorite={onToggleFavorite}
            isFavorited={isFavorite?.(video.id)}
            playlists={playlists}
            onAddToPlaylist={onAddToPlaylist}
            onAddToQueue={onAddToQueue}
            onShare={onShare}
            onDismiss={onDismiss}
            onChannelClick={onChannelClick}
          />
        ))}
      </div>
      {hasMore && <div ref={sentinelRef} className="video-grid__sentinel" />}
    </section>
  );
}

function SwipeableCard({ video, index, onPlay, onToggleFavorite, isFavorited, playlists, onAddToPlaylist, onAddToQueue, onShare, onDismiss, onChannelClick }) {
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeRight: () => onToggleFavorite?.(video),
    onSwipeLeft: () => onDismiss?.(video.id),
  });

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <VideoCard
        video={video}
        onPlay={onPlay}
        onToggleFavorite={onToggleFavorite}
        isFavorited={isFavorited}
        style={{ animationDelay: `${index * 0.05}s` }}
        playlists={playlists}
        onAddToPlaylist={onAddToPlaylist}
        onAddToQueue={onAddToQueue}
        onShare={onShare}
        onChannelClick={onChannelClick}
      />
    </div>
  );
}
