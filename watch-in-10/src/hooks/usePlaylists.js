import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export function usePlaylists() {
  const [playlists, setPlaylists] = useLocalStorage('watch10-playlists', []);

  const createPlaylist = useCallback(
    (name) => {
      const id = `pl-${Date.now()}`;
      setPlaylists((prev) => [...prev, { id, name, videos: [], createdAt: Date.now() }]);
      return id;
    },
    [setPlaylists]
  );

  const deletePlaylist = useCallback(
    (playlistId) => {
      setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    },
    [setPlaylists]
  );

  const addToPlaylist = useCallback(
    (playlistId, video) => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          if (p.videos.some((v) => v.id === video.id)) return p;
          return { ...p, videos: [...p.videos, video] };
        })
      );
    },
    [setPlaylists]
  );

  const removeFromPlaylist = useCallback(
    (playlistId, videoId) => {
      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id !== playlistId) return p;
          return { ...p, videos: p.videos.filter((v) => v.id !== videoId) };
        })
      );
    },
    [setPlaylists]
  );

  const renamePlaylist = useCallback(
    (playlistId, newName) => {
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlistId ? { ...p, name: newName } : p))
      );
    },
    [setPlaylists]
  );

  return { playlists, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, renamePlaylist };
}
