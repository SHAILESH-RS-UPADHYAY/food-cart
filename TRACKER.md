# TRACKER - read first, update last (every session)

## Mandatory self-checks (owner's standing orders)
- [ ] Read CLAUDE.md + this file + active phase before doing anything.
- [ ] Before each design decision and each UI commit: **"Is this AI-generic?"** -> if yes, fix now (docs/DESIGN.md slop gate).
- [ ] Agency-grade, hand-crafted look: logo, screens, motion - nothing template.
- [ ] context7 before any library API. Verify (typecheck, tests, screenshots) before claiming done.
- [ ] Update this file before ending the session.

## Locked decisions (owner, 2026-10-17)
- Name **Food Cart**. Stalls: HR Cafe, Creative Food, Books n Cooks, TJ, La Pino'z Pizza, Corner Cafe, Food Republic (FR).
- **Palette: White + Ultramarine** (owner picked it; black/yellow and bottle-green were both rejected as AI-generic). Tokens in `src/ui/theme.ts`. Onboarding + login are white.
- Type: Anek Latin (display), Schibsted Grotesk (UI), Shrikhand (wordmark, token numbers). Voice: campus Hinglish headlines, English subtitles.
- One Expo SDK 58 app = student + staff console + admin; Android APK + website. Supabase backend, on-device demo engine when no `.env`.
- GitHub: `SHAILESH-RS-UPADHYAY/food-cart`, branch `main`. Owner pushed commit `20a7c78` (before the palette/feature work below; that work is uncommitted).

## Done (session 2, 2026-10-17)
- Full MVP: 4-slide animated onboarding (logo build synced to sonic logo), phone/CU-email/other-email OTP login, home, stall pages, likes, cart + slide-to-order, demo online checkout, confetti celebration, live tracking with READY stamp, orders, profile, staff console, admin.
- Original 18-sound kit (`scripts/make-sounds.py`), Phosphor icons, 68 curated photos with blurhash + CC credits screen.
- Supabase: 2 migrations (schema, RLS, `place_order` with locked cap, transitions, deals, delete account) + generated seed. **13/13 tests pass** (`npm test`, PGlite).
- New this session: **Last call deals** (leftovers at lower price: home rail, stall section, deal pricing server-side, staff "Last call" tab), **web cookie consent** (animated cookie, bite + crunch, customise), **profile rebuilt** (edit profile, payment methods, alerts, help/FAQ, report a problem, privacy, terms, cookie prefs, delete account with typed confirm).
- Typecheck clean. Web production export worked earlier with zero console errors (re-run after these changes).

## Next (in order)
1. Visual QA of the new screens in the ultramarine palette (home deals rail, stall Last call, console Last call tab, cookie banner, profile, help, legal) at 390 / 1440 px with Playwright; fix anything off.
2. **APK**: local build gets to Reanimated's C++ step and dies on the Windows 260-char path limit. Last try (via `subst X:`) failed in 54 s; read `scratchpad/apk-gradle-short.log`. Options: enable Windows long paths (admin), or **EAS cloud build**: `! npx eas-cli login` then `npx eas-cli build -p android --profile preview` (`eas.json` is ready).
3. Web deploy: `npx expo export -p web` then `npx eas-cli deploy`.
4. Update docs (README, DESIGN.md palette section still describes the old yellow) and commit.
5. Supabase go-live when the client wants real cross-device orders (see docs/PHASES.md Phase 5).
