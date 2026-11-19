import { flow, types } from 'mobx-state-tree';

import {
  getTracks,
  getVideos,
  removeMissingMedia,
  saveMedia,
  searchMedia,
} from '@/db/media';
import { requestMediaPermissions, scanLibrary } from '@/lib/media-scanner';
import type { AlbumSummary, ArtistSummary, MediaItem } from '@/lib/types';

function groupAlbums(tracks: MediaItem[]): AlbumSummary[] {
  const map = new Map<string, AlbumSummary>();
  for (const track of tracks) {
    const albumTitle = track.album?.trim();
    const albumId = track.albumId ?? '';
    const key = albumId || albumTitle?.toLowerCase() || '__unknown_album__';
    const existing = map.get(key);
    if (existing) {
      existing.trackCount += 1;
      existing.tracks.push(track);
      if (!existing.artwork && track.artwork) existing.artwork = track.artwork;
    } else {
      map.set(key, {
        id: key,
        title: albumTitle || 'Unknown Album',
        artist: track.artist || 'Unknown Artist',
        artwork: track.artwork,
        trackCount: 1,
        tracks: [track],
      });
    }
  }
  return [...map.values()].sort((a, b) => a.title.localeCompare(b.title));
}

function groupArtists(tracks: MediaItem[]): ArtistSummary[] {
  const map = new Map<string, ArtistSummary>();
  for (const track of tracks) {
    const artist = track.artist?.trim() || 'Unknown Artist';
    const existing = map.get(artist);
    if (existing) {
      existing.trackCount += 1;
      existing.tracks.push(track);
      if (!existing.artwork && track.artwork) existing.artwork = track.artwork;
    } else {
      map.set(artist, {
        name: artist,
        artwork: track.artwork,
        trackCount: 1,
        tracks: [track],
      });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export const MediaStore = types
  .model('MediaStore', {
    tracks: types.array(types.frozen<MediaItem>()),
    videos: types.array(types.frozen<MediaItem>()),
    scanning: types.optional(types.boolean, false),
    hydrated: types.optional(types.boolean, false),
    error: types.optional(types.string, ''),
  })
  .views((self) => ({
    get albums(): AlbumSummary[] {
      return groupAlbums(self.tracks.slice());
    },
    get artists(): ArtistSummary[] {
      return groupArtists(self.tracks.slice());
    },
    get trackCount(): number {
      return self.tracks.length;
    },
    get videoCount(): number {
      return self.videos.length;
    },
    get totalDurationSeconds(): number {
      return self.tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    },
    trackById(id: string): MediaItem | undefined {
      return self.tracks.find((track) => track.id === id);
    },
    videoById(id: string): MediaItem | undefined {
      return self.videos.find((video) => video.id === id);
    },
    mediaById(id: string): MediaItem | undefined {
      return (
        self.tracks.find((track) => track.id === id) ??
        self.videos.find((video) => video.id === id)
      );
    },
  }))
  .actions((self) => ({
    setTracks(tracks: MediaItem[]) {
      self.tracks.replace(tracks);
    },
    setVideos(videos: MediaItem[]) {
      self.videos.replace(videos);
    },
    setError(error: string) {
      self.error = error;
    },
    markHydrated() {
      self.hydrated = true;
    },
    load: flow(function* () {
      const [tracks, videos] = (yield Promise.all([
        getTracks(),
        getVideos(),
      ])) as [MediaItem[], MediaItem[]];
      self.tracks.replace(tracks);
      self.videos.replace(videos);
      self.hydrated = true;
    }),
    scan: flow(function* () {
      if (self.scanning) return;
      self.scanning = true;
      self.error = '';
      try {
        const granted = (yield requestMediaPermissions()) as boolean;
        if (!granted) {
          self.error =
            'Media permission denied. Grant access in Settings to scan your library.';
          self.scanning = false;
          return;
        }
        const result = (yield scanLibrary()) as {
          tracks: MediaItem[];
          videos: MediaItem[];
        };
        const { tracks, videos } = result;
        yield saveMedia([...tracks, ...videos]);
        yield removeMissingMedia(
          'audio',
          tracks.map((track) => track.id),
        );
        yield removeMissingMedia(
          'video',
          videos.map((video) => video.id),
        );
        self.tracks.replace(tracks);
        self.videos.replace(videos);
        self.hydrated = true;
        self.scanning = false;
      } catch (error) {
        self.error =
          error instanceof Error ? error.message : 'Failed to scan media library';
        self.scanning = false;
      }
    }),
    async search(query: string) {
      return searchMedia(query);
    },
  }));