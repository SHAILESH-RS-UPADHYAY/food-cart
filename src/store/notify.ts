import { create } from 'zustand';

/** Stalls the student asked to hear about when the kitchen has room again. */
export const useNotify = create<{ stalls: string[]; watch: (id: string) => void; drop: (id: string) => void }>((set) => ({
  stalls: [],
  watch: (id) => set((s) => ({ stalls: s.stalls.includes(id) ? s.stalls : [...s.stalls, id] })),
  drop: (id) => set((s) => ({ stalls: s.stalls.filter((x) => x !== id) })),
}));
