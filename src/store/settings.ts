import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Settings = {
  onboarded: boolean;
  sound: boolean;
  haptics: boolean;
  /** Demo mode only: stalls accept and cook your orders on their own. */
  autopilot: boolean;
  set: (patch: Partial<Omit<Settings, 'set'>>) => void;
};

export const useSettings = create<Settings>()(
  persist(
    (set) => ({ onboarded: false, sound: true, haptics: true, autopilot: true, set: (patch) => set(patch) }),
    { name: 'fc-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
