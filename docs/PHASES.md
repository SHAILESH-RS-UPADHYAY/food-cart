# Phases

Each phase ends with: slop gate (UI), typecheck + tests, `TRACKER.md` updated.

## Phase 0 - Brand + foundations  ✅ in session 2
Name (Food Cart), palette, type, logo mark, sound kit, icons, tokens, real photos, menus.

## Phase 1 - App skeleton + data  ✅ in session 2
Expo SDK 58 app, routes, stores, demo engine, Supabase schema + RLS + functions + seed, SQL tests.

## Phase 2 - Student app  ✅ in session 2
Onboarding (4 animated slides), login (phone OTP primary, student/personal email), home, stall,
likes, cart, demo payment, celebration, tracking, orders, profile, credits.

## Phase 3 - Staff console + admin  ✅ in session 2
Board with live columns, chime, actions, cap/pause, menu availability, admin overview.

## Phase 4 - QA + release prep  ✅ in session 2
Web export, Playwright screenshots (390/820/1440), visual fixes, eas.json, icons/splash, docs.

## Phase 5 - Go live (needs owner accounts)
1. `npx eas-cli login` -> `npx eas-cli build -p android --profile preview` (APK link).
2. Web: `npx expo export -p web` then `npx eas-cli deploy` (or any static host).
3. Supabase: create project, run `supabase/migrations/*.sql` + `supabase/seed.sql`,
   put URL + anon key in `.env`, create staff users, `select assign_staff(email, stall)`.
4. SMS provider for real phone OTP (MSG91 / Twilio via Supabase Auth). Until then demo OTP.

## Phase 6 - After the demo
Razorpay live payments + webhooks, push notifications on Ready, ratings, analytics,
Play Store listing, iOS build, dark mode.
