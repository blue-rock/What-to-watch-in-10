import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchChannel } from '../services/youtube';
import { formatDuration } from '../utils/duration';
import { useI18n } from '../hooks/useI18n';
import './ChannelPage.css';

export default function ChannelPage({ channelId, channelName, onClose, onPlay }) {
  const { t, locale } = useI18n();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchChannel(channelId, locale).then((data) => {
      if (!cancelled) {
        setChannel(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [channelId, locale]);

  // YouTube IFrame Player
  useEffect(() => {
    if (!playingVideo) return;

    const loadPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: playingVideo.id,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              setPlayingVideo(null);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      loadPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); loadPlayer(); };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [playingVideo]);

  const handlePlayVideo = useCallback((video) => {
    setPlayingVideo(video);
    // Also notify parent so it's added to history
    onPlay({ ...video, channel: channel?.name || channelName, channelId });
  }, [onPlay, channel, channelName, channelId]);

  const name = channel?.name || channelName;
  const avatar = channel?.avatar || '';
  const banner = channel?.banner || '';
  const handle = channel?.handle || '';
  const subscriberCount = channel?.subscriberCount || '';
  const videos = channel?.videos || [];

  return (
    <div className="channel-page">
      {/* Banner */}
      <div
        className="channel-page__banner"
        style={banner ? { backgroundImage: `url(${banner})` } : undefined}
      >
        <button className="channel-page__back" onClick={onClose}>
          {'\u2190'} {t('channel.back')}
        </button>
      </div>

      {/* Channel info */}
      <div className="channel-page__info">
        {avatar ? (
          <img src={avatar} alt={name} className="channel-page__avatar" />
        ) : (
          <div className="channel-page__avatar channel-page__avatar--placeholder">
            {name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <div className="channel-page__meta">
          <h1 className="channel-page__name">{name}</h1>
          <div className="channel-page__details">
            {handle && <span className="channel-page__handle">{handle}</span>}
            {subscriberCount && <span className="channel-page__subs">{subscriberCount}</span>}
          </div>
        </div>
      </div>

      {/* Inline player */}
      {playingVideo && (
        <div className="channel-page__player-section">
          <div className="channel-page__player-wrap">
            <div ref={containerRef} className="channel-page__player" />
          </div>
          <div className="channel-page__player-info">
            <h3>{playingVideo.title}</h3>
            <p>
              {playingVideo.viewCount > 0 && `${playingVideo.viewCount.toLocaleString()} views`}
              {playingVideo.publishedAt && ` \u00B7 ${playingVideo.publishedAt}`}
            </p>
            <button className="channel-page__close-player" onClick={() => setPlayingVideo(null)}>
              {'\u2715'} Close player
            </button>
          </div>
        </div>
      )}

      {/* Videos */}
      <div className="channel-page__content">
        {loading ? (
          <div className="channel-page__loading">
            <div className="channel-page__skeleton-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="channel-page__skeleton-card">
                  <div className="channel-page__skeleton-thumb" />
                  <div className="channel-page__skeleton-title" />
                  <div className="channel-page__skeleton-sub" />
                </div>
              ))}
            </div>
          </div>
        ) : videos.length > 0 ? (
          <div className="channel-page__grid">
            {videos.map((video) => (
              <button
                key={video.id}
                className={`channel-page__video-card ${playingVideo?.id === video.id ? 'channel-page__video-card--active' : ''}`}
                onClick={() => handlePlayVideo(video)}
              >
                <div className="channel-page__thumb-wrap">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="channel-page__thumb"
                    loading="lazy"
                  />
                  {video.durationSeconds > 0 && (
                    <span className="channel-page__duration">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  )}
                  {playingVideo?.id === video.id && (
                    <div className="channel-page__now-playing">Now Playing</div>
                  )}
                </div>
                <div className="channel-page__video-info">
                  <h3 className="channel-page__video-title">{video.title}</h3>
                  <p className="channel-page__video-meta">
                    {video.viewCount > 0 && `${video.viewCount.toLocaleString()} views`}
                    {video.publishedAt && ` \u00B7 ${video.publishedAt}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="channel-page__empty">{t('channel.noVideos')}</p>
        )}
      </div>
    </div>
  );
}
