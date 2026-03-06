import { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from '../hooks/useI18n';
import { fetchChannel, fetchChannelMore } from '../services/youtube';
import { formatDuration } from '../utils/duration';
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
  onSyncPlayback, onSendReaction, onSetVideo, onLeave, onSendMessage, onToggleSharedControl,
  onSetMeetLink, onClearMeetLink,
}) {
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchContinuation, setSearchContinuation] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatMsg, setChatMsg] = useState('');

  // Channel view state
  const [channelView, setChannelView] = useState(null); // { channelId, channelName }
  const [channelData, setChannelData] = useState(null);
  const [channelVideos, setChannelVideos] = useState([]);
  const [channelContinuation, setChannelContinuation] = useState(null);
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelLoadingMore, setChannelLoadingMore] = useState(false);

  const [showMeetInput, setShowMeetInput] = useState(false);
  const [meetLinkInput, setMeetLinkInput] = useState('');

  const meetLink = roomData?.meetLink || null;

  const handleSetMeetLink = (e) => {
    e.preventDefault();
    const link = meetLinkInput.trim();
    if (!link) return;
    onSetMeetLink(link);
    setMeetLinkInput('');
    setShowMeetInput(false);
  };

  const handleJoinMeet = () => {
    if (meetLink) window.open(meetLink, '_blank', 'noopener,noreferrer');
  };

  const chatEndRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const suppressRef = useRef(false);
  const lastSyncRef = useRef(null);
  const containerIdRef = useRef('wr-player-' + Math.random().toString(36).substr(2, 6));
  const searchSentinelRef = useRef(null);
  const channelSentinelRef = useRef(null);

  const sharedControlRef = useRef(false);

  const video = roomData?.video;
  const videoId = video?.id;
  const state = roomData?.state;
  const sharedControl = roomData?.sharedControl || false;
  sharedControlRef.current = sharedControl;

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
            if (suppressRef.current) return;
            if (!isHost && !sharedControlRef.current) return;
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

  // Sync playback from remote state changes
  useEffect(() => {
    if (!state || !ytPlayerRef.current) return;
    if (state.updatedBy === userId) return;
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
  }, [state?.updatedAt, state?.playing, state?.currentTime, userId]);

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

  // --- Search with pagination ---
  const doSearch = async (query, isNew = true) => {
    if (!query.trim()) return;
    if (isNew) {
      setSearching(true);
      setSearchResults([]);
      setSearchContinuation(null);
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&duration=medium`);
      const data = await res.json();
      setSearchResults(data.items || []);
      setSearchContinuation(data.continuation || null);
    } catch { setSearchResults([]); setSearchContinuation(null); }
    setSearching(false);
  };

  const loadMoreSearch = useCallback(async () => {
    if (!searchContinuation || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/search?continuation=${encodeURIComponent(searchContinuation)}`);
      const data = await res.json();
      const newItems = data.items || [];
      setSearchResults((prev) => {
        const ids = new Set(prev.map((v) => v.id));
        return [...prev, ...newItems.filter((v) => !ids.has(v.id))];
      });
      setSearchContinuation(data.continuation || null);
    } catch { setSearchContinuation(null); }
    setLoadingMore(false);
  }, [searchContinuation, loadingMore]);

  // Infinite scroll observer for search results
  useEffect(() => {
    const sentinel = searchSentinelRef.current;
    if (!sentinel || !searchContinuation) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreSearch(); },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [searchContinuation, loadMoreSearch]);

  const handleSearch = async (e) => {
    e.preventDefault();
    doSearch(searchQuery);
  };

  const handleSelectVideo = (v) => {
    onSetVideo(v);
    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
    setSearchContinuation(null);
    setChannelView(null);
  };

  // --- Channel view ---
  const openChannel = useCallback(async (channelId, channelName) => {
    setChannelView({ channelId, channelName });
    setChannelLoading(true);
    setChannelData(null);
    setChannelVideos([]);
    setChannelContinuation(null);
    const data = await fetchChannel(channelId, locale);
    if (data) {
      setChannelData(data);
      setChannelVideos(data.videos || []);
      setChannelContinuation(data.continuation || null);
    }
    setChannelLoading(false);
  }, [locale]);

  const loadMoreChannel = useCallback(async () => {
    if (!channelContinuation || channelLoadingMore) return;
    setChannelLoadingMore(true);
    const data = await fetchChannelMore(channelContinuation, locale);
    if (data) {
      setChannelVideos((prev) => {
        const ids = new Set(prev.map((v) => v.id));
        return [...prev, ...(data.videos || []).filter((v) => !ids.has(v.id))];
      });
      setChannelContinuation(data.continuation || null);
    }
    setChannelLoadingMore(false);
  }, [channelContinuation, channelLoadingMore, locale]);

  // Infinite scroll observer for channel videos
  useEffect(() => {
    const sentinel = channelSentinelRef.current;
    if (!sentinel || !channelContinuation) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreChannel(); },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [channelContinuation, loadMoreChannel]);

  const closeChannel = () => {
    setChannelView(null);
    setChannelData(null);
    setChannelVideos([]);
    setChannelContinuation(null);
  };

  const handleChannelClick = (channelName, channelId) => {
    if (channelId) {
      openChannel(channelId, channelName);
    } else {
      // Fallback: search by channel name
      setSearchQuery(channelName);
      setShowSearch(true);
      doSearch(channelName);
    }
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

  const participantList = Object.entries(participants);

  // Shared search results list component (used in both overlay and empty state)
  const renderSearchResults = (isOverlay) => (
    <>
      <div className={isOverlay ? 'watch-room__search-results' : 'watch-room__empty-search-results'}>
        {searchResults.map((v) => (
          <button key={v.id} className="watch-room__search-item" onClick={() => handleSelectVideo(v)}>
            <img src={v.thumbnail} alt="" className="watch-room__search-thumb" loading="lazy" />
            <div className="watch-room__search-meta">
              <span className={isOverlay ? 'watch-room__search-title' : 'watch-room__search-title'}>
                {v.title}
              </span>
              <span className={isOverlay ? 'watch-room__search-channel' : 'watch-room__search-channel'}>
                {v.channel}
                {v.durationSeconds > 0 && ` \u00B7 ${formatDuration(v.durationSeconds)}`}
              </span>
            </div>
          </button>
        ))}
        {(searchContinuation || loadingMore) && (
          <div ref={searchSentinelRef} className="watch-room__load-sentinel">
            {loadingMore && <span className="watch-room__loading-dots">Loading...</span>}
          </div>
        )}
      </div>
    </>
  );

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
          {sharedControl && !isHost && (
            <span className="watch-room__shared-badge">{t('room.sharedControlActive')}</span>
          )}
        </div>
        <div className="watch-room__header-actions">
          {isHost && (
            <button
              className={`watch-room__shared-ctrl-btn ${sharedControl ? 'watch-room__shared-ctrl-btn--active' : ''}`}
              onClick={onToggleSharedControl}
              title={sharedControl ? t('room.sharedControlOff') : t('room.sharedControlOn')}
            >
              {sharedControl ? t('room.sharedControlOff') : t('room.sharedControlOn')}
            </button>
          )}
          {(isHost || sharedControl) && video && (
            <button className="watch-room__change-btn" onClick={() => { setShowSearch(!showSearch); setChannelView(null); }}>
              {t('room.changeVideo')}
            </button>
          )}
          <button className="watch-room__leave-btn" onClick={onLeave}>{t('room.leave')}</button>
        </div>
      </div>

      {/* Body */}
      <div className="watch-room__body">
        <div className="watch-room__main">
          {/* Channel view overlay */}
          {channelView ? (
            <div className="watch-room__channel-panel">
              <div className="watch-room__channel-header">
                <button className="watch-room__channel-back" onClick={closeChannel}>
                  {'\u2190'} {t('channel.back')}
                </button>
                <h3 className="watch-room__channel-name">
                  {channelData?.name || channelView.channelName}
                </h3>
                {channelData?.subscriberCount && (
                  <span className="watch-room__channel-subs">{channelData.subscriberCount}</span>
                )}
              </div>
              {channelLoading ? (
                <div className="watch-room__channel-loading">
                  <div className="watch-room__skeleton-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="watch-room__skeleton-card">
                        <div className="watch-room__skeleton-thumb" />
                        <div className="watch-room__skeleton-title" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : channelVideos.length > 0 ? (
                <div className="watch-room__channel-grid-wrap">
                  <div className="watch-room__channel-grid">
                    {channelVideos.map((v) => (
                      <button
                        key={v.id}
                        className="watch-room__channel-video"
                        onClick={() => handleSelectVideo({ ...v, channel: channelData?.name || channelView.channelName, channelId: channelView.channelId })}
                      >
                        <div className="watch-room__channel-thumb-wrap">
                          <img src={v.thumbnail} alt="" className="watch-room__channel-thumb" loading="lazy" />
                          {v.durationSeconds > 0 && (
                            <span className="watch-room__channel-duration">{formatDuration(v.durationSeconds)}</span>
                          )}
                        </div>
                        <div className="watch-room__channel-vid-info">
                          <span className="watch-room__channel-vid-title">{v.title}</span>
                          <span className="watch-room__channel-vid-meta">
                            {v.viewCount > 0 && `${v.viewCount.toLocaleString()} views`}
                            {v.publishedAt && ` \u00B7 ${v.publishedAt}`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {(channelContinuation || channelLoadingMore) && (
                    <div ref={channelSentinelRef} className="watch-room__load-sentinel">
                      {channelLoadingMore && <span className="watch-room__loading-dots">Loading...</span>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="watch-room__channel-empty">{t('channel.noVideos')}</p>
              )}
            </div>
          ) : video ? (
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
              {/* Search overlay on top of video (host or shared control) */}
              {showSearch && (isHost || sharedControl) && (
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
                      onClick={() => { setShowSearch(false); setSearchResults([]); setSearchContinuation(null); }}
                    >
                      {'\u2715'}
                    </button>
                  </form>
                  {searchResults.length > 0 && renderSearchResults(true)}
                </div>
              )}
            </div>
          ) : (
            <div className="watch-room__empty-player">
              {showSearch && (isHost || sharedControl) ? (
                <>
                  <form onSubmit={handleSearch} className="watch-room__empty-search-form">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('room.searchPlaceholder')}
                      className="watch-room__empty-search-input"
                      autoFocus
                    />
                    <button type="submit" className="watch-room__search-submit" disabled={searching}>
                      {searching ? '...' : t('search.button')}
                    </button>
                  </form>
                  {searchResults.length > 0 && renderSearchResults(false)}
                </>
              ) : (
                <>
                  <div className="watch-room__empty-icon">{'\uD83C\uDFAC'}</div>
                  <p>{(isHost || sharedControl) ? t('room.pickVideo') : t('room.waitingHost')}</p>
                  {(isHost || sharedControl) && (
                    <button className="watch-room__search-btn" onClick={() => setShowSearch(true)}>
                      {t('room.searchVideo')}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {video && !channelView && (
            <div className="watch-room__video-info">
              <h3>{video.title}</h3>
              <button
                className="watch-room__channel-link"
                onClick={() => handleChannelClick(video.channel, video.channelId)}
                title={t('channel.viewChannel')}
              >
                {video.channel}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="watch-room__sidebar">
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

          {/* Video Call (Google Meet) */}
          <h4 className="watch-room__sidebar-title watch-room__meet-title">{t('room.videoCall')}</h4>
          <div className="watch-room__meet">
            {meetLink ? (
              <div className="watch-room__meet-active">
                <button className="watch-room__meet-join-btn" onClick={handleJoinMeet}>
                  {t('room.joinMeet')}
                </button>
                {isHost && (
                  <button className="watch-room__meet-end-btn" onClick={onClearMeetLink}>
                    {t('room.endMeet')}
                  </button>
                )}
              </div>
            ) : isHost ? (
              showMeetInput ? (
                <form className="watch-room__meet-form" onSubmit={handleSetMeetLink}>
                  <input
                    type="url"
                    className="watch-room__meet-input"
                    value={meetLinkInput}
                    onChange={(e) => setMeetLinkInput(e.target.value)}
                    placeholder={t('room.meetPlaceholder')}
                    autoFocus
                  />
                  <button type="submit" className="watch-room__meet-submit" disabled={!meetLinkInput.trim()}>
                    {t('room.meetShare')}
                  </button>
                  <button type="button" className="watch-room__meet-cancel" onClick={() => { setShowMeetInput(false); setMeetLinkInput(''); }}>
                    {'\u2715'}
                  </button>
                </form>
              ) : (
                <button className="watch-room__meet-start-btn" onClick={() => setShowMeetInput(true)}>
                  {t('room.startMeet')}
                </button>
              )
            ) : (
              <p className="watch-room__meet-empty">{t('room.noMeet')}</p>
            )}
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
