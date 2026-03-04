import { useEffect, useRef } from 'react';
import './MiniPlayer.css';

let apiReady = false;
let apiPromise = null;
function loadYTApi() {
  if (apiReady) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { apiReady = true; resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { apiReady = true; prev?.(); resolve(); };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export default function MiniPlayer({ video, onExpand, onClose, onVideoEnd }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const videoId = video?.url?.match(/[?&]v=([^&]+)/)?.[1] || video?.id;

  useEffect(() => {
    if (!videoId) return;
    let player = null;

    loadYTApi().then(() => {
      if (!containerRef.current) return;
      player = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e) => {
            if (e.data === 0) onVideoEnd?.(); // ended
          },
        },
      });
      playerRef.current = player;
    });

    return () => {
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, [videoId, onVideoEnd]);

  if (!video) return null;

  return (
    <div className="mini-player">
      <div className="mini-player__video">
        <div ref={containerRef} className="mini-player__container" />
      </div>
      <div className="mini-player__controls">
        <p className="mini-player__title">{video.title}</p>
        <div className="mini-player__buttons">
          <button className="mini-player__btn" onClick={onExpand} title="Expand">&#8599;</button>
          <button className="mini-player__btn" onClick={onClose} title="Close">&times;</button>
        </div>
      </div>
    </div>
  );
}
