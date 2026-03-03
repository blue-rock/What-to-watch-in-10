import { useEffect, useRef, useCallback } from 'react';
import './VideoPlayerModal.css';

export default function VideoPlayerModal({ video, onClose }) {
  const overlayRef = useRef(null);
  const closeRef = useRef(null);

  const videoId = video?.url?.match(/[?&]v=([^&]+)/)?.[1] || video?.id;

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
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
        <button
          className="video-modal__close"
          onClick={onClose}
          ref={closeRef}
          aria-label="Close video player"
        >
          &times;
        </button>
        <div className="video-modal__embed-wrap">
          <iframe
            className="video-modal__iframe"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="video-modal__title">{video.title}</p>
        <p className="video-modal__channel">{video.channel}</p>
      </div>
    </div>
  );
}
