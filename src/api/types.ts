import type { Category, MenuPatch } from '@/data/catalog';
import type { PhotoKey } from '@/data/images';

export type Role = 'student' | 'staff' | 'admin';

export type User = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: Role;
  /** Staff only: the stall this account runs. */
  stallId?: string;
};

export type AuthTarget = { kind: 'phone'; phone: string } | { kind: 'email'; email: string };

export type StallStatus = 'open' | 'paused' | 'closed';

export type StallLive = { id: string; status: StallStatus; maxActive: number; active: number };

export type OrderStatus = 'placed' | 'accepted' | 'preparing' | 'ready' | 'collected' | 'cancelled' | 'rejected';

export type Payment = 'cod' | 'online_demo';

export type OrderLine = { itemId: string; name: string; qty: number; price: number };

export type Order = {
  id: string;
  stallId: string;
  userId: string;
  customerName: string;
  tokenNo: number;
  pickupCode: string;
  status: OrderStatus;
  payment: Payment;
  total: number;
  note?: string;
  lines: OrderLine[];
  etaMin: number;
  createdAt: number;
  acceptedAt?: number;
  readyAt?: number;
  collectedAt?: number;
};

/** A stall's leftover / surplus offer on one dish: cheaper, limited, time-boxed. */
export type Deal = { itemId: string; stallId: string; price: number; left: number; endsAt: number };

export type PlaceOrderInput = {
  stallId: string;
  lines: { itemId: string; qty: number }[];
  note?: string;
  payment: Payment;
};

/** Errors the backend raises with a stable code the UI can explain. */
export type ApiErrorCode =
  | 'STALL_AT_CAPACITY' | 'STALL_CLOSED' | 'ITEM_UNAVAILABLE' | 'TOO_MANY_ACTIVE' | 'DEAL_GONE'
  | 'BAD_TRANSITION' | 'NOT_ALLOWED' | 'BAD_CODE' | 'NETWORK';

export class ApiError extends Error {
  constructor(public code: ApiErrorCode, message?: string) {
    super(message ?? code);
  }
}

export type Unsubscribe = () => void;

export interface Backend {
  mode: 'demo' | 'live';
  restore(): Promise<User | null>;
  sendCode(target: AuthTarget): Promise<void>;
  verifyCode(target: AuthTarget, code: string): Promise<User>;
  /** Team login. Each account runs exactly one stall (or is HQ); the account decides, never the client. */
  staffSignIn(credentials: { email: string; password: string }): Promise<User>;
  setName(name: string): Promise<User>;
  signOut(): Promise<void>;

  subscribeStalls(cb: (stalls: Record<string, StallLive>) => void): Unsubscribe;
  subscribeUnavailable(cb: (itemIds: Set<string>) => void): Unsubscribe;
  subscribeMyOrders(cb: (orders: Order[]) => void): Unsubscribe;
  subscribeStallOrders(stallId: string, cb: (orders: Order[]) => void): Unsubscribe;
  subscribeDeals(cb: (deals: Record<string, Deal>) => void): Unsubscribe;
  /** Staff edits to the menu (new dishes, price changes). */
  subscribeMenu(cb: (patch: MenuPatch) => void): Unsubscribe;
  /** Admin: every order on campus (live + today). */
  subscribeAllOrders(cb: (orders: Order[]) => void): Unsubscribe;
  /** Admin: everyone with an account. */
  listUsers(): Promise<User[]>;

  placeOrder(input: PlaceOrderInput): Promise<Order>;
  setOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
  updateStall(stallId: string, patch: { status?: StallStatus; maxActive?: number }): Promise<void>;
  setItemAvailable(itemId: string, available: boolean): Promise<void>;
  setDeal(itemId: string, deal: { price: number; left: number; minutes: number }): Promise<void>;
  clearDeal(itemId: string): Promise<void>;
  /** Staff: add a dish (no id) or change a dish's price and details. */
  saveItem(item: { id?: string; stallId: string; name: string; description: string; category: Category; price: number; photo: PhotoKey }): Promise<void>;
  /** Removes the account; past orders stay with the stall, anonymised. */
  deleteAccount(): Promise<void>;
}
