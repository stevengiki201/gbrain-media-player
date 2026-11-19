import type { MediaItem, MediaType, Playlist, PlaylistItem } from '@/lib/types';

export type FavoriteRow = { mediaId: string; createdAt: number };

export type HistoryRow = {
  mediaId: string;
  mediaType: MediaType;
  playedAt: number;
  playCount: number;
};

export type WebDb = {
  media: MediaItem[];
  playlists: Playlist[];
  playlistItems: PlaylistItem[];
  favorites: FavoriteRow[];
  history: HistoryRow[];
  positions: Record<string, number>;
  settings: Record<string, string>;
};

const STORAGE_KEY = 'mediaplayer.webdb.v1';

function emptyDb(): WebDb {
  return {
    media: [],
    playlists: [],
    playlistItems: [],
    favorites: [],
    history: [],
    positions: {},
    settings: {},
  };
}

function getStorage(): Storage | null {
  try {
    const g = globalThis as { localStorage?: Storage };
    return g.localStorage ?? null;
  } catch {
    return null;
  }
}

let cache: WebDb | null = null;

function load(): WebDb {
  if (cache) return cache;
  const base = emptyDb();
  const storage = getStorage();
  if (storage) {
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WebDb>;
        cache = {
          media: parsed.media ?? [],
          playlists: parsed.playlists ?? [],
          playlistItems: parsed.playlistItems ?? [],
          favorites: parsed.favorites ?? [],
          history: parsed.history ?? [],
          positions: parsed.positions ?? {},
          settings: parsed.settings ?? {},
        };
        return cache;
      }
    } catch {
      // Corrupt payload — start fresh.
    }
  }
  cache = base;
  return cache;
}

function persist(): void {
  const storage = getStorage();
  if (!storage || !cache) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore quota / unavailable storage.
  }
}

export function getDb(): WebDb {
  return load();
}

export function commit(): void {
  persist();
}

export function resetWebDb(): void {
  cache = emptyDb();
  persist();
}