# Architecture (ARD) - Food Cart

Status: v1.0 - 2026-10-17

## 1. Shape
```
food-cart/                  single Expo SDK 58 app (no monorepo needed)
├─ src/app/                 Expo Router routes (student, staff, admin, auth, onboarding)
├─ src/ui/                  design system: tokens, primitives, icons, motion
├─ src/lib/                 sound, haptics, format, layout helpers
├─ src/data/                demo catalog (7 stalls, menus, images)
├─ src/api/                 one interface, two backends: demo engine + Supabase
├─ src/store/               zustand stores (session, cart, likes, settings)
├─ assets/                  fonts via npm, sounds (generated), images, brand
├─ supabase/                migrations, seed (generated from catalog)
├─ scripts/                 make-sounds.py, make-brand.mjs, gen-seed.mjs
└─ tests/                   node:test checks (logic + SQL via PGlite)
```

## 2. Decisions (ADRs)
**ADR-1 One Expo codebase for everything.** Student, staff and admin are route groups in one app.
APK + website now, iOS later is a build profile. Staff "on any device" falls out for free.

**ADR-2 (revised) No separate Next.js console.** One design system, one deploy, one data layer.
A marketing landing page can be added later if needed.

**ADR-3 Supabase (Postgres + Auth + Realtime).** Realtime order status is the core feature; RLS
isolates stalls; SQL functions keep the hot path one round-trip. No custom API server.

**ADR-4 Order cap enforced in the database.** `place_order()` locks the stall row
(`SELECT ... FOR UPDATE`), checks `active_orders < max_active_orders`, inserts, increments.
Raises `STALL_AT_CAPACITY` otherwise. App-side checks would race at 100 concurrent orders.
`active_orders` counts kitchen load: placed, accepted, preparing. Ready frees the slot.

**ADR-5 Prices computed server-side** from `menu_items`; clients send item ids + qty only.
Prices are whole rupees (int); payments convert to paise at the gateway.

**ADR-6 Transitions validated server-side** in `set_order_status()` (role + allowed-transition map),
mirrored in `src/api/rules.ts` for instant UI.

**ADR-7 Demo engine behind the same API.** With no `EXPO_PUBLIC_SUPABASE_URL`, the app runs a local
simulation (live crowd, autopilot kitchen, synthetic staff-side orders, cross-tab sync on web).
The demo never depends on network or credentials; adding env vars switches to real backend.

**ADR-8 Sound: generated WAVs.** Original kit synthesised by `scripts/make-sounds.py` (the Coucou
reference sounds are copyrighted; only their character was studied). Web plays through Web Audio
(zero latency), native through pooled expo-audio players.

## 3. Data model
- `profiles(id, name, phone, email, role)` - row created by trigger on sign-up; users may update `name` only.
- `stalls(id, name, ..., avg_prep_min, max_active_orders, active_orders, status)`
- `stall_staff(stall_id, user_id)`
- `menu_items(id, stall_id, name, category, price, available, ...)`
- `orders(id, stall_id, user_id, token_no, pickup_code, status, payment, total, note, timestamps)`
- `order_items(order_id, item_id, name, qty, price)` - name/price snapshotted.
Indexes: `orders(stall_id, status)`, `orders(user_id, created_at desc)`, `menu_items(stall_id, sort)`.

## 4. Realtime
Student: `orders` filtered `user_id=eq.<uid>`. Staff: `orders` filtered `stall_id=eq.<stall>`.
Everyone: `stalls` (status, active_orders) - one small table.

## 5. Scale notes
Supabase Pro + pooling; images on Unsplash CDN with width params; lists capped; no polling;
per-user cap of 3 active orders.

## 6. Delivery
- Web: `npx expo export -p web` (SPA, `web.output: single`) -> EAS Hosting / any static host.
- APK: `eas build -p android --profile preview` (buildType apk). Production AAB later.
- OTA: EAS Update. Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## 7. Pinned versions (2026-10-17)
expo 58.0.14, react-native 0.88.0, react 19.3.0, expo-router 58.0.23, reanimated 4.7.1,
worklets 0.13.0, gesture-handler 3.3.0, expo-audio 58.0.9, supabase-js 2.118.0, zustand 5.0.15.
