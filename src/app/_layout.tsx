import { Shrikhand_400Regular } from '@expo-google-fonts/shrikhand';
import {
  SchibstedGrotesk_400Regular, SchibstedGrotesk_500Medium, SchibstedGrotesk_700Bold,
  SchibstedGrotesk_800ExtraBold, SchibstedGrotesk_900Black,
} from '@expo-google-fonts/schibsted-grotesk';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import { useLiveSync, useMyOrders, useStalls } from '@/api';
import { stallState } from '@/api/rules';
import { stallById } from '@/data/catalog';
import { fx } from '@/lib/feedback';
import { token } from '@/lib/format';
import { initSound } from '@/lib/sound';
import { useNotify } from '@/store/notify';
import { useSession } from '@/store/session';
import { ToastHost, toast } from '@/ui/Toast';
import { C } from '@/ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Keeps live data flowing and announces status changes wherever the student is in the app. */
function LiveSync() {
  const user = useSession((s) => s.user);
  useLiveSync(user?.role === 'student' ? user.id : undefined);
  const orders = useMyOrders();
  const stalls = useStalls();
  const watched = useNotify((s) => s.stalls);
  const path = usePathname();

  useEffect(() => {
    for (const id of watched) {
      const st = stallState(stalls[id]);
      if (stalls[id] && st !== 'full') {
        useNotify.getState().drop(id);
        if (st === 'open' || st === 'busy') {
          fx.pill();
          toast(`${stallById[id].name} has room again. Order now.`, 'bell-ringing-bold', 'leaf');
        }
      }
    }
  }, [stalls, watched]);
  const seen = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!orders) return;
    const prev = seen.current;
    seen.current = new Map(orders.map((o) => [o.id, o.status]));
    if (!prev) return; // first load: nothing is "new"
    for (const o of orders) {
      const was = prev.get(o.id);
      if (!was || was === o.status) continue;
      const watching = path === `/order/${o.id}`;
      const stall = stallById[o.stallId]?.name ?? 'The stall';
      if (o.status === 'ready' && !watching) {
        fx.ready();
        toast(`${token(o.tokenNo)} is ready at ${stall}`, 'bell-ringing-bold', 'leaf');
      } else if (o.status === 'accepted' && !watching) {
        toast(`${stall} accepted ${token(o.tokenNo)}`, 'chef-hat-bold');
      } else if (o.status === 'rejected') {
        fx.error();
        toast(`${stall} couldn't take ${token(o.tokenNo)}`, 'warning-bold', 'chilli');
      }
    }
  }, [orders]);
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Shrikhand_400Regular,
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_700Bold,
    SchibstedGrotesk_800ExtraBold,
    SchibstedGrotesk_900Black,
  });
  const ready = useSession((s) => s.ready);
  const reduced = useReducedMotion();

  useEffect(() => {
    initSound();
    useSession.getState().restore();
  }, []);

  useEffect(() => {
    if (fontsLoaded && ready) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, ready]);

  if (!fontsLoaded || !ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.canvas }}>
      <StatusBar style="auto" />
      <LiveSync />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: C.canvas },
          animation: reduced ? 'fade' : 'default',
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'none' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', contentStyle: { backgroundColor: C.night } }} />
        <Stack.Screen name="login" options={{ animation: 'fade', contentStyle: { backgroundColor: C.night } }} />
        <Stack.Screen name="verify" options={{ contentStyle: { backgroundColor: C.night } }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade', contentStyle: { backgroundColor: C.night } }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="stall/[id]" options={{ animation: reduced ? 'fade' : 'slide_from_right', animationMatchesGesture: true }} />
        <Stack.Screen name="cart" options={{ animation: reduced ? 'fade' : 'slide_from_bottom' }} />
        <Stack.Screen name="pay" options={{ presentation: 'modal', animation: reduced ? 'fade' : 'slide_from_bottom' }} />
        <Stack.Screen name="order/[id]" options={{ animation: 'fade' }} />
        <Stack.Screen name="staff" options={{ animation: 'fade' }} />
        <Stack.Screen name="admin" options={{ animation: 'fade' }} />
      </Stack>
      <ToastHost />
    </GestureHandlerRootView>
  );
}
