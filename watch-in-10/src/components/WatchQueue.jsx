import { useI18n } from '../hooks/useI18n';
import { formatDuration } from '../utils/duration';
import './WatchQueue.css';

export default function WatchQueue({ queue, onPlay, onRemove, onClear, onClose }) {
  const { t } = useI18n();

  return (
    <>
      <div className="watch-queue__backdrop" onClick={onClose} />
      <div className="watch-queue">
        <div className="watch-queue__header">
          <h3 className="watch-queue__title">{t('queue.title')} ({queue.length})</h3>
          <div className="watch-queue__header-actions">
            {queue.length > 0 && (
              <button className="watch-queue__clear" onClick={onClear}>
                {t('queue.clear')}
              </button>
            )}
            <button className="watch-queue__close" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="watch-queue__body">
          {queue.length === 0 ? (
            <p className="watch-queue__empty">{t('queue.empty')}</p>
          ) : (
            <div className="watch-queue__list">
              {queue.map((video, i) => (
                <div key={video.id} className="watch-queue__item">
                  {i === 0 && <span className="watch-queue__up-next">{t('queue.upNext')}</span>}
                  <button className="watch-queue__item-btn" onClick={() => onPlay(video)}>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="watch-queue__thumb"
                    />
                    <div className="watch-queue__item-info">
                      <span className="watch-queue__item-title">{video.title}</span>
                      <span className="watch-queue__item-meta">
                        {video.channel} &middot; {formatDuration(video.durationSeconds)}
                      </span>
                    </div>
                  </button>
                  <button
                    className="watch-queue__remove"
                    onClick={() => onRemove(video.id)}
                    title="Remove"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
