import { create } from 'zustand';

import { api, type User } from '@/api';

type Session = {
  user: User | null;
  ready: boolean;
  restore: () => Promise<void>;
  setUser: (u: User | null) => void;
  signOut: () => Promise<void>;
};

/** Mirrors the backend session. Not persisted here: each backend persists its own auth. */
export const useSession = create<Session>((set) => ({
  user: null,
  ready: false,
  restore: async () => {
    const user = await api.restore().catch(() => null);
    set({ user, ready: true });
  },
  setUser: (user) => set({ user }),
  signOut: async () => {
    await api.signOut();
    set({ user: null });
  },
}));
