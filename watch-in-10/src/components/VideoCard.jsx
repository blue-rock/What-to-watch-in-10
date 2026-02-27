import { formatDuration } from '../utils/duration';
import './VideoCard.css';

export default function VideoCard({ video }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="video-card"
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
      </div>
      <div className="video-card__info">
        <h3 className="video-card__title">{video.title}</h3>
        <p className="video-card__channel">{video.channel}</p>
      </div>
    </a>
  );
}
