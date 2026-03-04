import VideoCard from './VideoCard';
import { useI18n } from '../hooks/useI18n';
import './PlaylistDetail.css';

export default function PlaylistDetail({ playlist, onBack, onPlay, onToggleFavorite, isFavorite, onRemoveFromPlaylist }) {
  const { t } = useI18n();

  return (
    <div className="playlist-detail">
      <button className="playlist-detail__back" onClick={onBack}>
        &larr; {t('playlist.back')}
      </button>
      <h3 className="playlist-detail__name">{playlist.name}</h3>
      <p className="playlist-detail__count">{t('playlist.videos', { count: playlist.videos.length })}</p>

      {playlist.videos.length === 0 ? (
        <p className="playlist-detail__empty">{t('playlist.noVideos')}</p>
      ) : (
        <div className="playlist-detail__list">
          {playlist.videos.map((video) => (
            <div key={video.id} className="playlist-detail__item">
              <VideoCard
                video={video}
                onPlay={onPlay}
                onToggleFavorite={onToggleFavorite}
                isFavorited={isFavorite?.(video.id)}
              />
              <button
                className="playlist-detail__remove"
                onClick={() => onRemoveFromPlaylist(playlist.id, video.id)}
              >
                {t('playlist.remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
