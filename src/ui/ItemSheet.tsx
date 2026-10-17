import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { api } from '@/api';
import { CATEGORIES, isBaseItem, type Category, type Item } from '@/data/catalog';
import { PHOTOS, type PhotoKey } from '@/data/images';
import { fx } from '@/lib/feedback';

import { Button } from './Button';
import { Field } from './Field';
import { Photo } from './Photo';
import { Pill } from './Pill';
import { Press } from './Press';
import { Sheet } from './Sheet';
import { T } from './Text';
import { toast } from './Toast';
import { C, R } from './theme';

const PICKS = (Object.keys(PHOTOS) as PhotoKey[]).filter((k) => !k.startsWith('cover-'));

/**
 * Staff: add a dish, or change one's price. Base dishes keep their name and photo (only the
 * price moves); dishes the stall added can be fully edited.
 */
export function ItemSheet({ stallId, item, open, onClose }: { stallId: string; item?: Item; open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Snacks');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState<PhotoKey>(PICKS[0]);
  const [busy, setBusy] = useState(false);
  const priceOnly = !!item && isBaseItem(item.id);

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? '');
    setDescription(item?.description ?? '');
    setCategory(item?.category ?? 'Snacks');
    setPrice(item ? String(item.price) : '');
    setPhoto(item?.photo ?? PICKS[0]);
  }, [open, item?.id]);

  const n = Number(price);
  const ok = name.trim().length >= 2 && n > 0 && n <= 5000;

  const save = async () => {
    if (!ok) return fx.error();
    setBusy(true);
    try {
      await api.saveItem({ id: item?.id, stallId, name, description, category, price: n, photo });
      fx.success();
      toast(item ? `${name.trim()} is now ₹${n}` : `${name.trim()} added to the menu`, 'check-bold', 'leaf');
      onClose();
    } catch (e) {
      fx.error();
      toast(e instanceof Error ? e.message : 'Could not save', 'warning-bold', 'chilli');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={open} onClose={onClose} title={item ? (priceOnly ? 'Set price' : 'Edit dish') : 'Add a dish'}>
      <View style={{ gap: 16 }}>
        {priceOnly ? (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Photo photo={photo} width={56} style={{ width: 56, height: 56, borderRadius: R.thumb }} />
            <View style={{ flex: 1 }}>
              <T v="h3">{name}</T>
              <T v="small" color={C.ink3}>{category}</T>
            </View>
          </View>
        ) : (
          <>
            <Field label="Dish name" value={name} onChangeText={setName} placeholder="Kesar Kulfi" maxLength={40} />
            <Field label="Short description" value={description} onChangeText={setDescription} placeholder="Saffron, pista, slow-set" maxLength={80} />
            <View style={{ gap: 8 }}>
              <T v="label" color={C.ink2}>Category</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {CATEGORIES.map((c) => <Pill key={c.name} label={c.name} active={category === c.name} onPress={() => setCategory(c.name)} />)}
              </View>
            </View>
            <View style={{ gap: 8 }}>
              <T v="label" color={C.ink2}>Photo</T>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {PICKS.map((k) => (
                  <Press key={k} onPress={() => setPhoto(k)} feedback="pill" accessibilityLabel={`Photo ${k}`}
                    style={{ borderRadius: R.thumb + 3, borderWidth: 2, borderColor: photo === k ? C.ink : 'transparent', padding: 2 }}>
                    <Photo photo={k} width={64} style={{ width: 64, height: 64, borderRadius: R.thumb }} />
                  </Press>
                ))}
              </ScrollView>
            </View>
          </>
        )}
        <Field label="Price (₹)" value={price} onChangeText={(t) => setPrice(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="120" prefix="₹" onSubmitEditing={save} />
        <Button label={item ? 'Save' : 'Add to menu'} icon="check-bold" onPress={save} loading={busy} disabled={!ok} block feedback="none" />
      </View>
    </Sheet>
  );
}
