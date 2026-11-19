import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'mediaplayer.db';
const CURRENT_VERSION = 1;

let dbPromise: Promise<SQLiteDatabase> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY NOT NULL,
  mediaType TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  uri TEXT NOT NULL,
  artwork TEXT,
  thumbnail TEXT,
  albumId TEXT,
  folder TEXT,
  fileName TEXT,
  year INTEGER,
  genre TEXT,
  size INTEGER,
  addedAt INTEGER NOT NULL DEFAULT 0,
  modifiedAt INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(mediaType);
CREATE INDEX IF NOT EXISTS idx_media_album ON media(albumId);
CREATE INDEX IF NOT EXISTS idx_media_artist ON media(artist);
CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);

CREATE TABLE IF NOT EXISTS playlists (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS playlist_items (
  playlistId TEXT NOT NULL,
  mediaId TEXT NOT NULL,
  position INTEGER NOT NULL,
  addedAt INTEGER NOT NULL,
  PRIMARY KEY (playlistId, mediaId)
);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlistId);

CREATE TABLE IF NOT EXISTS favorites (
  mediaId TEXT PRIMARY KEY NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS playback_history (
  mediaId TEXT PRIMARY KEY NOT NULL,
  mediaType TEXT NOT NULL,
  playedAt INTEGER NOT NULL,
  playCount INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_history_played ON playback_history(playedAt DESC);

CREATE TABLE IF NOT EXISTS playback_positions (
  mediaId TEXT PRIMARY KEY NOT NULL,
  positionMs INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= CURRENT_VERSION) return;

  await db.execAsync(SCHEMA);
  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION}`);
}

export function initDatabase(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = openDatabaseSync(DB_NAME);
      await runMigrations(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function resetDatabase(): Promise<void> {
  const db = await initDatabase();
  await db.execAsync(`
    DROP TABLE IF EXISTS playlist_items;
    DROP TABLE IF EXISTS playlists;
    DROP TABLE IF EXISTS favorites;
    DROP TABLE IF EXISTS playback_history;
    DROP TABLE IF EXISTS playback_positions;
    DROP TABLE IF EXISTS settings;
    DROP TABLE IF EXISTS media;
  `);
  await db.execAsync(SCHEMA);
}