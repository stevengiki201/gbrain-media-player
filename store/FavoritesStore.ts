import { flow, types } from 'mobx-state-tree';

import { addFavorite, getFavoriteIds, removeFavorite } from '@/db/favorites';

export const FavoritesStore = types
  .model('FavoritesStore', {
    ids: types.array(types.string),
  })
  .views((self) => ({
    isFavorite(id: string): boolean {
      return self.ids.includes(id);
    },
    get count(): number {
      return self.ids.length;
    },
  }))
  .actions((self) => ({
    load: flow(function* () {
      const ids = (yield getFavoriteIds()) as string[];
      self.ids.replace(ids);
    }),
    toggle: flow(function* (id: string) {
      const index = self.ids.findIndex((entry) => entry === id);
      if (index >= 0) {
        self.ids.splice(index, 1);
        yield removeFavorite(id);
      } else {
        self.ids.push(id);
        yield addFavorite(id);
      }
    }),
  }));