import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, View, type ScrollViewProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLayout } from '@/lib/layout';

import { Icon } from './Icon';
import { Press } from './Press';
import { T } from './Text';
import { C, MAX_W } from './theme';

/** Centred, width-capped content column with responsive gutters. */
export function Column({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { desktop, tablet } = useLayout();
  return <View style={[{ width: '100%', maxWidth: MAX_W, alignSelf: 'center', paddingHorizontal: desktop ? 32 : tablet ? 28 : 18 }, style]}>{children}</View>;
}

export function BackButton({ onPhoto, fallback = '/home' }: { onPhoto?: boolean; fallback?: string }) {
  return (
    <Press
      feedback="tap"
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback as never))}
      style={{
        width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
        backgroundColor: onPhoto ? 'rgba(20,20,20,0.5)' : C.card,
        borderWidth: onPhoto ? 0 : 1, borderColor: C.line,
      }}
    >
      <Icon name="arrow-left-bold" size={20} color={onPhoto ? C.chalk : C.ink} />
    </Press>
  );
}

/** Stack screen: safe top bar with back + title, scrolling body, optional pinned footer. */
export function StackPage({ title, children, footer, right, scroll = true, scrollProps }: {
  title?: string; children: ReactNode; footer?: ReactNode; right?: ReactNode; scroll?: boolean; scrollProps?: ScrollViewProps;
}) {
  const insets = useSafeAreaInsets();
  const bg = C.canvas;
  const body = <Column style={{ paddingTop: 8, paddingBottom: footer ? 24 : insets.bottom + 32 }}>{children}</Column>;
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingTop: insets.top + 8, paddingBottom: 10, backgroundColor: bg }}>
        <Column style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <BackButton />
          <T v="h2" color={C.ink} style={{ flex: 1 }} numberOfLines={1}>{title}</T>
          {right}
        </Column>
      </View>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" {...scrollProps}>{body}</ScrollView> : <View style={{ flex: 1 }}>{body}</View>}
      {footer && (
        <View style={{ paddingBottom: insets.bottom + 12, paddingTop: 12, backgroundColor: bg, borderTopWidth: 1, borderTopColor: C.line }}>
          <Column>{footer}</Column>
        </View>
      )}
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 30, marginBottom: 14 }}>
      <T v="h2" color={C.ink}>{title}</T>
      {right}
    </View>
  );
}
