import { useState, useEffect, useCallback, useRef } from 'react';
import { isFirebaseConfigured, getFirebaseApp, getFirebaseDB } from '../config/firebase';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { ref, set, get, onValue, off } from 'firebase/database';

const SYNC_KEYS = ['watch10-favorites', 'watch10-history', 'watch10-playlists'];
const DEBOUNCE_MS = 2000;

export function useCloudSync() {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [userId, setUserId] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const debounceRef = useRef(null);
  const listeningRef = useRef(false);
  const suppressRemoteRef = useRef(false);

  // Initialize anonymous auth
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const app = getFirebaseApp();
    if (!app) return;

    let unsubAuth;
    try {
      const auth = getAuth(app);
      unsubAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserId(user.uid);
          setSyncEnabled(true);
        }
      });

      signInAnonymously(auth).catch(() => {
        // Auth not enabled — sync stays disabled, app works fine without it
      });
    } catch {
      // firebase/auth not available
    }

    return () => unsubAuth?.();
  }, []);

  // Listen for remote changes and merge into localStorage
  useEffect(() => {
    if (!syncEnabled || !userId) return;
    const db = getFirebaseDB();
    if (!db) return;

    const userRef = ref(db, `userData/${userId}`);
    listeningRef.current = true;

    const handler = onValue(userRef, (snapshot) => {
      if (suppressRemoteRef.current) return;
      if (!snapshot.exists()) return;

      const remoteData = snapshot.val();
      for (const key of SYNC_KEYS) {
        if (remoteData[key]) {
          try {
            const remote = JSON.parse(remoteData[key]);
            const local = JSON.parse(localStorage.getItem(key) || '[]');

            // Merge: remote wins for newer items, keep both unique items
            const merged = mergeArrays(local, remote, key);
            localStorage.setItem(key, JSON.stringify(merged));

            // Dispatch storage event so useLocalStorage hooks pick up the change
            window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(merged) }));
          } catch { /* ignore parse errors */ }
        }
      }
    });

    return () => {
      listeningRef.current = false;
      off(userRef);
    };
  }, [syncEnabled, userId]);

  // Push local changes to Firebase (debounced)
  const pushToCloud = useCallback(() => {
    if (!syncEnabled || !userId) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const db = getFirebaseDB();
      if (!db) return;

      setSyncing(true);
      suppressRemoteRef.current = true;

      const data = {};
      for (const key of SYNC_KEYS) {
        data[key] = localStorage.getItem(key) || '[]';
      }
      data.lastSyncAt = Date.now();

      try {
        await set(ref(db, `userData/${userId}`), data);
      } catch { /* ignore write errors */ }

      setSyncing(false);
      setTimeout(() => { suppressRemoteRef.current = false; }, 500);
    }, DEBOUNCE_MS);
  }, [syncEnabled, userId]);

  // Listen for localStorage changes to auto-push
  useEffect(() => {
    if (!syncEnabled) return;

    const handleStorage = (e) => {
      if (SYNC_KEYS.includes(e.key)) {
        pushToCloud();
      }
    };

    // Also watch for changes from same tab (useLocalStorage doesn't fire StorageEvent in same tab)
    const origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      origSetItem(key, value);
      if (SYNC_KEYS.includes(key)) {
        pushToCloud();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      localStorage.setItem = origSetItem;
    };
  }, [syncEnabled, pushToCloud]);

  // Initial push on first auth
  useEffect(() => {
    if (syncEnabled && userId) {
      pushToCloud();
    }
  }, [syncEnabled, userId]);

  return { syncEnabled, syncing, userId };
}

/**
 * Merge two arrays of objects by id, preferring newer timestamps.
 */
function mergeArrays(local, remote, key) {
  if (!Array.isArray(local) || !Array.isArray(remote)) return remote || local || [];

  const map = new Map();
  const tsKey = key.includes('history') ? 'watchedAt' : key.includes('favorites') ? 'savedAt' : 'createdAt';

  for (const item of local) {
    if (item.id) map.set(item.id, item);
  }
  for (const item of remote) {
    if (!item.id) continue;
    const existing = map.get(item.id);
    if (!existing || (item[tsKey] || 0) > (existing[tsKey] || 0)) {
      map.set(item.id, item);
    }
  }

  const result = [...map.values()];
  // Sort by timestamp descending
  result.sort((a, b) => (b[tsKey] || 0) - (a[tsKey] || 0));

  // Limit history to 50 items
  if (key.includes('history')) return result.slice(0, 50);
  return result;
}
