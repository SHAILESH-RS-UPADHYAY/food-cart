import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MAX_QTY } from '@/api/rules';
import { itemById } from '@/data/catalog';

type Cart = {
  stallId: string | null;
  qty: Record<string, number>;
  note: string;
  /** Returns false when the item belongs to another stall (caller asks before replacing). */
  add: (itemId: string) => boolean;
  remove: (itemId: string) => void;
  replaceWith: (itemId: string) => void;
  setNote: (note: string) => void;
  clear: () => void;
};

export const useCart = create<Cart>()(
  persist(
    (set, get) => ({
      stallId: null,
      qty: {},
      note: '',
      add: (itemId) => {
        const { stallId, qty } = get();
        const item = itemById[itemId];
        if (stallId && stallId !== item.stallId && Object.keys(qty).length) return false;
        set({ stallId: item.stallId, qty: { ...qty, [itemId]: Math.min(MAX_QTY, (qty[itemId] ?? 0) + 1) } });
        return true;
      },
      remove: (itemId) => {
        const qty = { ...get().qty };
        if (!qty[itemId]) return;
        if (qty[itemId] > 1) qty[itemId] -= 1;
        else delete qty[itemId];
        set(Object.keys(qty).length ? { qty } : { qty, stallId: null, note: '' });
      },
      replaceWith: (itemId) => set({ stallId: itemById[itemId].stallId, qty: { [itemId]: 1 }, note: '' }),
      setNote: (note) => set({ note }),
      clear: () => set({ stallId: null, qty: {}, note: '' }),
    }),
    { name: 'fc-cart', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

export function cartSummary(qty: Record<string, number>) {
  let count = 0;
  let total = 0;
  for (const [id, n] of Object.entries(qty)) {
    count += n;
    total += n * (itemById[id]?.price ?? 0);
  }
  return { count, total };
}
