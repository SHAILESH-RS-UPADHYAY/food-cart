import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api, type Deal } from '@/api';
import { percentOff } from '@/api/rules';
import type { Item } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { rupees } from '@/lib/format';

import { Button } from './Button';
import { Icon } from './Icon';
import { Pill } from './Pill';
import { Press } from './Press';
import { Sheet } from './Sheet';
import { T } from './Text';
import { toast } from './Toast';
import { C, R } from './theme';

const OFF = [30, 40, 50];
const ENDS = [{ label: '30 min', min: 30 }, { label: '1 hour', min: 60 }, { label: '2 hours', min: 120 }, { label: 'Till close', min: 360 }];
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

function Counter({ label, value, onChange, step, min, max, format = String }: {
  label: string; value: number; onChange: (n: number) => void; step: number; min: number; max: number; format?: (n: number) => string;
}) {
  const set = (n: number) => {
    fx.tick();
    onChange(Math.max(min, Math.min(max, n)));
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
      <T v="bodyStrong">{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Press onPress={() => set(value - step)} feedback="none" accessibilityLabel={`Less ${label}`} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="minus-bold" size={14} />
        </Press>
        <T v="h3" tab style={{ minWidth: 64, textAlign: 'center' }}>{format(value)}</T>
        <Press onPress={() => set(value + step)} feedback="none" accessibilityLabel={`More ${label}`} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus-bold" size={14} />
        </Press>
      </View>
    </View>
  );
}

/** Staff: put a dish on last call (leftover / surplus at a lower price, limited plates, time-boxed). */
export function DealSheet({ item, current, onClose }: { item: Item | null; current?: Deal; onClose: () => void }) {
  const [price, setPrice] = useState(0);
  const [left, setLeft] = useState(4);
  const [mins, setMins] = useState(120);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!item) return;
    setPrice(current?.price ?? round5(item.price * 0.6));
    setLeft(current?.left ?? 4);
    setMins(120);
  }, [item?.id]);

  const save = async () => {
    if (!item) return;
    setBusy(true);
    try {
      await api.setDeal(item.id, { price, left, minutes: mins });
      fx.success();
      toast(`${item.name} is on last call`, 'hourglass-high-bold', 'leaf');
      onClose();
    } catch (e) {
      fx.error();
      toast(e instanceof Error ? e.message : 'Could not start the deal', 'warning-bold', 'chilli');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={!!item} onClose={onClose} title={current ? 'Edit last call' : 'Put on last call'}>
      {item && (
        <View style={{ gap: 6 }}>
          <T v="body" color={C.ink2}>
            {item.name} usually sells at {rupees(item.price)}. Students see it in the Last call rail with a countdown.
          </T>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            {OFF.map((p) => (
              <Pill key={p} label={`${p}% off`} active={percentOff(item.price, price) === p} onPress={() => setPrice(round5(item.price * (1 - p / 100)))} />
            ))}
          </View>
          <Counter label="Deal price" value={price} onChange={setPrice} step={5} min={5} max={item.price - 5} format={rupees} />
          <Counter label="Plates left" value={left} onChange={setLeft} step={1} min={1} max={50} />
          <T v="bodyStrong" style={{ marginTop: 6 }}>Ends in</T>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {ENDS.map((e) => <Pill key={e.min} label={e.label} active={mins === e.min} onPress={() => setMins(e.min)} />)}
          </View>
          <View style={{ marginTop: 16, padding: 14, borderRadius: R.input, backgroundColor: C.accentTint }}>
            <T v="small" color={C.accent} tab>
              {percentOff(item.price, price)}% off: {left} plates at {rupees(price)} instead of {rupees(item.price)}.
            </T>
          </View>
          <Button label={current ? 'Update deal' : 'Start last call'} icon="hourglass-high-bold" onPress={save} loading={busy} block style={{ marginTop: 14 }} feedback="none" />
        </View>
      )}
    </Sheet>
  );
}
