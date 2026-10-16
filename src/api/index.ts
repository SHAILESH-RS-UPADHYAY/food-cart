import { useEffect, useState } from 'react';
import { create } from 'zustand';

import { demo } from './demo';
import type { Backend, Order, StallLive } from './types';

/** Supabase when configured (.env), otherwise the on-device demo engine. */
export const api: Backend = process.env.EXPO_PUBLIC_SUPABASE_URL
  ? (require('./supabase') as typeof import('./supabase')).live
  : demo;

type Live = {
  stalls: Record<string, StallLive>;
  unavailable: Set<string>;
  myOrders: Order[] | null;
};

/** One subscription per stream for the whole app (started by <LiveSync/> in the root layout). */
export const useLive = create<Live>(() => ({ stalls: {}, unavailable: new Set(), myOrders: null }));

export function useLiveSync(studentId?: string) {
  useEffect(() => {
    const a = api.subscribeStalls((stalls) => useLive.setState({ stalls }));
    const b = api.subscribeUnavailable((unavailable) => useLive.setState({ unavailable }));
    return () => {
      a();
      b();
    };
  }, []);
  useEffect(() => {
    if (!studentId) {
      useLive.setState({ myOrders: null });
      return;
    }
    return api.subscribeMyOrders((myOrders) => useLive.setState({ myOrders }));
  }, [studentId]);
}

export const useStalls = () => useLive((s) => s.stalls);
export const useUnavailable = () => useLive((s) => s.unavailable);
export const useMyOrders = () => useLive((s) => s.myOrders);

/** Staff board: its own subscription, only while the console is open. */
export function useStallOrders(stallId?: string): Order[] | null {
  const [o, set] = useState<Order[] | null>(null);
  useEffect(() => (stallId ? api.subscribeStallOrders(stallId, set) : undefined), [stallId]);
  return o;
}

export * from './types';
