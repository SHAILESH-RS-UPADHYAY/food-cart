import { Redirect, router, usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect, useState, type ReactNode, type Ref } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMyOrders } from '@/api';
import { LIVE } from '@/api/rules';
import { fx } from '@/lib/feedback';
import { rupees } from '@/lib/format';
import { TAB_BAR_H, TOP_NAV_H, useLayout } from '@/lib/layout';
import { useCartSummary } from '@/store/cart';
import { useSession } from '@/store/session';
import { CartBar } from '@/ui/CartBar';
import { Icon, type IconName } from '@/ui/Icon';
import { Lockup } from '@/ui/Logo';
import { Glass } from '@/ui/Surface';
import { EASE_IN_OUT } from '@/ui/motion';
import { Press } from '@/ui/Press';
import { T } from '@/ui/Text';
import { C, MAX_W, R, SHADOW } from '@/ui/theme';

const TABS: { name: string; href: '/home' | '/orders' | '/likes' | '/me'; label: string; icon: IconName; active: IconName }[] = [
  { name: 'home', href: '/home', label: 'Home', icon: 'house-bold', active: 'house-fill' },
  { name: 'orders', href: '/orders', label: 'Orders', icon: 'receipt-bold', active: 'receipt-fill' },
  { name: 'likes', href: '/likes', label: 'Likes', icon: 'heart-bold', active: 'heart-fill' },
  { name: 'me', href: '/me', label: 'Profile', icon: 'user-bold', active: 'user-fill' },
];

type ButtonProps = TabTriggerSlotProps & { tab: (typeof TABS)[number]; badge?: number; desktop?: boolean; ref?: Ref<View> };

function TabButton({ tab, badge, desktop, isFocused, onPress, ...rest }: ButtonProps) {
  const color = desktop ? (isFocused ? C.ink : C.ink3) : isFocused ? C.onAccent : C.ink3;
  return (
    <Press
      {...(rest as object)}
      onPress={(e) => {
        if (!isFocused) fx.pill();
        onPress?.(e);
      }}
      feedback="none"
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={tab.label}
      style={desktop
        ? { flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, borderRadius: R.pill, backgroundColor: isFocused ? C.card : 'transparent' }
        : { flex: 1, height: TAB_BAR_H - 12, alignItems: 'center', justifyContent: 'center', gap: 2 }}
    >
      <View>
        <Icon name={isFocused ? tab.active : tab.icon} size={desktop ? 18 : 22} color={color} />
        {!!badge && !desktop && (
          <View style={{ position: 'absolute', top: -5, right: -9, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: C.chilli, alignItems: 'center', justifyContent: 'center' }}>
            <T v="label" color={C.chalk} style={{ fontSize: 10, lineHeight: 12 }} tab>{badge}</T>
          </View>
        )}
      </View>
      <T v="label" color={color} style={{ fontSize: desktop ? 14 : 11 }}>{tab.label}</T>
      {!!badge && desktop && (
        <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: C.chilli, alignItems: 'center', justifyContent: 'center' }}>
          <T v="label" color={C.chalk} style={{ fontSize: 11, lineHeight: 13 }} tab>{badge}</T>
        </View>
      )}
    </Press>
  );
}

/** Phone: floating ink pill with a yellow indicator that glides (250 ms ease-in-out) to the active tab. */
function PhoneBar({ children, index }: { children?: ReactNode; index: number }) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const slot = w / TABS.length;
  useEffect(() => {
    if (slot) x.set(withTiming(index * slot, { duration: 250, easing: EASE_IN_OUT }));
  }, [index, slot]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return (
    <View style={{ position: 'absolute', left: 14, right: 14, bottom: insets.bottom + 10, alignItems: 'center' }} pointerEvents="box-none">
      <View
        onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 12)}
        style={[{ width: '100%', maxWidth: 520, height: TAB_BAR_H, borderRadius: TAB_BAR_H / 2 }, SHADOW.float]}
      >
        <Glass radius={TAB_BAR_H / 2} style={{ position: 'absolute', inset: 0 } as never} />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 }}>
        {slot > 0 && index >= 0 && (
          <Animated.View style={[{ position: 'absolute', left: 6, top: 6, width: slot, height: TAB_BAR_H - 12, borderRadius: (TAB_BAR_H - 12) / 2, backgroundColor: C.accent }, indicator]} />
        )}
        {children}
        </View>
      </View>
    </View>
  );
}

function DesktopBar({ children }: { children?: ReactNode }) {
  const { count, total } = useCartSummary();
  return (
    <Glass style={{ position: 'absolute', top: 0, left: 0, right: 0, height: TOP_NAV_H, zIndex: 10 }}>
      <View style={{ flex: 1, width: '100%', maxWidth: MAX_W, alignSelf: 'center', paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', gap: 24 }}>
        <Press onPress={() => router.navigate('/home')} feedback="none" accessibilityLabel="Food Cart home">
          <Lockup size={34} />
        </Press>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 }}>{children}</View>
        <Press onPress={() => router.push('/cart')} feedback="open" accessibilityLabel="Cart"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingLeft: 8, paddingRight: 16, borderRadius: R.pill, backgroundColor: count ? C.accent : C.card, borderWidth: count ? 0 : 1, borderColor: C.line }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: count ? C.canvas : C.ink, alignItems: 'center', justifyContent: 'center' }}>
            {count ? <T v="label" color={C.accent} tab>{count}</T> : <Icon name="shopping-bag-bold" size={15} color={C.chalk} />}
          </View>
          <T v="bodyStrong" tab color={count ? C.onAccent : C.ink}>{count ? rupees(total) : 'Cart'}</T>
        </Press>
      </View>
    </Glass>
  );
}

export default function TabsLayout() {
  const user = useSession((s) => s.user);
  const { desktop } = useLayout();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  const orders = useMyOrders();
  const live = orders?.filter((o) => LIVE.includes(o.status)).length ?? 0;
  const index = TABS.findIndex((t) => path.startsWith(t.href));

  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'student') return <Redirect href={user.role === 'admin' ? '/admin' : '/staff'} />;

  const triggers = TABS.map((t) => (
    <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
      <TabButton tab={t} desktop={desktop} badge={t.name === 'orders' ? live : undefined} />
    </TabTrigger>
  ));

  return (
    <Tabs style={{ flex: 1, backgroundColor: C.canvas }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        {desktop ? <DesktopBar>{triggers}</DesktopBar> : <PhoneBar index={index}>{triggers}</PhoneBar>}
      </TabList>
      {!desktop && (path === '/home' || path === '/likes') && <CartBar bottom={insets.bottom + TAB_BAR_H + 22} />}
    </Tabs>
  );
}
