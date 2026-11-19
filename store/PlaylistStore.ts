import { flow, types } from 'mobx-state-tree';

import {
  addPlaylistItem,
  createPlaylist,
  deletePlaylist,
  getAllPlaylistItems,
  listPlaylists,
  removePlaylistItem,
  renamePlaylist,
  reorderPlaylistItems,
} from '@/db/playlists';
import type { Playlist, PlaylistItem } from '@/lib/types';

export const PlaylistStore = types
  .model('PlaylistStore', {
    playlists: types.array(types.frozen<Playlist>()),
    items: types.array(types.frozen<PlaylistItem>()),
  })
  .views((self) => ({
    playlistById(id: string): Playlist | null {
      return self.playlists.find((playlist) => playlist.id === id) ?? null;
    },
    itemsFor(id: string): PlaylistItem[] {
      return self.items
        .filter((item) => item.playlistId === id)
        .sort((a, b) => a.position - b.position);
    },
    trackCount(id: string): number {
      return self.items.filter((item) => item.playlistId === id).length;
    },
  }))
  .actions((self) => ({
    load: flow(function* () {
      const [playlists, items] = (yield Promise.all([
        listPlaylists(),
        getAllPlaylistItems(),
      ])) as [Playlist[], PlaylistItem[]];
      self.playlists.replace(playlists);
      self.items.replace(items);
    }),
    create: flow(function* (name: string) {
      const playlist = (yield createPlaylist(name)) as Playlist;
      self.playlists.push(playlist);
      return playlist;
    }),
    rename: flow(function* (id: string, name: string) {
      yield renamePlaylist(id, name);
      const index = self.playlists.findIndex((playlist) => playlist.id === id);
      if (index >= 0) {
        self.playlists.splice(index, 1, {
          ...self.playlists[index],
          name: name.trim() || 'Untitled',
          updatedAt: Date.now(),
        });
      }
    }),
    remove: flow(function* (id: string) {
      yield deletePlaylist(id);
      const index = self.playlists.findIndex((playlist) => playlist.id === id);
      if (index >= 0) self.playlists.splice(index, 1);
      for (let i = self.items.length - 1; i >= 0; i -= 1) {
        if (self.items[i].playlistId === id) self.items.splice(i, 1);
      }
    }),
    addItem: flow(function* (playlistId: string, mediaId: string) {
      yield addPlaylistItem(playlistId, mediaId);
      const items = (yield getAllPlaylistItems()) as PlaylistItem[];
      self.items.replace(items);
    }),
    addItems: flow(function* (playlistId: string, mediaIds: string[]) {
      for (const mediaId of mediaIds) {
        yield addPlaylistItem(playlistId, mediaId);
      }
      const items = (yield getAllPlaylistItems()) as PlaylistItem[];
      self.items.replace(items);
    }),
    removeItem: flow(function* (playlistId: string, mediaId: string) {
      yield removePlaylistItem(playlistId, mediaId);
      const items = (yield getAllPlaylistItems()) as PlaylistItem[];
      self.items.replace(items);
    }),
    reorder: flow(function* (playlistId: string, orderedIds: string[]) {
      yield reorderPlaylistItems(playlistId, orderedIds);
      const items = (yield getAllPlaylistItems()) as PlaylistItem[];
      self.items.replace(items);
    }),
  }));