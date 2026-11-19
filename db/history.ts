import type { MediaItem, MediaType } from '@/lib/types';
import { initDatabase } from './client';

type HistoryRow = {
  mediaId: string;
  mediaType: string;
  playedAt: number;
  playCount: number;
};

export type RecentEntry = {
  item: MediaItem;
  playedAt: number;
  playCount: number;
};

export async function recordPlay(
  mediaId: string,
  mediaType: MediaType,
): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    `INSERT INTO playback_history (mediaId, mediaType, playedAt, playCount)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(mediaId) DO UPDATE SET
       playedAt = excluded.playedAt,
       playCount = playCount + 1`,
    [mediaId, mediaType, Date.now()],
  );
}

export async function listRecent(limit = 30): Promise<RecentEntry[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<HistoryRow>(
    'SELECT mediaId, mediaType, playedAt, playCount FROM playback_history ORDER BY playedAt DESC LIMIT ?',
    [limit],
  );
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.mediaId);
  const placeholders = ids.map(() => '?').join(', ');
  const mediaRows = await db.getAllAsync<{
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
    `SELECT id, mediaType, title, artist, album, duration, uri, artwork, thumbnail, albumId, folder, fileName, year, genre, size, addedAt, modifiedAt
     FROM media WHERE id IN (${placeholders})`,
    ids,
  );

  const byId = new Map(mediaRows.map((row) => [row.id, row]));
  const entries: RecentEntry[] = [];
  for (const row of rows) {
    const media = byId.get(row.mediaId);
    if (!media) continue;
    entries.push({
      item: {
        id: media.id,
        mediaType: media.mediaType === 'video' ? 'video' : 'audio',
        title: media.title,
        artist: media.artist ?? '',
        album: media.album ?? '',
        duration: media.duration ?? 0,
        uri: media.uri,
        artwork: media.artwork,
        thumbnail: media.thumbnail,
        albumId: media.albumId,
        folder: media.folder,
        fileName: media.fileName ?? '',
        year: media.year,
        genre: media.genre,
        size: media.size,
        addedAt: media.addedAt ?? 0,
        modifiedAt: media.modifiedAt ?? 0,
      },
      playedAt: row.playedAt,
      playCount: row.playCount,
    });
  }
  return entries;
}

export async function clearHistory(): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM playback_history');
}

export async function getPosition(mediaId: string): Promise<number> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<{ positionMs: number }>(
    'SELECT positionMs FROM playback_positions WHERE mediaId = ?',
    [mediaId],
  );
  return row?.positionMs ?? 0;
}

export async function setPosition(mediaId: string, positionMs: number): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    `INSERT INTO playback_positions (mediaId, positionMs, updatedAt)
     VALUES (?, ?, ?)
     ON CONFLICT(mediaId) DO UPDATE SET
       positionMs = excluded.positionMs,
       updatedAt = excluded.updatedAt`,
    [mediaId, Math.max(0, Math.round(positionMs)), Date.now()],
  );
}

export async function getAllPositions(): Promise<Record<string, number>> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<{ mediaId: string; positionMs: number }>(
    'SELECT mediaId, positionMs FROM playback_positions',
  );
  const map: Record<string, number> = {};
  for (const row of rows) map[row.mediaId] = row.positionMs;
  return map;
}

export async function clearPositions(): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM playback_positions');
}