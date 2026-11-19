import type { MediaItem, MediaType } from '@/lib/types';
import { commit, getDb } from './web-store';

function byTitle(a: MediaItem, b: MediaItem): number {
  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
}

export async function saveMedia(items: MediaItem[]): Promise<void> {
  if (items.length === 0) return;
  const db = getDb();
  const map = new Map(db.media.map((item) => [item.id, item] as const));
  for (const item of items) map.set(item.id, item);
  db.media = [...map.values()];
  commit();
}

export async function getTracks(): Promise<MediaItem[]> {
  return getDb()
    .media.filter((item) => item.mediaType === 'audio')
    .sort(byTitle);
}

export async function getVideos(): Promise<MediaItem[]> {
  return getDb()
    .media.filter((item) => item.mediaType === 'video')
    .sort(byTitle);
}

export async function getAllMedia(): Promise<MediaItem[]> {
  return [...getDb().media].sort(byTitle);
}

export async function getMediaById(id: string): Promise<MediaItem | null> {
  return getDb().media.find((item) => item.id === id) ?? null;
}

export async function getMediaByIds(ids: string[]): Promise<MediaItem[]> {
  if (ids.length === 0) return [];
  const byId = new Map(getDb().media.map((item) => [item.id, item] as const));
  return ids
    .map((id) => byId.get(id))
    .filter((item): item is MediaItem => Boolean(item));
}

export async function searchMedia(
  query: string,
): Promise<{ tracks: MediaItem[]; videos: MediaItem[] }> {
  const needle = query.trim().toLowerCase();
  if (!needle) return { tracks: [], videos: [] };
  const media = getDb()
    .media.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.artist.toLowerCase().includes(needle) ||
        item.album.toLowerCase().includes(needle),
    )
    .sort(byTitle);
  return {
    tracks: media.filter((item) => item.mediaType === 'audio'),
    videos: media.filter((item) => item.mediaType === 'video'),
  };
}

export async function removeMissingMedia(
  mediaType: MediaType,
  existingIds: string[],
): Promise<void> {
  const db = getDb();
  if (existingIds.length === 0) {
    db.media = db.media.filter((item) => item.mediaType !== mediaType);
    commit();
    return;
  }
  const keep = new Set(existingIds);
  db.media = db.media.filter(
    (item) => item.mediaType !== mediaType || keep.has(item.id),
  );
  commit();
}

export async function countMedia(): Promise<{ audio: number; video: number }> {
  let audio = 0;
  let video = 0;
  for (const item of getDb().media) {
    if (item.mediaType === 'audio') audio += 1;
    else video += 1;
  }
  return { audio, video };
}