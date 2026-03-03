import { formatDuration } from '../utils/duration';
import './VideoCard.css';

export default function VideoCard({ video, onPlay, onToggleFavorite, isFavorited }) {
  return (
    <div
      className="video-card"
      onClick={() => onPlay(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(video);
        }
      }}
      aria-label={`Play ${video.title}`}
    >
      <div className="video-card__thumb-wrap">
        <img
          className="video-card__thumb"
          src={video.thumbnail}
          alt={video.title}
          loading="lazy"
        />
        <span className="video-card__duration">
          {formatDuration(video.durationSeconds)}
        </span>
        <span className="video-card__play-icon" aria-hidden="true">&#9654;</span>
        {onToggleFavorite && (
          <button
            className={`video-card__fav-btn ${isFavorited ? 'video-card__fav-btn--active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(video);
            }}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
          </button>
        )}
      </div>
      <div className="video-card__info">
        <h3 className="video-card__title">{video.title}</h3>
        <p className="video-card__channel">{video.channel}</p>
      </div>
    </div>
  );
}
