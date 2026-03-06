import { useEffect, useRef, useCallback, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import './VideoPlayerModal.css';

// Load the YouTube IFrame API script once
let apiReady = false;
let apiPromise = null;
function loadYTApi() {
  if (apiReady) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      apiReady = true;
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      apiReady = true;
      prev?.();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export default function VideoPlayerModal({ video, onClose, onMinimize, relatedVideos, onPlayRelated, onVideoEnd, onWatchTogether, onChannelClick }) {
  const { t } = useI18n();
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [videoError, setVideoError] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const countdownTimer = useRef(null);

  const videoId = video?.url?.match(/[?&]v=([^&]+)/)?.[1] || video?.id;

  // Initialize YouTube player with error detection
  useEffect(() => {
    setVideoError(false);
    setCountdown(null);
    clearTimeout(countdownTimer.current);

    let player = null;

    loadYTApi().then(() => {
      if (!containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onError: () => {
            setVideoError(true);
            if (relatedVideos && relatedVideos.length > 0) {
              let sec = 3;
              setCountdown(sec);
              const tick = () => {
                sec -= 1;
                if (sec <= 0) {
                  onPlayRelated?.(relatedVideos[0]);
                } else {
                  setCountdown(sec);
                  countdownTimer.current = setTimeout(tick, 1000);
                }
              };
              countdownTimer.current = setTimeout(tick, 1000);
            }
          },
          onStateChange: (e) => {
            if (e.data === 0) onVideoEnd?.(); // video ended
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      clearTimeout(countdownTimer.current);
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId, relatedVideos, onPlayRelated, onVideoEnd]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const player = playerRef.current;
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          if (player?.getPlayerState) {
            const state = player.getPlayerState();
            if (state === window.YT.PlayerState.PLAYING) player.pauseVideo();
            else player.playVideo();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (player?.getCurrentTime) player.seekTo(Math.max(0, player.getCurrentTime() - 5), true);
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (player?.getCurrentTime) player.seekTo(player.getCurrentTime() + 5, true);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (player?.getVolume) player.setVolume(Math.min(100, player.getVolume() + 10));
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (player?.getVolume) player.setVolume(Math.max(0, player.getVolume() - 10));
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            const iframe = containerRef.current?.querySelector('iframe');
            if (iframe) {
              if (document.fullscreenElement) document.exitFullscreen();
              else iframe.requestFullscreen?.();
            }
          }
          break;
        case 'm':
        case 'M':
          if (!e.ctrlKey && !e.metaKey && player?.isMuted) {
            e.preventDefault();
            if (player.isMuted()) player.unMute(); else player.mute();
          }
          break;
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  const handleSkipNow = useCallback(() => {
    clearTimeout(countdownTimer.current);
    if (relatedVideos && relatedVideos.length > 0) {
      onPlayRelated?.(relatedVideos[0]);
    }
  }, [relatedVideos, onPlayRelated]);

  if (!video) return null;

  return (
    <div
      className="video-modal"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Playing: ${video.title}`}
    >
      <div className="video-modal__content">
        <div className="video-modal__top-actions">
          {onWatchTogether && (
            <button
              className="video-modal__watch-together"
              onClick={() => onWatchTogether(video)}
              title={t('room.watchRoom')}
            >
              {t('room.watchRoom')}
            </button>
          )}
          {onMinimize && (
            <button className="video-modal__minimize" onClick={onMinimize} title={t('miniPlayer.minimize')}>
              &#8600;
            </button>
          )}
          <button
            className="video-modal__close"
            onClick={onClose}
            ref={closeRef}
            aria-label={t('player.close')}
          >
            &times;
          </button>
        </div>
        <div className="video-modal__embed-wrap">
          {videoError ? (
            <div className="video-modal__error">
              <span className="video-modal__error-icon">&#9888;</span>
              <p className="video-modal__error-text">{t('player.unavailable')}</p>
              {relatedVideos && relatedVideos.length > 0 ? (
                <button className="video-modal__error-skip" onClick={handleSkipNow}>
                  {t('player.skipNext')}{countdown !== null && ` (${countdown}s)`}
                </button>
              ) : (
                <button className="video-modal__error-skip" onClick={onClose}>
                  {t('player.close2')}
                </button>
              )}
            </div>
          ) : (
            <div ref={containerRef} className="video-modal__player" />
          )}
        </div>
        <p className="video-modal__title">{video.title}</p>
        {onChannelClick ? (
          <button
            className="video-modal__channel video-modal__channel--link"
            onClick={() => { onChannelClick(video.channel, video.channelId); onClose(); }}
            title={t('channel.viewChannel')}
          >
            {video.channel}
          </button>
        ) : (
          <p className="video-modal__channel">{video.channel}</p>
        )}

        {relatedVideos && relatedVideos.length > 0 && (
          <div className="video-modal__related">
            <p className="video-modal__related-label">{t('player.upNext')}</p>
            <div className="video-modal__related-list">
              {relatedVideos.map((rv) => (
                <button
                  key={rv.id}
                  className="video-modal__related-item"
                  onClick={() => onPlayRelated?.(rv)}
                >
                  <img src={rv.thumbnail} alt={rv.title} className="video-modal__related-thumb" />
                  <div className="video-modal__related-info">
                    <span className="video-modal__related-title">{rv.title}</span>
                    <span className="video-modal__related-channel">{rv.channel}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
