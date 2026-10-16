import { useMemo, useState } from 'react';
import { Platform, ScrollView, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { api, useDeals, useStalls, useUnavailable } from '@/api';
import { etaMinutes, liveDeal, percentOff, stallState } from '@/api/rules';
import { CATEGORIES, ITEMS, STALLS, itemById, stallById, type Category } from '@/data/catalog';
import { firstName, greeting } from '@/lib/format';
import { useLayout, useTabInsets } from '@/lib/layout';
import { useSession } from '@/store/session';
import { DealCard, ItemRow, StallCard, StallMini } from '@/ui/cards';
import { Hairline } from '@/ui/bits';
import { Icon } from '@/ui/Icon';
import { CSS_EASE_OUT, enterRise } from '@/ui/motion';
import { Pill } from '@/ui/Pill';
import { Press } from '@/ui/Press';
import { ReplaceCartSheet } from '@/ui/ReplaceCartSheet';
import { Column, SectionTitle } from '@/ui/Screen';
import { T } from '@/ui/Text';
import { C, F, R } from '@/ui/theme';

const norm = (s: string) => s.toLowerCase().normalize('NFKD');

export default function Home() {
  const user = useSession((s) => s.user);
  const live = useStalls();
  const unavailable = useUnavailable();
  const deals = useDeals();
  const { width, desktop, tablet } = useLayout();
  const pad = useTabInsets();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Category | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const g = greeting();

  const cooking = Object.values(live).reduce((n, s) => n + s.active, 0);
  const cols = desktop ? 3 : tablet ? 2 : 1;
  const gutter = desktop ? 32 : tablet ? 28 : 18;
  const contentW = Math.min(width, 1180) - gutter * 2;
  const cardW = (contentW - (cols - 1) * 20) / cols;

  const fastest = useMemo(
    () => STALLS.filter((s) => ['open', 'busy'].includes(stallState(live[s.id])))
      .sort((a, b) => etaMinutes(a.avgPrepMin, live[a.id]) - etaMinutes(b.avgPrepMin, live[b.id])).slice(0, 5),
    [live],
  );

  const dealList = Object.values(deals)
    .filter((d) => liveDeal(d) && !unavailable.has(d.itemId))
    .sort((a, b) => a.endsAt - b.endsAt);
  const maxOff = dealList.reduce((m, d) => Math.max(m, percentOff(itemById[d.itemId].price, d.price)), 0);
  const isBlocked = (stallId: string) => ['full', 'paused', 'closed'].includes(stallState(live[stallId]));

  const q = norm(query.trim());
  const filtering = !!q || !!cat;
  const dishes = useMemo(() => {
    if (!filtering) return [];
    return ITEMS.filter((i) => (!cat || i.category === cat)
      && (!q || norm(`${i.name} ${i.description} ${i.category} ${stallById[i.stallId].name}`).includes(q))).slice(0, 30);
  }, [q, cat]);
  const stalls = filtering
    ? STALLS.filter((s) => dishes.some((d) => d.stallId === s.id) || (!!q && norm(`${s.name} ${s.tagline}`).includes(q)))
    : STALLS;

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: pad.top, paddingBottom: pad.bottom }}>
        <Column>
          <Animated.View entering={enterRise(0)} style={{ marginTop: desktop ? 28 : 10 }}>
            <T v="label" color={C.ink3}>{g.hello.toUpperCase()}, {firstName(user?.name ?? '').toUpperCase()}</T>
            <T v="display" style={desktop ? { fontSize: 56, lineHeight: 58, letterSpacing: -2.4, marginTop: 6 } : { marginTop: 6 }}>{g.head}</T>
            <T v="body" color={C.ink2} style={{ marginTop: 8, fontSize: 16 }}>{g.sub}</T>
          </Animated.View>

          <Animated.View entering={enterRise(1)} style={{ flexDirection: desktop ? 'row' : 'column', gap: 12, marginTop: 20, alignItems: desktop ? 'center' : 'stretch' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 16, borderRadius: R.pill, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, flex: desktop ? 1 : undefined }}>
              <Icon name="magnifying-glass-bold" size={20} color={C.ink2} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Momos, cold coffee, pizza..."
                placeholderTextColor={C.ink3}
                accessibilityLabel="Search dishes and stalls"
                returnKeyType="search"
                style={[{ flex: 1, height: '100%', fontFamily: F.medium, fontSize: 16, color: C.ink }, Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null]}
              />
              {!!query && (
                <Press onPress={() => setQuery('')} feedback="tap" accessibilityLabel="Clear search" style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x-bold" size={13} color={C.ink2} />
                </Press>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 18, borderRadius: R.pill, backgroundColor: C.accentTint, alignSelf: desktop ? 'auto' : 'flex-start' }}>
              <View style={{ width: 9, height: 9 }}>
                <Animated.View style={{ position: 'absolute', inset: 0, borderRadius: 5, backgroundColor: '#5BD38B', animationName: { from: { opacity: 0.6, transform: [{ scale: 1 }] }, to: { opacity: 0, transform: [{ scale: 2.6 }] } }, animationDuration: '1600ms', animationIterationCount: 'infinite', animationTimingFunction: CSS_EASE_OUT }} />
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#5BD38B' }} />
              </View>
              <T v="bodyStrong" color={C.accent} tab>{cooking || 'Many'} orders on the tawa right now</T>
            </View>
          </Animated.View>
        </Column>

        <Animated.View entering={enterRise(2)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: gutter + Math.max(0, (width - 1180) / 2), paddingVertical: 18 }}>
            <Pill label="All" icon="squares-four-bold" active={!cat} onPress={() => setCat(null)} />
            {CATEGORIES.map((c) => (
              <Pill key={c.name} label={c.name} photo={c.photo} active={cat === c.name} onPress={() => setCat(cat === c.name ? null : c.name)} />
            ))}
          </ScrollView>
        </Animated.View>

        <Column>
          {filtering ? (
            <View key={`${q}|${cat}`}>
              <SectionTitle title={dishes.length ? `${dishes.length} dish${dishes.length === 1 ? '' : 'es'}` : 'Nothing matches yet'} />
              {!dishes.length && (
                <T v="body" color={C.ink2}>Kuch nahi mila. Try "chai", "momos" or a stall name.</T>
              )}
              <View style={{ flexDirection: desktop ? 'row' : 'column', flexWrap: 'wrap', columnGap: 28 }}>
                {dishes.map((d, i) => (
                  <Animated.View key={d.id} entering={enterRise(i)} style={{ width: desktop ? (contentW - 28) / 2 : '100%' }}>
                    {(i > 0 && !desktop) || (desktop && i > 1) ? <Hairline /> : null}
                    <ItemRow item={d} showStall unavailable={unavailable.has(d.id)} blocked={['full', 'paused', 'closed'].includes(stallState(live[d.stallId]))} onConflict={setConflict} />
                  </Animated.View>
                ))}
              </View>
            </View>
          ) : (
            <>
              <SectionTitle title="Sabse jaldi ready" />
            </>
          )}
        </Column>

        {!filtering && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: gutter + Math.max(0, (width - 1180) / 2) }}>
            {fastest.map((s, i) => (
              <Animated.View key={s.id} entering={enterRise(i, 120)}>
                <StallMini stall={s} live={live[s.id]} width={desktop ? 250 : 200} />
              </Animated.View>
            ))}
          </ScrollView>
        )}

        {!filtering && dealList.length > 0 && (
          <>
            <Column>
              <SectionTitle title="Last call deals" right={<T v="label" color={C.accent} tab>Up to {maxOff}% off</T>} />
              <T v="body" color={C.ink2} style={{ marginTop: -6, marginBottom: 14 }}>Aaj ka extra, kam daam mein. Fresh from today's batch, limited plates.</T>
            </Column>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: gutter + Math.max(0, (width - 1180) / 2) }}>
              {dealList.map((d, i) => (
                <Animated.View key={d.itemId} entering={enterRise(i, 160)}>
                  <DealCard item={itemById[d.itemId]} deal={d} width={desktop ? 240 : 208} blocked={isBlocked(d.stallId)} onConflict={setConflict} />
                </Animated.View>
              ))}
            </ScrollView>
          </>
        )}

        <Column>
          <SectionTitle title={filtering ? 'Stalls with matches' : 'Saare stalls'} right={!filtering ? <T v="label" color={C.ink3}>{STALLS.length} on campus</T> : undefined} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
            {stalls.map((s, i) => (
              <Animated.View key={s.id} entering={enterRise(i, 160)}>
                <StallCard stall={s} live={live[s.id]} width={cardW} />
              </Animated.View>
            ))}
          </View>
          {api.mode === 'demo' && (
            <T v="small" color={C.ink3} center style={{ marginTop: 32 }}>Demo build. Menus, prices and stall locations are samples.</T>
          )}
        </Column>
      </ScrollView>
      <ReplaceCartSheet itemId={conflict} onClose={() => setConflict(null)} />
    </View>
  );
}
