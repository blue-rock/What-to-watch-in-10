import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../hooks/useI18n';
import './WatchRoom.css';

const REACTION_EMOJIS = ['\uD83D\uDE02', '\uD83D\uDD25', '\u2764\uFE0F', '\uD83D\uDC4F', '\uD83D\uDE2E', '\uD83D\uDE22', '\uD83C\uDF89', '\uD83D\uDC4D'];

// Load YouTube IFrame API
let ytApiReady = false;
let ytApiPromise = null;
function loadYTApi() {
  if (ytApiReady) return Promise.resolve();
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT?.Player) { ytApiReady = true; resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { ytApiReady = true; prev?.(); resolve(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

export default function WatchRoom({
  roomId, roomData, isHost, participants, reactions, messages, userId,
  onSyncPlayback, onSendReaction, onSetVideo, onLeave, onChannelClick, onSendMessage,
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [videoChatOn, setVideoChatOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const suppressRef = useRef(false);
  const lastSyncRef = useRef(null);
  const containerIdRef = useRef('wr-player-' + Math.random().toString(36).substr(2, 6));

  const video = roomData?.video;
  const videoId = video?.id;
  const state = roomData?.state;

  // Create / update YouTube player
  useEffect(() => {
    if (!videoId) {
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }
      return;
    }

    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed) return;
      const el = document.getElementById(containerIdRef.current);
      if (!el) return;

      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} }
      el.innerHTML = '';
      const div = document.createElement('div');
      el.appendChild(div);

      ytPlayerRef.current = new window.YT.Player(div, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: isHost ? 1 : 0, modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: (event) => {
            if (!isHost && state) {
              event.target.seekTo(state.currentTime, true);
              if (state.playing) event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            if (!isHost || suppressRef.current) return;
            const s = event.data;
            const ct = event.target.getCurrentTime();
            if (s === window.YT.PlayerState.PLAYING) onSyncPlayback(true, ct);
            else if (s === window.YT.PlayerState.PAUSED) onSyncPlayback(false, ct);
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (ytPlayerRef.current) { try { ytPlayerRef.current.destroy(); } catch {} ytPlayerRef.current = null; }
    };
  }, [videoId]);

  // Sync playback for non-host
  useEffect(() => {
    if (isHost || !state || !ytPlayerRef.current) return;
    const syncKey = `${state.updatedAt}-${state.playing}-${state.currentTime}`;
    if (lastSyncRef.current === syncKey) return;
    lastSyncRef.current = syncKey;

    suppressRef.current = true;
    try {
      const player = ytPlayerRef.current;
      const ct = player.getCurrentTime?.() || 0;
      if (Math.abs(ct - state.currentTime) > 2) player.seekTo(state.currentTime, true);
      if (state.playing) player.playVideo(); else player.pauseVideo();
    } catch {}
    setTimeout(() => { suppressRef.current = false; }, 500);
  }, [state?.updatedAt, state?.playing, state?.currentTime, isHost]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#room=${roomId}`;
    try { await navigator.clipboard.writeText(url); } catch {
      const inp = document.createElement('input'); inp.value = url;
      document.body.appendChild(inp); inp.select(); document.execCommand('copy');
      document.body.removeChild(inp);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doSearch = async (query) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&duration=medium`);
      const data = await res.json();
      setSearchResults(data.items || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    doSearch(searchQuery);
  };

  const handleChannelClick = (channelName) => {
    if (!isHost) return;
    setSearchQuery(channelName);
    setShowSearch(true);
    doSearch(channelName);
  };

  const handleSelectVideo = (v) => {
    onSetVideo(v);
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    onSendMessage(chatMsg);
    setChatMsg('');
  };

  const toggleVideoChat = async () => {
    if (videoChatOn && localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
      setVideoChatOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        setVideoChatOn(true);
      } catch {
        // User denied or no camera available
      }
    }
  };

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [localStream]);

  const participantList = Object.entries(participants);

  return (
    <div className="watch-room">
      {/* Header */}
      <div className="watch-room__header">
        <div className="watch-room__room-info">
          <span className="watch-room__code">{t('room.room')}: <strong>{roomId}</strong></span>
          <button className="watch-room__copy-btn" onClick={handleCopyLink}>
            {copied ? t('share.copied') : t('room.copyLink')}
          </button>
          <span className="watch-room__count">
            {participantList.length} {t('room.watching')}
          </span>
        </div>
        <div className="watch-room__header-actions">
          <button
            className={`watch-room__videochat-btn ${videoChatOn ? 'watch-room__videochat-btn--active' : ''}`}
            onClick={toggleVideoChat}
            title={videoChatOn ? t('room.videoChatOff') : t('room.videoChatOn')}
          >
            {videoChatOn ? t('room.videoChatOff') : t('room.videoChatOn')}
          </button>
          {isHost && video && (
            <button className="watch-room__change-btn" onClick={() => setShowSearch(!showSearch)}>
              {t('room.changeVideo')}
            </button>
          )}
          <button className="watch-room__leave-btn" onClick={onLeave}>{t('room.leave')}</button>
        </div>
      </div>

      {/* Body */}
      <div className="watch-room__body">
        <div className="watch-room__main">
          {video ? (
            <div className="watch-room__player-wrap">
              <div id={containerIdRef.current} className="watch-room__player" />
              {/* Floating reactions */}
              <div className="watch-room__reaction-overlay" aria-hidden="true">
                {reactions.map((r) => (
                  <span
                    key={r.key}
                    className="watch-room__floating-emoji"
                    style={{ left: `${10 + Math.random() * 80}%` }}
                  >
                    {r.emoji}
                  </span>
                ))}
              </div>
              {/* Host search overlay on top of video */}
              {showSearch && isHost && (
                <div className="watch-room__search-overlay">
                  <form onSubmit={handleSearch} className="watch-room__search-form">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('room.searchPlaceholder')}
                      className="watch-room__search-input"
                      autoFocus
                    />
                    <button type="submit" className="watch-room__search-submit" disabled={searching}>
                      {searching ? '...' : t('search.button')}
                    </button>
                    <button
                      type="button"
                      className="watch-room__search-close"
                      onClick={() => { setShowSearch(false); setSearchResults([]); }}
                    >
                      {'\u2715'}
                    </button>
                  </form>
                  {searchResults.length > 0 && (
                    <div className="watch-room__search-results">
                      {searchResults.slice(0, 8).map((v) => (
                        <button key={v.id} className="watch-room__search-item" onClick={() => handleSelectVideo(v)}>
                          <img src={v.thumbnail} alt="" className="watch-room__search-thumb" />
                          <div className="watch-room__search-meta">
                            <span className="watch-room__search-title">{v.title}</span>
                            <span className="watch-room__search-channel">{v.channel}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="watch-room__empty-player">
              <div className="watch-room__empty-icon">{'\uD83C\uDFAC'}</div>
              <p>{isHost ? t('room.pickVideo') : t('room.waitingHost')}</p>
              {isHost && (
                <button className="watch-room__search-btn" onClick={() => setShowSearch(true)}>
                  {t('room.searchVideo')}
                </button>
              )}
            </div>
          )}

          {video && (
            <div className="watch-room__video-info">
              <h3>{video.title}</h3>
              <button
                className="watch-room__channel-link"
                onClick={() => onChannelClick ? onChannelClick(video.channel, video.channelId) : handleChannelClick(video.channel)}
                title={t('channel.viewChannel')}
              >
                {video.channel}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="watch-room__sidebar">
          {videoChatOn && localStream && (
            <div className="watch-room__video-preview">
              <video ref={localVideoRef} autoPlay muted playsInline className="watch-room__local-video" />
            </div>
          )}
          <h4 className="watch-room__sidebar-title">{t('room.participants')}</h4>
          <div className="watch-room__participant-list">
            {participantList.map(([id, p]) => (
              <div key={id} className="watch-room__participant">
                <span className="watch-room__avatar" style={{ background: p.color }}>
                  {(p.name || 'G')[0].toUpperCase()}
                </span>
                <span className="watch-room__pname">
                  {p.name || 'Guest'}
                  {id === roomData?.host && <span className="watch-room__host-tag">{t('room.host')}</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Chat */}
          <h4 className="watch-room__sidebar-title watch-room__chat-title">{t('room.chat')}</h4>
          <div className="watch-room__chat">
            <div className="watch-room__chat-messages">
              {(!messages || messages.length === 0) && (
                <p className="watch-room__chat-empty">{t('room.chatEmpty')}</p>
              )}
              {messages && messages.map((msg) => (
                <div key={msg.key} className="watch-room__chat-msg">
                  <span className="watch-room__chat-name" style={{ color: participants[msg.userId]?.color || '#888' }}>
                    {msg.name}
                  </span>
                  <span className="watch-room__chat-text">{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form className="watch-room__chat-form" onSubmit={handleSendChat}>
              <input
                type="text"
                className="watch-room__chat-input"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                placeholder={t('room.chatPlaceholder')}
                maxLength={200}
              />
              <button type="submit" className="watch-room__chat-send" disabled={!chatMsg.trim()}>
                {t('room.chatSend')}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Reactions bar */}
      <div className="watch-room__reactions-bar">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="watch-room__react-btn"
            onClick={() => onSendReaction(emoji)}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
