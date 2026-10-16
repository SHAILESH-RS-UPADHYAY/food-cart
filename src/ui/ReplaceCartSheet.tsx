import { itemById, stallById } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { useCart } from '@/store/cart';

import { Button } from './Button';
import { Sheet } from './Sheet';
import { T } from './Text';
import { C } from './theme';

/** One stall per order: adding from another stall asks first. */
export function ReplaceCartSheet({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const current = useCart((s) => s.stallId);
  const item = itemId ? itemById[itemId] : null;
  return (
    <Sheet visible={!!item} onClose={onClose} title="Start a new cart?">
      {item && current && (
        <>
          <T v="body" color={C.ink2} style={{ fontSize: 16, lineHeight: 23 }}>
            Your cart has items from {stallById[current].name}. Each order goes to one stall, so adding {item.name} clears it.
          </T>
          <Button
            label={`Start new cart from ${stallById[item.stallId].name}`}
            onPress={() => {
              useCart.getState().replaceWith(item.id);
              fx.add();
              onClose();
            }}
            feedback="none"
            block
            style={{ marginTop: 22 }}
          />
          <Button label="Keep my cart" kind="quiet" onPress={onClose} block style={{ marginTop: 6 }} />
        </>
      )}
    </Sheet>
  );
}
