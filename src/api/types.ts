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

export type PlaceOrderInput = {
  stallId: string;
  lines: { itemId: string; qty: number }[];
  note?: string;
  payment: Payment;
};

/** Errors the backend raises with a stable code the UI can explain. */
export type ApiErrorCode =
  | 'STALL_AT_CAPACITY' | 'STALL_CLOSED' | 'ITEM_UNAVAILABLE' | 'TOO_MANY_ACTIVE'
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
  staffSignIn(credentials: { email: string; password: string } | { demoStallId: string } | { demoAdmin: true }): Promise<User>;
  setName(name: string): Promise<User>;
  signOut(): Promise<void>;

  subscribeStalls(cb: (stalls: Record<string, StallLive>) => void): Unsubscribe;
  subscribeUnavailable(cb: (itemIds: Set<string>) => void): Unsubscribe;
  subscribeMyOrders(cb: (orders: Order[]) => void): Unsubscribe;
  subscribeStallOrders(stallId: string, cb: (orders: Order[]) => void): Unsubscribe;

  placeOrder(input: PlaceOrderInput): Promise<Order>;
  setOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
  updateStall(stallId: string, patch: { status?: StallStatus; maxActive?: number }): Promise<void>;
  setItemAvailable(itemId: string, available: boolean): Promise<void>;
}
