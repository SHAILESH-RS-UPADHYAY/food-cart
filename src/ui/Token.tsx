import { View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

import { token } from '@/lib/format';

import { CSS_EASE_OUT } from './motion';
import { T } from './Text';
import { C, R, SHADOW } from './theme';

const NOTCH = 22;

/** Perforation: a dashed rule with two half-circle bites in the page colour. */
function Perforation({ bg }: { bg: string }) {
  return (
    <View style={{ height: NOTCH, justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: -NOTCH / 2, width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: bg }} />
      <View style={{ position: 'absolute', right: -NOTCH / 2, width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: bg }} />
      <View style={{ marginHorizontal: NOTCH, flexDirection: 'row', justifyContent: 'space-between' }}>
        {Array.from({ length: 18 }, (_, i) => <View key={i} style={{ width: 6, height: 2, borderRadius: 1, backgroundColor: 'rgba(15,31,25,0.18)' }} />)}
      </View>
    </View>
  );
}

type Props = {
  stall: string;
  tokenNo: number;
  code: string;
  qrValue: string;
  /** e.g. "Ready", "Collected" */
  stamp?: string;
  stampTone?: 'stamp' | 'chilli';
  /** token-slip paper colour (the stall's) */
  paper?: string;
  footer?: React.ReactNode;
  bg?: string;
  style?: ViewStyle;
};

/** The paper token every CU stall hands out, made digital. The stamp slams in when it appears. */
export function Token({ stall, tokenNo, code, qrValue, stamp, stampTone = 'stamp', paper = C.card, footer, bg = C.canvas, style }: Props) {
  const tone = stampTone === 'stamp' ? C.accent : C.chilli;
  return (
    <View style={[{ backgroundColor: paper, borderRadius: R.token, overflow: 'hidden' }, SHADOW.card, style]}>
      <View style={{ padding: 22, paddingBottom: 14 }}>
        <T v="label" color={C.ink2}>{stall.toUpperCase()}</T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
          <View>
            <T v="small" color={C.ink2}>Token</T>
            <T v="brand" size={58} color={C.accent} tab>{token(tokenNo)}</T>
          </View>
          {stamp && (
            <Animated.View
              key={stamp}
              style={{
                borderWidth: 3, borderColor: tone, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16,
                transform: [{ rotate: '-10deg' }],
                animationName: {
                  '0%': { opacity: 0, transform: [{ rotate: '-18deg' }, { scale: 1.9 }] },
                  '70%': { opacity: 1, transform: [{ rotate: '-9deg' }, { scale: 0.94 }] },
                  '100%': { opacity: 1, transform: [{ rotate: '-10deg' }, { scale: 1 }] },
                },
                animationDuration: '380ms', animationTimingFunction: CSS_EASE_OUT,
              }}
            >
              <T v="h2" color={tone} style={{ letterSpacing: 1.5 }}>{stamp.toUpperCase()}</T>
            </Animated.View>
          )}
        </View>
      </View>
      <Perforation bg={bg} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, padding: 22, paddingTop: 14 }}>
        <View style={{ flex: 1 }}>
          <T v="small" color={C.ink2}>Pickup code</T>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            {code.split('').map((d, i) => (
              <View key={i} style={{ width: 40, height: 50, borderRadius: 12, backgroundColor: 'rgba(252,253,252,0.75)', alignItems: 'center', justifyContent: 'center' }}>
                <T v="h1" tab>{d}</T>
              </View>
            ))}
          </View>
        </View>
        <View style={{ padding: 6, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.line }}>
          <QRCode value={qrValue} size={76} color={C.ink} backgroundColor={C.card} />
        </View>
      </View>
      {footer}
    </View>
  );
}
