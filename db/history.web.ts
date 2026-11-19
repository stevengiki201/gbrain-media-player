import type { MediaItem, MediaType } from '@/lib/types';
import { commit, getDb } from './web-store';

export type RecentEntry = {
  item: MediaItem;
  playedAt: number;
  playCount: number;
};

export async function recordPlay(
  mediaId: string,
  mediaType: MediaType,
): Promise<void> {
  const db = getDb();
  const existing = db.history.find((row) => row.mediaId === mediaId);
  if (existing) {
    existing.playedAt = Date.now();
    existing.playCount += 1;
  } else {
    db.history.push({ mediaId, mediaType, playedAt: Date.now(), playCount: 1 });
  }
  commit();
}

export async function listRecent(limit = 30): Promise<RecentEntry[]> {
  const db = getDb();
  const byId = new Map(db.media.map((item) => [item.id, item] as const));
  const rows = db.history
    .slice()
    .sort((a, b) => b.playedAt - a.playedAt)
    .slice(0, limit);
  const entries: RecentEntry[] = [];
  for (const row of rows) {
    const media = byId.get(row.mediaId);
    if (!media) continue;
    entries.push({ item: media, playedAt: row.playedAt, playCount: row.playCount });
  }
  return entries;
}

export async function clearHistory(): Promise<void> {
  const db = getDb();
  db.history = [];
  commit();
}

export async function getPosition(mediaId: string): Promise<number> {
  return getDb().positions[mediaId] ?? 0;
}

export async function setPosition(mediaId: string, positionMs: number): Promise<void> {
  const db = getDb();
  db.positions[mediaId] = Math.max(0, Math.round(positionMs));
  commit();
}

export async function getAllPositions(): Promise<Record<string, number>> {
  return { ...getDb().positions };
}

export async function clearPositions(): Promise<void> {
  const db = getDb();
  db.positions = {};
  commit();
}