import { useState, useRef } from 'react';
import { formatDuration } from '../utils/duration';
import { shareToWhatsApp, shareToTwitter, copyVideoLink, shareNative } from '../utils/share';
import { getThumbnailSrcSet } from '../utils/thumbnail';
import { useI18n } from '../hooks/useI18n';
import './VideoCard.css';

export default function VideoCard({
  video,
  onPlay,
  onToggleFavorite,
  isFavorited,
  style,
  playlists,
  onAddToPlaylist,
  onAddToQueue,
  onShare,
  onChannelClick,
}) {
  const { t } = useI18n();
  const [previewSrc, setPreviewSrc] = useState(null);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const hoverTimer = useRef(null);

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => {
      const id = video.url?.match(/[?&]v=([^&]+)/)?.[1] || video.id;
      setPreviewSrc(`https://i.ytimg.com/an_webp/${id}/mqdefault_6s.webp`);
    }, 500);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setPreviewSrc(null);
  };

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    const ok = await copyVideoLink(video);
    if (ok) {
      setCopyFeedback(true);
      setTimeout(() => { setCopyFeedback(false); setShowShareMenu(false); }, 1200);
    }
  };

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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={`Play ${video.title}`}
      style={style}
    >
      <div className="video-card__thumb-wrap">
        <img
          className="video-card__thumb"
          src={previewSrc || video.thumbnail}
          srcSet={previewSrc ? undefined : getThumbnailSrcSet(video.thumbnail, video.id)}
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
          alt={video.title}
          loading="lazy"
          decoding="async"
          onError={() => setPreviewSrc(null)}
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
        {/* Action buttons row */}
        <div className="video-card__actions">
          {onAddToQueue && (
            <button
              className="video-card__action-btn"
              onClick={(e) => { e.stopPropagation(); onAddToQueue(video); }}
              title={t('queue.addToQueue')}
            >
              &#128339;
            </button>
          )}
          {(onShare || video.url) && (
            <div className="video-card__share-wrap">
              <button
                className="video-card__action-btn"
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                title={t('share.shareVideo')}
              >
                &#8599;
              </button>
              {showShareMenu && (
                <div className="video-card__share-menu" onClick={(e) => e.stopPropagation()}>
                  <button className="video-card__share-option" onClick={handleCopyLink}>
                    {copyFeedback ? t('share.copied') : t('share.copyLink')}
                  </button>
                  <button className="video-card__share-option" onClick={(e) => { e.stopPropagation(); shareToWhatsApp(video); setShowShareMenu(false); }}>
                    {t('share.whatsapp')}
                  </button>
                  <button className="video-card__share-option" onClick={(e) => { e.stopPropagation(); shareToTwitter(video); setShowShareMenu(false); }}>
                    {t('share.twitter')}
                  </button>
                  {navigator.share && (
                    <button className="video-card__share-option" onClick={async (e) => { e.stopPropagation(); await shareNative(video); setShowShareMenu(false); }}>
                      {t('share.native')}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {playlists && playlists.length > 0 && onAddToPlaylist && (
            <div className="video-card__playlist-wrap">
              <button
                className="video-card__action-btn"
                onClick={(e) => { e.stopPropagation(); setShowPlaylistMenu(!showPlaylistMenu); }}
                title={t('playlist.addTo')}
              >
                +
              </button>
              {showPlaylistMenu && (
                <div className="video-card__playlist-menu" onClick={(e) => e.stopPropagation()}>
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      className="video-card__playlist-option"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToPlaylist(pl.id, video);
                        setShowPlaylistMenu(false);
                      }}
                    >
                      {pl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="video-card__info">
        <h3 className="video-card__title">{video.title}</h3>
        {onChannelClick ? (
          <button
            className="video-card__channel video-card__channel--link"
            onClick={(e) => { e.stopPropagation(); onChannelClick(video.channel, video.channelId); }}
            title={t('channel.viewChannel')}
          >
            {video.channel}
          </button>
        ) : (
          <p className="video-card__channel">{video.channel}</p>
        )}
      </div>
    </div>
  );
}
