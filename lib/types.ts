export type MediaType = 'audio' | 'video';

export type RepeatMode = 'off' | 'all' | 'one';

export type ThemeMode = 'light' | 'dark' | 'system';

export type MediaItem = {
  id: string;
  mediaType: MediaType;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork: string | null;
  thumbnail: string | null;
  albumId: string | null;
  folder: string | null;
  fileName: string;
  year: number | null;
  genre: string | null;
  size: number | null;
  addedAt: number;
  modifiedAt: number;
};

export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export type PlaylistItem = {
  playlistId: string;
  mediaId: string;
  position: number;
  addedAt: number;
};

export type PlayRecord = {
  mediaId: string;
  mediaType: MediaType;
  playedAt: number;
  playCount: number;
};

export type AlbumSummary = {
  id: string;
  title: string;
  artist: string;
  artwork: string | null;
  trackCount: number;
  tracks: MediaItem[];
};

export type ArtistSummary = {
  name: string;
  artwork: string | null;
  trackCount: number;
  tracks: MediaItem[];
};

export type FolderSummary = {
  path: string;
  label: string;
  trackCount: number;
  videoCount: number;
};

export type PlaybackPosition = {
  mediaId: string;
  positionMs: number;
  updatedAt: number;
};

export type Settings = {
  themeMode: ThemeMode;
  audioVolume: number;
  audioMuted: boolean;
  shuffleDefault: boolean;
  repeatDefault: RepeatMode;
  resumePlayback: boolean;
  scanOnLaunch: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  themeMode: 'dark',
  audioVolume: 1,
  audioMuted: false,
  shuffleDefault: false,
  repeatDefault: 'off',
  resumePlayback: true,
  scanOnLaunch: true,
};