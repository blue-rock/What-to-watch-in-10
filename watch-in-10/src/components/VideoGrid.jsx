import VideoCard from './VideoCard';
import './VideoGrid.css';

export default function VideoGrid({ videos, usingFallback, onPlay, onToggleFavorite, isFavorite }) {
  return (
    <section className="video-grid-section">
      {usingFallback && (
        <p className="video-grid__fallback-note">
          Showing sample picks — live results temporarily unavailable.
        </p>
      )}
      <div className="video-grid">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onPlay={onPlay}
            onToggleFavorite={onToggleFavorite}
            isFavorited={isFavorite?.(video.id)}
          />
        ))}
      </div>
    </section>
  );
}
