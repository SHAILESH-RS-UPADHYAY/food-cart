# Food Cart (working brand: "Chowk") — Claude operating manual

Campus pre-order + self-pickup for food stalls at Chandigarh University.
Students order ahead, get a live "ready" signal, walk up and collect. Stalls cap
active orders; at the cap the stall shows a witty "kitchen's full" state.
Client: MBA student (demo-driven). Scale target: 1 lakh+ users.

## Read order at the start of EVERY session
1. `TRACKER.md` — current phase, what's done, what's next, open decisions.
2. `docs/PHASES.md` — only the active phase section.
3. The doc the task touches: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/TOOLING.md`.
4. Skills/MCPs for the job: the matrix in `docs/TOOLING.md`. Project skills are linked in `.claude/skills/`.

## Non-negotiable rules (from the owner, 2026-10-17)
1. **Agency-grade, hand-crafted feel.** Every screen, logo and animation must look like a top
   agency spent months in Figma — custom, intentional, never template.
2. **Anti-AI-slop gate — run before every design decision and every UI commit:**
   ask "Would this read as AI-generated / generic?" If yes, fix it before moving on.
   Banned list and checks: `docs/DESIGN.md` § Slop gate.
3. **Plan before code.** No code outside an approved phase in `docs/PHASES.md`. Think twice on every decision; record non-obvious ones as ADRs in `docs/ARCHITECTURE.md`.
4. **Update `TRACKER.md` at the end of every session** (done / next / blockers). This is how sessions hand off.
5. **Priority:** website + Android APK first. iOS/App Store later from the same Expo codebase. No separate native code.
6. **Backend must stay lean and fast** at lakh-user scale: logic in Postgres (RLS + SQL functions), no N+1, indexed every filter.
7. Verify library APIs with **context7** before using them — don't code from memory.

## Overrides
- The global `tdo-company-standards` skill targets a different product (TDO OS). **Ignore its colours, radius and FastAPI/SQLite rules here.** Keep only: 44px touch targets, no emoji-as-icons, single scrollbar, WCAG AA.
- Conflict order: `docs/DESIGN.md` > taste-skill > every other design skill.
