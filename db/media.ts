import type { SQLiteBindValue } from 'expo-sqlite';

import type { MediaItem, MediaType } from '@/lib/types';
import { initDatabase } from './client';

type MediaRow = {
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
};

function rowToMedia(row: MediaRow): MediaItem {
  return {
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
  };
}

function mediaToParams(item: MediaItem): SQLiteBindValue[] {
  return [
    item.id,
    item.mediaType,
    item.title,
    item.artist || null,
    item.album || null,
    Math.round(item.duration),
    item.uri,
    item.artwork,
    item.thumbnail,
    item.albumId,
    item.folder,
    item.fileName || null,
    item.year,
    item.genre,
    item.size,
    item.addedAt,
    item.modifiedAt,
  ];
}

const COLUMNS =
  'id, mediaType, title, artist, album, duration, uri, artwork, thumbnail, albumId, folder, fileName, year, genre, size, addedAt, modifiedAt';

const PLACEHOLDERS = '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

export async function saveMedia(items: MediaItem[]): Promise<void> {
  if (items.length === 0) return;
  const db = await initDatabase();
  const insert = `INSERT OR REPLACE INTO media (${COLUMNS}) VALUES ${PLACEHOLDERS}`;
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(insert, mediaToParams(item));
    }
  });
}

export async function getTracks(): Promise<MediaItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<MediaRow>(
    `SELECT ${COLUMNS} FROM media WHERE mediaType = 'audio' ORDER BY title COLLATE NOCASE ASC`,
  );
  return rows.map(rowToMedia);
}

export async function getVideos(): Promise<MediaItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<MediaRow>(
    `SELECT ${COLUMNS} FROM media WHERE mediaType = 'video' ORDER BY title COLLATE NOCASE ASC`,
  );
  return rows.map(rowToMedia);
}

export async function getAllMedia(): Promise<MediaItem[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<MediaRow>(
    `SELECT ${COLUMNS} FROM media ORDER BY title COLLATE NOCASE ASC`,
  );
  return rows.map(rowToMedia);
}

export async function getMediaById(id: string): Promise<MediaItem | null> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<MediaRow>(
    `SELECT ${COLUMNS} FROM media WHERE id = ?`,
    [id],
  );
  return row ? rowToMedia(row) : null;
}

export async function getMediaByIds(ids: string[]): Promise<MediaItem[]> {
  if (ids.length === 0) return [];
  const db = await initDatabase();
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<MediaRow>(
    `SELECT ${COLUMNS} FROM media WHERE id IN (${placeholders})`,
    ids,
  );
  const byId = new Map(rows.map((row) => [row.id, rowToMedia(row)]));
  return ids.map((id) => byId.get(id)).filter((item): item is MediaItem => Boolean(item));
}

export async function searchMedia(query: string): Promise<{ tracks: MediaItem[]; videos: MediaItem[] }> {
  const trimmed = query.trim();
  if (!trimmed) return { tracks: [], videos: [] };
  const db = await initDatabase();
  const like = `%${trimmed}%`;
  const rows = await db.getAllAsync<MediaRow>(
    `SELECT ${COLUMNS} FROM media
     WHERE title LIKE ? COLLATE NOCASE
        OR artist LIKE ? COLLATE NOCASE
        OR album LIKE ? COLLATE NOCASE
     ORDER BY title COLLATE NOCASE ASC`,
    [like, like, like],
  );
  const media = rows.map(rowToMedia);
  return {
    tracks: media.filter((item) => item.mediaType === 'audio'),
    videos: media.filter((item) => item.mediaType === 'video'),
  };
}

export async function removeMissingMedia(
  mediaType: MediaType,
  existingIds: string[],
): Promise<void> {
  const db = await initDatabase();
  if (existingIds.length === 0) {
    await db.runAsync(`DELETE FROM media WHERE mediaType = ?`, [mediaType]);
    return;
  }
  const placeholders = existingIds.map(() => '?').join(', ');
  await db.runAsync(
    `DELETE FROM media WHERE mediaType = ? AND id NOT IN (${placeholders})`,
    [mediaType, ...existingIds],
  );
}

export async function countMedia(): Promise<{ audio: number; video: number }> {
  const db = await initDatabase();
  const audio = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM media WHERE mediaType = 'audio'`,
  );
  const video = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM media WHERE mediaType = 'video'`,
  );
  return { audio: audio?.count ?? 0, video: video?.count ?? 0 };
}