import { initDatabase } from './client';

export async function getFavoriteIds(): Promise<string[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<{ mediaId: string }>(
    'SELECT mediaId FROM favorites ORDER BY createdAt DESC',
  );
  return rows.map((row) => row.mediaId);
}

export async function addFavorite(mediaId: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO favorites (mediaId, createdAt) VALUES (?, ?)',
    [mediaId, Date.now()],
  );
}

export async function removeFavorite(mediaId: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM favorites WHERE mediaId = ?', [mediaId]);
}

export async function clearFavorites(): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM favorites');
}