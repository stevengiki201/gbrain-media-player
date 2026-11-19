import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { types, type Instance } from 'mobx-state-tree';

import { FavoritesStore } from './FavoritesStore';
import { HistoryStore } from './HistoryStore';
import { MediaStore } from './MediaStore';
import { PlaylistStore } from './PlaylistStore';
import { SettingsStore } from './SettingsStore';

export const RootStore = types.model('RootStore', {
  settings: SettingsStore,
  media: MediaStore,
  favorites: FavoritesStore,
  playlists: PlaylistStore,
  history: HistoryStore,
});

export type RootStoreType = Instance<typeof RootStore>;

export function createRootStore(): RootStoreType {
  return RootStore.create({
    settings: {},
    media: {},
    favorites: {},
    playlists: {},
    history: {},
  });
}

const StoreContext = createContext<RootStoreType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createRootStore);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([
        store.settings.load().catch(() => {}),
        store.media.load().catch(() => {}),
        store.favorites.load().catch(() => {}),
        store.playlists.load().catch(() => {}),
        store.history.load().catch(() => {}),
      ]);
      if (cancelled) return;
      if (store.settings.scanOnLaunch) {
        void store.media.scan();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): RootStoreType {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return store;
}