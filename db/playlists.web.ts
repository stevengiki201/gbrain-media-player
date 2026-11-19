import { genId } from '@/lib/id';
import type { MediaItem, Playlist, PlaylistItem } from '@/lib/types';
import { commit, getDb } from './web-store';

export async function listPlaylists(): Promise<Playlist[]> {
  return getDb()
    .playlists.slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((playlist) => ({ ...playlist }));
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const db = getDb();
  const now = Date.now();
  const playlist: Playlist = {
    id: genId('pl_'),
    name: name.trim() || 'New Playlist',
    createdAt: now,
    updatedAt: now,
  };
  db.playlists.push(playlist);
  commit();
  return playlist;
}

export async function renamePlaylist(id: string, name: string): Promise<void> {
  const db = getDb();
  const playlist = db.playlists.find((item) => item.id === id);
  if (!playlist) return;
  playlist.name = name.trim() || 'Untitled';
  playlist.updatedAt = Date.now();
  commit();
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = getDb();
  db.playlists = db.playlists.filter((item) => item.id !== id);
  db.playlistItems = db.playlistItems.filter((item) => item.playlistId !== id);
  commit();
}

export async function getPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  return getDb()
    .playlistItems.filter((item) => item.playlistId === playlistId)
    .sort((a, b) => a.position - b.position)
    .map((item) => ({ ...item }));
}

export async function addPlaylistItem(
  playlistId: string,
  mediaId: string,
): Promise<void> {
  const db = getDb();
  const maxPos = db.playlistItems
    .filter((item) => item.playlistId === playlistId)
    .reduce((max, item) => Math.max(max, item.position), -1);
  db.playlistItems = db.playlistItems.filter(
    (item) => !(item.playlistId === playlistId && item.mediaId === mediaId),
  );
  db.playlistItems.push({
    playlistId,
    mediaId,
    position: maxPos + 1,
    addedAt: Date.now(),
  });
  const playlist = db.playlists.find((item) => item.id === playlistId);
  if (playlist) playlist.updatedAt = Date.now();
  commit();
}

export async function removePlaylistItem(
  playlistId: string,
  mediaId: string,
): Promise<void> {
  const db = getDb();
  db.playlistItems = db.playlistItems.filter(
    (item) => !(item.playlistId === playlistId && item.mediaId === mediaId),
  );
  const playlist = db.playlists.find((item) => item.id === playlistId);
  if (playlist) playlist.updatedAt = Date.now();
  commit();
}

export async function reorderPlaylistItems(
  playlistId: string,
  orderedMediaIds: string[],
): Promise<void> {
  const db = getDb();
  const positions = new Map(orderedMediaIds.map((id, index) => [id, index] as const));
  for (const item of db.playlistItems) {
    if (item.playlistId !== playlistId) continue;
    const next = positions.get(item.mediaId);
    if (next != null) item.position = next;
  }
  const playlist = db.playlists.find((item) => item.id === playlistId);
  if (playlist) playlist.updatedAt = Date.now();
  commit();
}

export async function getAllPlaylistItems(): Promise<PlaylistItem[]> {
  return getDb()
    .playlistItems.slice()
    .sort(
      (a, b) => a.playlistId.localeCompare(b.playlistId) || a.position - b.position,
    )
    .map((item) => ({ ...item }));
}

export async function getPlaylistTracks(playlistId: string): Promise<MediaItem[]> {
  const byId = new Map(getDb().media.map((item) => [item.id, item] as const));
  return getDb()
    .playlistItems.filter((item) => item.playlistId === playlistId)
    .sort((a, b) => a.position - b.position)
    .map((item) => byId.get(item.mediaId))
    .filter((item): item is MediaItem => Boolean(item));
}