import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { fx } from '@/lib/feedback';
import { Icon } from '@/ui/Icon';
import { CSS_EASE_OUT, enterRise } from '@/ui/motion';
import { Press } from '@/ui/Press';
import { StackPage } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, R } from '@/ui/theme';

const FAQ = [
  { q: 'How does pickup work?', a: 'Order from the app, wait for "Ready at the counter", then walk up and show your 4-digit code or QR at the counter. No queue to order, no queue to collect.' },
  { q: 'What does "Kitchen full" mean?', a: 'Each stall caps how many orders it cooks at once, so food stays hot and fast. At the cap, ordering pauses for a few minutes. Tap "Notify me when there’s room" and we ping you as soon as a slot opens.' },
  { q: 'What are Last call deals?', a: "Fresh food the stall made extra today, at a lower price. Plates are limited and the deal ends at the time shown. It's the same food, cheaper, and less of it goes to waste." },
  { q: 'Can I cancel an order?', a: 'Yes, until the stall accepts it. After that the kitchen has started, so talk to the counter.' },
  { q: 'How do I pay?', a: 'Pay at the counter with cash or any UPI app when you collect. Online UPI and card payments are coming soon.' },
  { q: 'Is everything vegetarian?', a: 'Yes. Every stall on Food Cart is pure veg, marked with the green dot.' },
  { q: 'I run a stall. How do I get the console?', a: 'Open Profile, then "Open the stall console". It works on any phone, tablet or laptop at the counter.' },
];

function Item({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <Animated.View entering={enterRise(index)} style={{ borderRadius: R.card, backgroundColor: C.card, paddingHorizontal: 16 }}>
      <Press onPress={() => { fx.pill(); setOpen(!open); }} feedback="none" scale={0.99} accessibilityRole="button" accessibilityState={{ expanded: open }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 }}>
        <T v="h3" style={{ flex: 1 }}>{q}</T>
        <Animated.View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }], transitionProperty: 'transform', transitionDuration: 220, transitionTimingFunction: CSS_EASE_OUT }}>
          <Icon name="caret-down-bold" size={16} color={C.ink3} />
        </Animated.View>
      </Press>
      {open && (
        <Animated.View entering={FadeIn.duration(200)} style={{ paddingBottom: 16 }}>
          <T v="body" color={C.ink2} style={{ lineHeight: 22 }}>{a}</T>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function Help() {
  return (
    <StackPage title="Help and FAQs">
      <View style={{ maxWidth: 720, gap: 10 }}>
        {FAQ.map((f, i) => <Item key={f.q} {...f} index={i} />)}
        <T v="small" color={C.ink3} style={{ marginTop: 12 }}>Still stuck? Write to support@foodcart.app and we reply the same day.</T>
      </View>
    </StackPage>
  );
}
