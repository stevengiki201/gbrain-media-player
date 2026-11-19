import { flow, types } from 'mobx-state-tree';

import {
  clearHistory,
  clearPositions,
  getAllPositions,
  listRecent,
  recordPlay,
  setPosition,
  type RecentEntry,
} from '@/db/history';
import type { MediaItem } from '@/lib/types';

export const HistoryStore = types
  .model('HistoryStore', {
    recent: types.array(types.frozen<RecentEntry>()),
    positions: types.frozen<Record<string, number>>({}),
  })
  .views((self) => ({
    positionOf(id: string): number {
      return self.positions[id] ?? 0;
    },
    recentTracks(limit = 12): MediaItem[] {
      return self.recent
        .filter((entry) => entry.item.mediaType === 'audio')
        .slice(0, limit)
        .map((entry) => entry.item);
    },
    recentVideos(limit = 8): MediaItem[] {
      return self.recent
        .filter((entry) => entry.item.mediaType === 'video')
        .slice(0, limit)
        .map((entry) => entry.item);
    },
  }))
  .actions((self) => ({
    load: flow(function* () {
      const [recent, positions] = (yield Promise.all([
        listRecent(40),
        getAllPositions(),
      ])) as [RecentEntry[], Record<string, number>];
      self.recent.replace(recent);
      self.positions = positions;
    }),
    record: flow(function* (item: MediaItem) {
      yield recordPlay(item.id, item.mediaType);
      const recent = (yield listRecent(40)) as RecentEntry[];
      self.recent.replace(recent);
    }),
    savePosition: flow(function* (id: string, positionMs: number) {
      const rounded = Math.max(0, Math.round(positionMs));
      self.positions = { ...self.positions, [id]: rounded };
      yield setPosition(id, rounded);
    }),
    clear: flow(function* () {
      yield clearHistory();
      self.recent.clear();
    }),
    clearPositions: flow(function* () {
      yield clearPositions();
      self.positions = {};
    }),
  }));