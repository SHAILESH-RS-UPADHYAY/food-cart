import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Likes = {
  stalls: string[];
  items: string[];
  /** Returns true when the thing is now liked. */
  toggle: (kind: 'stalls' | 'items', id: string) => boolean;
};

export const useLikes = create<Likes>()(
  persist(
    (set, get) => ({
      stalls: ['books-n-cooks'],
      items: ['tj-oreo', 'cf-steam-momos'],
      toggle: (kind, id) => {
        const list = get()[kind];
        const liked = !list.includes(id);
        set({ [kind]: liked ? [id, ...list] : list.filter((x) => x !== id) } as Pick<Likes, typeof kind>);
        return liked;
      },
    }),
    { name: 'fc-likes', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
