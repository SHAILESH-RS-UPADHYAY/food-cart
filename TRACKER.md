# TRACKER — read first, update last (every session)

## Mandatory self-checks (owner's standing orders)
- [ ] Read CLAUDE.md + this file + active phase before doing anything.
- [ ] Before each design decision and each UI commit: **"Is this AI-generic?"** → if yes, fix now (DESIGN.md §5).
- [ ] Agency-grade, hand-crafted look: logo, screens, motion — nothing template.
- [ ] Plan → approve → code. No code outside the active phase.
- [ ] context7 checked before using any library API.
- [ ] Verified (tests / build / screenshot) before claiming done.
- [ ] Update this file before ending the session.

## Status
**Active phase:** Phase 0 — Brand sprint (waiting on client answers in PRD §8)

## Log
### 2026-10-17 — Session 1: setup & planning
Done:
- Surveyed skills hub; linked 23 project skills into `.claude/skills/`.
- Wrote CLAUDE.md, docs/PRD.md, docs/ARCHITECTURE.md, docs/DESIGN.md, docs/TOOLING.md, docs/PHASES.md.
- Decisions: Expo universal app (APK + web) · Next.js console · Supabase · DB-enforced order cap · "Token" design concept.
Next:
- Owner creates GitHub repo; `git init` + first commit of these docs.
- Get client answers (name, stalls, devices, auth, payment).
- Start Phase 0.

## Open decisions
1. Brand name ("Chowk" is working name).
2. Student auth method (CU email vs phone OTP — SMS costs money).
3. Add Supabase MCP once project exists.
