import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { StackPage } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, R } from '@/ui/theme';

// Plain-language drafts for the MVP. Have them reviewed before the public launch.
const DOCS = {
  privacy: {
    title: 'Privacy policy',
    sections: [
      ['What we collect', 'Your first name, your mobile number or email (to log in), your orders, favourites and app settings. If you allow analytics on the website, anonymous usage data.'],
      ['Why', 'To place your orders with the stall, show your token and pickup code, and tell you when food is ready. Stalls see your first name and order, never your number or email.'],
      ['What we never do', 'We do not sell your data, show ads, or share it with anyone outside the stalls you order from and the services that run the app.'],
      ['Payments', 'Pay-at-counter orders store no payment data. Online payments, when live, are handled by a licensed payment gateway; we never see your card or UPI PIN.'],
      ['Deleting your data', 'Profile, then Delete account removes your profile, favourites and saved cart. Past orders stay with the stall without your name, as their sales record.'],
      ['Contact', 'privacy@foodcart.app'],
    ],
  },
  terms: {
    title: 'Terms of use',
    sections: [
      ['The service', 'Food Cart lets you order ahead from food stalls at Chandigarh University and collect the order yourself. Stalls prepare and sell the food; Food Cart passes your order along.'],
      ['Orders', 'An order is confirmed when the stall accepts it. Stalls may decline an order, for example when an item runs out. You can cancel until the stall accepts.'],
      ['Pickup', 'Collect your order with your pickup code. Uncollected orders may be released by the stall after it closes.'],
      ['Prices and deals', 'Prices are set by each stall. Last call deals are limited by plates and time, and end when either runs out.'],
      ['Fair use', 'Up to three orders can be cooking for you at once, so the queue stays fair for everyone.'],
      ['Contact', 'support@foodcart.app'],
    ],
  },
} as const;

export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc?: string }>();
  const d = DOCS[doc === 'terms' ? 'terms' : 'privacy'];
  return (
    <StackPage title={d.title}>
      <View style={{ maxWidth: 720, gap: 12 }}>
        <View style={{ padding: 14, borderRadius: R.input, backgroundColor: C.accentTint }}>
          <T v="small" color={C.accent}>Draft for the MVP. Last updated 17 Oct 2026.</T>
        </View>
        {d.sections.map(([h, b]) => (
          <View key={h} style={{ gap: 4, marginTop: 8 }}>
            <T v="h3">{h}</T>
            <T v="body" color={C.ink2} style={{ lineHeight: 22 }}>{b}</T>
          </View>
        ))}
      </View>
    </StackPage>
  );
}
