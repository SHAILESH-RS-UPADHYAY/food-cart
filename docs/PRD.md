# PRD - Food Cart (campus pre-order & pickup)

Status: v1.0 (MVP scope locked) - 2026-10-17 - client demo 2026-10-18

## 1. Problem
At Chandigarh University lunch rush, every stall queues 15-30 min. Students lose their break
standing in line, stalls lose sales to people who walk away, and staff can't see demand coming.

## 2. Goal
Order from your phone or laptop, get told when it's ready, walk up and collect. No queue to order,
a short one to collect.

**Demo success:** a student places an order (web or APK) -> it appears live on the stall console ->
staff marks Ready -> the student's token flips to READY with pickup code, sound and haptic.

## 3. Users & surfaces (one Expo app, three roles)
| Role | Surface | Core jobs |
|---|---|---|
| Student | Android APK + website (same code, responsive) | Onboard, log in, browse stalls, like, cart, order, pay (COD / demo online), track live, pick up with code |
| Stall staff | Same app, `/staff` (any device: phone, tablet, laptop) | Live order board, accept, mark ready, hand over, sold-out toggles, pause stall, set order cap |
| Admin (us) | Same app, `/admin` | All stalls at a glance, open/close any stall |

## 4. Demo stalls (real CU names; menus, prices, locations are demo data for the client to correct)
HR Cafe, Creative Food, Books n Cooks, TJ, La Pino'z Pizza, Corner Cafe, Food Republic (FR).

## 5. MVP scope
- **Onboarding:** 4 animated slides. Slide 1 = animated logo + sonic logo. Slides 2-4 show the
  workflow: pick and fill cart, watch it cook live, show code and collect.
- **Login:** phone number + OTP is primary; student email (`@cuchd.in`, gets a "Student" badge)
  or personal email as alternatives. Name on first login.
- **Home:** greeting, live campus rush, search, category pills, "fastest right now" rail, all stalls
  with live status (Open, Busy, Kitchen full, Paused) and live ETA.
- **Stall page:** hero, live capacity meter, sticky menu sections, add/stepper, like dishes.
- **Order cap:** stall sets `max_active_orders`. At the cap, ordering is blocked atomically in the
  database and the stall shows a witty kitchen-full state with an estimated wait.
- **Likes:** stalls and dishes, own tab.
- **Cart:** one stall per cart, kitchen note, ETA, bill, payment choice, slide-to-order.
- **Payment:** Cash/UPI at counter (real flow). "Pay online" runs a clearly labelled demo checkout
  (UPI / card) to show the future interface. No money moves.
- **Celebration:** confetti, printed token, success sound and haptic on order placed.
- **Tracking:** token with number, pickup code + QR, live timeline, READY stamp.
- **Sound + haptics:** original sound kit (taps, pills, add, like, sheets, success, ready, staff
  alert), toggles in profile.
- **Staff console:** board (New, Cooking, Ready), new-order chime, actions, cap and pause controls,
  menu availability. Demo mode generates realistic incoming orders.
- **Responsive:** phone (bottom tab bar), tablet, desktop (top nav, grids, side cart).

## 6. Post-MVP
Razorpay live payments + refunds, push notifications, pickup slots, ratings, stall analytics,
Play Store + App Store release, multi-campus, dark mode.

## 7. Non-functional
- Order placement p95 < 300 ms; status fan-out < 1 s (Supabase Realtime).
- 1 lakh+ registered users, ~10k concurrent at peak; stall list = 1 small table read.
- 60 fps on 2-3 GB RAM Android; animate transform/opacity only; reduced motion honoured.
- WCAG AA contrast, 44 px touch targets, no emoji-as-icon, zero em-dashes in UI copy.

## 8. Humour bank (kitchen full) - warm, campus, never mean
- "Kitchen's at full masala. Back in about {n} min."
- "{max} orders deep. Chef has entered beast mode."
- "Tawa's packed. Give it {n} min and try again."
