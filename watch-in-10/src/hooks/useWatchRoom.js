import { useState, useEffect, useCallback, useRef } from 'react';
import { getFirebaseDB, isFirebaseConfigured } from '../config/firebase';
import { ref, set, push, onValue, off, remove, onDisconnect, get } from 'firebase/database';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getUserId() {
  let id = localStorage.getItem('watch10-user-id');
  if (!id) {
    id = 'u' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('watch10-user-id', id);
  }
  return id;
}

function pickVideo(video) {
  if (!video) return null;
  return {
    id: video.id,
    title: video.title,
    channel: video.channel,
    thumbnail: video.thumbnail,
    url: video.url,
    durationSeconds: video.durationSeconds,
  };
}

export function useWatchRoom() {
  const [roomId, setRoomId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState({});
  const [reactions, setReactions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const uid = useRef(getUserId());
  const configured = isFirebaseConfigured();

  const createRoom = useCallback(async (video = null, userName = 'Guest') => {
    if (!configured) { setError('Firebase not configured'); return null; }
    const db = getFirebaseDB();
    const code = generateCode();
    const id = uid.current;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    await set(ref(db, `rooms/${code}`), {
      host: id,
      video: pickVideo(video),
      state: { playing: false, currentTime: 0, updatedAt: Date.now(), updatedBy: id },
      createdAt: Date.now(),
    });

    const pRef = ref(db, `rooms/${code}/participants/${id}`);
    await set(pRef, { name: userName, color, joinedAt: Date.now() });
    onDisconnect(pRef).remove();

    localStorage.setItem('watch10-room-code', code);
    localStorage.setItem('watch10-room-host', '1');
    setRoomId(code);
    setIsHost(true);
    setError(null);
    return code;
  }, [configured]);

  const joinRoom = useCallback(async (code, userName = 'Guest') => {
    if (!configured) { setError('Firebase not configured'); return false; }
    const db = getFirebaseDB();

    const snapshot = await get(ref(db, `rooms/${code}`));
    if (!snapshot.exists()) { setError('Room not found'); return false; }

    const data = snapshot.val();
    const id = uid.current;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    const pRef = ref(db, `rooms/${code}/participants/${id}`);
    await set(pRef, { name: userName, color, joinedAt: Date.now() });
    onDisconnect(pRef).remove();

    localStorage.setItem('watch10-room-code', code);
    localStorage.setItem('watch10-room-host', data.host === id ? '1' : '0');
    setRoomId(code);
    setIsHost(data.host === id);
    setError(null);
    return true;
  }, [configured]);

  const leaveRoom = useCallback(async () => {
    if (!configured || !roomId) return;
    const db = getFirebaseDB();
    const id = uid.current;

    try {
      await remove(ref(db, `rooms/${roomId}/participants/${id}`));
      if (isHost) {
        await remove(ref(db, `rooms/${roomId}`));
      }
    } catch (e) { /* ignore cleanup errors */ }

    localStorage.removeItem('watch10-room-code');
    localStorage.removeItem('watch10-room-host');
    setRoomId(null);
    setRoomData(null);
    setIsHost(false);
    setParticipants({});
    setReactions([]);
    setMessages([]);
    setError(null);
  }, [configured, roomId, isHost]);

  const setVideo = useCallback(async (video) => {
    if (!configured || !roomId) return;
    if (!isHost && !roomData?.sharedControl) return;
    const db = getFirebaseDB();
    const id = uid.current;
    await set(ref(db, `rooms/${roomId}/video`), pickVideo(video));
    await set(ref(db, `rooms/${roomId}/state`), {
      playing: false, currentTime: 0, updatedAt: Date.now(), updatedBy: id,
    });
  }, [configured, roomId, isHost, roomData?.sharedControl]);

  const syncPlayback = useCallback(async (playing, currentTime) => {
    if (!configured || !roomId) return;
    const db = getFirebaseDB();
    await set(ref(db, `rooms/${roomId}/state`), {
      playing, currentTime, updatedAt: Date.now(), updatedBy: uid.current,
    });
  }, [configured, roomId]);

  const toggleSharedControl = useCallback(async () => {
    if (!configured || !roomId || !isHost) return;
    const db = getFirebaseDB();
    const current = roomData?.sharedControl || false;
    await set(ref(db, `rooms/${roomId}/sharedControl`), !current);
  }, [configured, roomId, isHost, roomData?.sharedControl]);

  const setMeetLink = useCallback(async (link) => {
    if (!configured || !roomId || !isHost) return;
    const db = getFirebaseDB();
    await set(ref(db, `rooms/${roomId}/meetLink`), link || null);
  }, [configured, roomId, isHost]);

  const clearMeetLink = useCallback(async () => {
    if (!configured || !roomId || !isHost) return;
    const db = getFirebaseDB();
    await remove(ref(db, `rooms/${roomId}/meetLink`));
  }, [configured, roomId, isHost]);

  const sendReaction = useCallback(async (emoji) => {
    if (!configured || !roomId) return;
    const db = getFirebaseDB();
    const name = localStorage.getItem('watch10-user-name') || 'Guest';
    await push(ref(db, `rooms/${roomId}/reactions`), {
      emoji, userId: uid.current, name, timestamp: Date.now(),
    });
  }, [configured, roomId]);

  const sendMessage = useCallback(async (text) => {
    if (!configured || !roomId || !text.trim()) return;
    const db = getFirebaseDB();
    const name = localStorage.getItem('watch10-user-name') || 'Guest';
    await push(ref(db, `rooms/${roomId}/messages`), {
      text: text.trim(), userId: uid.current, name, timestamp: Date.now(),
    });
  }, [configured, roomId]);

  // Auto-rejoin room on mount if stored session exists
  const rejoinRoom = useCallback(async (code) => {
    if (!configured) return false;
    const userName = localStorage.getItem('watch10-user-name') || 'Guest';
    return joinRoom(code, userName);
  }, [configured, joinRoom]);

  // Listen to room data
  useEffect(() => {
    if (!configured || !roomId) return;
    const db = getFirebaseDB();
    const roomRef = ref(db, `rooms/${roomId}`);

    const handler = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        localStorage.removeItem('watch10-room-code');
        localStorage.removeItem('watch10-room-host');
        setRoomId(null);
        setRoomData(null);
        setIsHost(false);
        setParticipants({});
        setReactions([]);
        setMessages([]);
        return;
      }
      const data = snapshot.val();
      setRoomData(data);
      setParticipants(data.participants || {});

      const now = Date.now();
      const reactionList = Object.entries(data.reactions || {})
        .map(([key, val]) => ({ key, ...val }))
        .filter((r) => now - r.timestamp < 4000);
      setReactions(reactionList);

      const messageList = Object.entries(data.messages || {})
        .map(([key, val]) => ({ key, ...val }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setMessages(messageList);
    });

    return () => off(roomRef);
  }, [configured, roomId]);

  // Host cleans old reactions periodically
  useEffect(() => {
    if (!configured || !roomId || !isHost) return;
    const db = getFirebaseDB();
    const interval = setInterval(async () => {
      try {
        const snapshot = await get(ref(db, `rooms/${roomId}/reactions`));
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        const now = Date.now();
        for (const [key, val] of Object.entries(data)) {
          if (now - val.timestamp > 10000) {
            await remove(ref(db, `rooms/${roomId}/reactions/${key}`));
          }
        }
      } catch (e) { /* ignore */ }
    }, 10000);
    return () => clearInterval(interval);
  }, [configured, roomId, isHost]);

  return {
    roomId, roomData, isHost, participants, reactions, messages, error,
    userId: uid.current, configured,
    createRoom, joinRoom, rejoinRoom, leaveRoom, setVideo, syncPlayback, toggleSharedControl, sendReaction, sendMessage, setMeetLink, clearMeetLink,
  };
}
