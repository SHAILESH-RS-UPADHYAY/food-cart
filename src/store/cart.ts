import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useLive, type Deal } from '@/api';
import { MAX_QTY, liveDeal } from '@/api/rules';
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

/** What one unit costs right now: the live last-call price if there is one, else the menu price. */
export function unitPrice(itemId: string, deals: Record<string, Deal>) {
  return liveDeal(deals[itemId])?.price ?? itemById[itemId]?.price ?? 0;
}

export function cartSummary(qty: Record<string, number>, deals: Record<string, Deal> = {}) {
  let count = 0;
  let total = 0;
  for (const [id, n] of Object.entries(qty)) {
    count += n;
    total += n * unitPrice(id, deals);
  }
  return { count, total };
}

/** Cart count and total, priced with live deals. */
export function useCartSummary(onlyStall?: string) {
  const qty = useCart((s) => s.qty);
  const stallId = useCart((s) => s.stallId);
  const deals = useLive((s) => s.deals);
  useLive((s) => s.menuVersion);
  return cartSummary(onlyStall && onlyStall !== stallId ? {} : qty, deals);
}
