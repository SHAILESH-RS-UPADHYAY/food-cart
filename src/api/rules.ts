import type { Deal, OrderStatus, Role, StallLive } from './types';

// Mirrors supabase/migrations: keep the two in step (tests/rules.test.ts covers this file).

/** Statuses that occupy the kitchen and count against the stall's order cap. */
export const KITCHEN: OrderStatus[] = ['placed', 'accepted', 'preparing'];
export const LIVE: OrderStatus[] = [...KITCHEN, 'ready'];

const NEXT: Record<OrderStatus, OrderStatus[]> = {
  placed: ['accepted', 'rejected', 'cancelled'],
  accepted: ['preparing', 'ready', 'rejected'],
  preparing: ['ready'],
  ready: ['collected'],
  collected: [],
  cancelled: [],
  rejected: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus, role: Role): boolean {
  if (!NEXT[from].includes(to)) return false;
  if (role === 'admin') return true;
  if (role === 'student') return to === 'cancelled' || to === 'collected';
  return to !== 'cancelled';
}

export type StallState = 'open' | 'busy' | 'full' | 'paused' | 'closed';

export const BUSY_AT = 0.85;

export function stallState(live?: StallLive): StallState {
  if (!live) return 'open';
  if (live.status !== 'open') return live.status;
  if (live.active >= live.maxActive) return 'full';
  return live.active / live.maxActive >= BUSY_AT ? 'busy' : 'open';
}

/** Kitchen wait grows with load: a quiet stall is near its average prep time. */
export function etaMinutes(avgPrepMin: number, live?: StallLive): number {
  const load = live ? Math.min(1, live.active / Math.max(1, live.maxActive)) : 0.3;
  return Math.max(3, Math.round(avgPrepMin * (1 + 0.8 * load)));
}

/** Rough minutes until a full kitchen frees a slot. */
export function freeSlotMinutes(avgPrepMin: number): number {
  return Math.max(2, Math.round(avgPrepMin / 2));
}

export function lineTotal(lines: { qty: number; price: number }[]): number {
  return lines.reduce((sum, l) => sum + l.qty * l.price, 0);
}

/** A deal counts only while stock remains and the clock has not run out. */
export function liveDeal(deal: Deal | undefined, now = Date.now()): Deal | undefined {
  return deal && deal.left > 0 && deal.endsAt > now ? deal : undefined;
}

export const percentOff = (was: number, now: number) => Math.round((1 - now / was) * 100);

export const MAX_ACTIVE_PER_USER = 3;
export const MAX_QTY = 20;
