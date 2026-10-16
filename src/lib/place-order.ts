import { router } from 'expo-router';
import { useState } from 'react';

import { api, ApiError, type Payment } from '@/api';
import { useCart } from '@/store/cart';
import { toast } from '@/ui/Toast';

import { fx } from './feedback';

const ERRORS: Record<string, string> = {
  STALL_CLOSED: 'This stall just paused new orders. Try another stall for now.',
  ITEM_UNAVAILABLE: 'Something in your cart just sold out. Remove it and try again.',
  TOO_MANY_ACTIVE: 'You already have 3 orders cooking. Collect one first.',
};

/** Places the cart as an order; on success the cart clears and the tracking screen opens with confetti. */
export function usePlaceOrder() {
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState(false);
  const place = async (payment: Payment) => {
    const { stallId, qty, note } = useCart.getState();
    if (!stallId || busy) return;
    setBusy(true);
    try {
      const order = await api.placeOrder({ stallId, lines: Object.entries(qty).map(([itemId, n]) => ({ itemId, qty: n })), note, payment });
      useCart.getState().clear();
      router.replace({ pathname: '/order/[id]', params: { id: order.id, fresh: '1' } });
    } catch (e) {
      fx.error();
      if (e instanceof ApiError && e.code === 'STALL_AT_CAPACITY') setFull(true);
      else toast(e instanceof ApiError ? ERRORS[e.code] ?? 'Could not place the order. Check your connection.' : 'Could not place the order.', 'warning-bold', 'chilli');
      throw e;
    } finally {
      setBusy(false);
    }
  };
  return { place, busy, full, closeFull: () => setFull(false) };
}

