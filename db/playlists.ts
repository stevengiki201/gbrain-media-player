import type { MediaItem, Playlist, PlaylistItem } from '@/lib/types';
import { genId } from '@/lib/id';
import { initDatabase } from './client';

type PlaylistRow = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

type PlaylistItemRow = {
  playlistId: string;
  mediaId: string;
  position: number;
  addedAt: number;
};

function toPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listPlaylists(): Promise<Playlist[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<PlaylistRow>(
    'SELECT id, name, createdAt, updatedAt FROM playlists ORDER BY updatedAt DESC',
  );
  return rows.map(toPlaylist);
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const db = await initDatabase();
  const now = Date.now();
  const playlist: Playlist = {
    id: genId('pl_'),
    name: name.trim() || 'New Playlist',
    createdAt: now,
    updatedAt: now,
  };
  await db.runAsync(
    'INSERT INTO playlists (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
    [playlist.id, playlist.name, playlist.createdAt, playlist.updatedAt],
  );
  return playlist;
}

export async function renamePlaylist(id: string, name: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('UPDATE playlists SET name = ?, updatedAt = ? WHERE id = ?', [
    name.trim() || 'Untitled',
    Date.now(),
    id,
  ]);
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await initDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM playlist_items WHERE playlistId = ?', [id]);
    await db.runAsync('DELETE FROM playlists WHERE id = ?', [id]);
  });
}

export async function getPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<PlaylistItemRow>(
    'SELECT playlistId, mediaId, position, addedAt FROM playlist_items WHERE playlistId = ? ORDER BY position ASC',
    [playlistId],
  );
  return rows.map((row) => ({
    playlistId: row.playlistId,
    mediaId: row.mediaId,
    position: row.position,
    addedAt: row.addedAt,
  }));
}

export async function addPlaylistItem(
  playlistId: string,
  mediaId: string,
): Promise<void> {
  const db = await initDatabase();
  const positionRow = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(position) + 1, 0) AS next FROM playlist_items WHERE playlistId = ?',
    [playlistId],
  );
  const position = positionRow?.next ?? 0;
  await db.runAsync(
    'INSERT OR REPLACE INTO playlist_items (playlistId, mediaId, position, addedAt) VALUES (?, ?, ?, ?)',
    [playlistId, mediaId, position, Date.now()],
  );
  await db.runAsync('UPDATE playlists SET updatedAt = ? WHERE id = ?', [
    Date.now(),
    playlistId,
  ]);
}

export async function removePlaylistItem(
  playlistId: string,
  mediaId: string,
): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'DELETE FROM playlist_items WHERE playlistId = ? AND mediaId = ?',
    [playlistId, mediaId],
  );
  await db.runAsync('UPDATE playlists SET updatedAt = ? WHERE id = ?', [
    Date.now(),
    playlistId,
  ]);
}

export async function reorderPlaylistItems(
  playlistId: string,
  orderedMediaIds: string[],
): Promise<void> {
  const db = await initDatabase();
  await db.withTransactionAsync(async () => {
    for (let i = 0; i < orderedMediaIds.length; i += 1) {
      await db.runAsync(
        'UPDATE playlist_items SET position = ? WHERE playlistId = ? AND mediaId = ?',
        [i, playlistId, orderedMediaIds[i]],
      );
    }
    await db.runAsync('UPDATE playlists SET updatedAt = ? WHERE id = ?', [
      Date.now(),
      playlistId,
    ]);
  });
}

export async function getAllPlaylistItems(): Promise<PlaylistItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<PlaylistItemRow>(
    'SELECT playlistId, mediaId, position, addedAt FROM playlist_items ORDER BY playlistId ASC, position ASC',
  );
  return rows.map((row) => ({
    playlistId: row.playlistId,
    mediaId: row.mediaId,
    position: row.position,
    addedAt: row.addedAt,
  }));
}

export async function getPlaylistTracks(playlistId: string): Promise<MediaItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    mediaType: string;
    title: string;
    artist: string | null;
    album: string | null;
    duration: number | null;
    uri: string;
    artwork: string | null;
    thumbnail: string | null;
    albumId: string | null;
    folder: string | null;
    fileName: string | null;
    year: number | null;
    genre: string | null;
    size: number | null;
    addedAt: number | null;
    modifiedAt: number | null;
  }>(
    `SELECT m.* FROM media m
     JOIN playlist_items pi ON pi.mediaId = m.id
     WHERE pi.playlistId = ?
     ORDER BY pi.position ASC`,
    [playlistId],
  );
  return rows.map((row) => ({
    id: row.id,
    mediaType: row.mediaType === 'video' ? 'video' : 'audio',
    title: row.title,
    artist: row.artist ?? '',
    album: row.album ?? '',
    duration: row.duration ?? 0,
    uri: row.uri,
    artwork: row.artwork,
    thumbnail: row.thumbnail,
    albumId: row.albumId,
    folder: row.folder,
    fileName: row.fileName ?? '',
    year: row.year,
    genre: row.genre,
    size: row.size,
    addedAt: row.addedAt ?? 0,
    modifiedAt: row.modifiedAt ?? 0,
  }));
}