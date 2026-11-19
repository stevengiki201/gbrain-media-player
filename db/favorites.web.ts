import { commit, getDb } from './web-store';

export async function getFavoriteIds(): Promise<string[]> {
  return getDb()
    .favorites.slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((row) => row.mediaId);
}

export async function addFavorite(mediaId: string): Promise<void> {
  const db = getDb();
  const existing = db.favorites.find((row) => row.mediaId === mediaId);
  if (existing) {
    existing.createdAt = Date.now();
  } else {
    db.favorites.push({ mediaId, createdAt: Date.now() });
  }
  commit();
}

export async function removeFavorite(mediaId: string): Promise<void> {
  const db = getDb();
  db.favorites = db.favorites.filter((row) => row.mediaId !== mediaId);
  commit();
}

export async function clearFavorites(): Promise<void> {
  const db = getDb();
  db.favorites = [];
  commit();
}