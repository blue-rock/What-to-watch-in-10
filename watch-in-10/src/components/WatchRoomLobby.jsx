import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import './WatchRoomLobby.css';

export default function WatchRoomLobby({ isConfigured, onCreateRoom, onJoinRoom, onClose, error, initialRoomCode }) {
  const { t } = useI18n();
  const [mode, setMode] = useState(initialRoomCode ? 'join' : null);
  const [userName, setUserName] = useState(() => localStorage.getItem('watch10-user-name') || '');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!userName.trim()) return;
    localStorage.setItem('watch10-user-name', userName.trim());
    setLoading(true);
    await onCreateRoom(null, userName.trim());
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!userName.trim() || !roomCode.trim()) return;
    localStorage.setItem('watch10-user-name', userName.trim());
    setLoading(true);
    await onJoinRoom(roomCode.trim().toUpperCase(), userName.trim());
    setLoading(false);
  };

  if (!isConfigured) {
    return (
      <div className="room-lobby">
        <div className="room-lobby__card">
          <button className="room-lobby__close" onClick={onClose}>{'\u2715'}</button>
          <h2 className="room-lobby__title">{t('room.title')}</h2>
          <div className="room-lobby__setup">
            <p>{t('room.firebaseRequired')}</p>
            <ol>
              <li>{t('room.setupStep1')}</li>
              <li>{t('room.setupStep2')}</li>
              <li>{t('room.setupStep3')}</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-lobby">
      <div className="room-lobby__card">
        <button className="room-lobby__close" onClick={onClose}>{'\u2715'}</button>
        <h2 className="room-lobby__title">{t('room.title')}</h2>
        <p className="room-lobby__subtitle">{t('room.subtitle')}</p>

        {error && <p className="room-lobby__error">{error}</p>}

        {!mode && (
          <div className="room-lobby__choices">
            <button className="room-lobby__choice" onClick={() => setMode('create')}>
              <span className="room-lobby__choice-icon">{'\uD83C\uDFAC'}</span>
              <span className="room-lobby__choice-text">{t('room.createRoom')}</span>
              <span className="room-lobby__choice-desc">{t('room.createDesc')}</span>
            </button>
            <button className="room-lobby__choice" onClick={() => setMode('join')}>
              <span className="room-lobby__choice-icon">{'\uD83D\uDD17'}</span>
              <span className="room-lobby__choice-text">{t('room.joinRoom')}</span>
              <span className="room-lobby__choice-desc">{t('room.joinDesc')}</span>
            </button>
          </div>
        )}

        {mode && (
          <div className="room-lobby__form">
            <button className="room-lobby__back" onClick={() => setMode(null)}>
              {'\u2190'} {t('playlist.back')}
            </button>

            <label className="room-lobby__label">{t('room.yourName')}</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder={t('room.namePlaceholder')}
              className="room-lobby__input"
              maxLength={20}
              autoFocus={!initialRoomCode}
            />

            {mode === 'join' && (
              <>
                <label className="room-lobby__label">{t('room.code')}</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="room-lobby__input room-lobby__input--code"
                  maxLength={6}
                  autoFocus={!!initialRoomCode}
                />
              </>
            )}

            <button
              className="room-lobby__submit"
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading || !userName.trim() || (mode === 'join' && roomCode.trim().length < 4)}
            >
              {loading ? '...' : mode === 'create' ? t('room.createRoom') : t('room.joinRoom')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
