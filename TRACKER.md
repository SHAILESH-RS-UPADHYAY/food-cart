# TRACKER - read first, update last (every session)

## Mandatory self-checks (owner's standing orders)
- [ ] Read CLAUDE.md + this file + active phase before doing anything.
- [ ] Before each design decision and each UI commit: **"Is this AI-generic?"** -> if yes, fix now (docs/DESIGN.md slop gate).
- [ ] Agency-grade, hand-crafted look: logo, screens, motion - nothing template.
- [ ] context7 before any library API. Verify (typecheck, tests, screenshots) before claiming done.
- [ ] Update this file before ending the session.

## Locked decisions (owner, 2026-10-17)
- Name **Food Cart**. Stalls: HR Cafe, Creative Food, Books n Cooks, TJ, La Pino'z Pizza, Corner Cafe, Food Republic (FR).
- **Look: AgentHub-style monochrome** (paper, white, ink, hairlines). Rejected as AI-generic: black+yellow, bottle green, ultramarine, violet. **No blue anywhere.** Saffron only for Last call deals. Effects: glass chrome, tactile buttons, hover lift, graph-paper sign-in. See docs/DESIGN.md v2.
- Type: Inter + Instrument Serif italic for one phrase per headline (`*phrase*` in a `<T>` string).
- **Copy: English only.** No Hinglish anywhere (owner, 2026-10-17).
- Three panels in one Expo SDK 58 app: student, stall console (one login per stall), Food Cart HQ (developers). Supabase backend; on-device demo engine when no `.env`.
- **Website first. APK on hold until the owner says go.**
- GitHub: `SHAILESH-RS-UPADHYAY/food-cart`, branch `main`. Owner pushed `20a7c78`; everything since is uncommitted.

## Done (session 3, 2026-10-17)
- Restyle to the AgentHub reference: tokens, Inter + Instrument Serif, monochrome logo + brand PNGs, glass/tactile/spatial effects, PaperGrid on auth screens.
- Staff: add dishes and set prices (console Menu + HQ Menu); demo + SQL `upsert_menu_item` (staff of that stall or HQ only) + test.
- Team access: one demo login per stall + HQ (docs/DEMO_LOGINS.md), wrong-password count + 30 s lockout, every demo read/write guarded like SQL `is_staff_of`, NoAccess screens for wrong stall / non-HQ.
- Staff alerts: new original "order" jingle (`scripts/make-sounds.py`), toast + outlined card, "sound is off, tap to turn on" bar after a page refresh.
- Video-ready demo: autopilot skips stalls with a live console (shared heartbeat), walk-ins go to Cooking and clear themselves, so New only shows real online orders.
- All copy English. Responsive sweep: 0 overflow at 360/390/768/1024/1440 across all student screens, every console view and every HQ tab. **14/14 tests pass.** Typecheck clean, web export clean, end-to-end order flow verified across two windows.

## Next (in order)
1. Owner records the client video (script in docs/DEMO_LOGINS.md).
2. Web deploy so the client gets a link: `npx eas-cli deploy` after `npx expo export -p web` (needs `! npx eas-cli login`).
3. Commit this session's work (owner to say when).
4. APK, when the owner says go: local build dies on the Windows 260-char path limit; use EAS cloud build (`npx eas-cli build -p android --profile preview`).
5. Supabase go-live (docs/PHASES.md Phase 5): create staff users in Auth, then `assign_staff`.
