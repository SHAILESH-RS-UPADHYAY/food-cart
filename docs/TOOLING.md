# Tooling — which MCP and which skill for which job

Skills hub: `C:\Users\DELL\Favorites\github_skills` (index: `INDEX.md`).
Project-linked skills (junctions): `.claude/skills/` — expo-router, expo-animation, expo-native-ui,
expo-data-fetching, expo-design-system, expo-dev-client, expo-project-structure, eas-workflows,
eas-app-stores, eas-update, react-native-best-practices, supabase, supabase-postgres-best-practices,
nextjs-app-router-patterns, turborepo-caching, tanstack-query-expert, taste-skill, soft-skill, brandkit,
writing-plans, test-driven-development, razorpay-one-time-payment, razorpay-webhook.
Global skills already on: design-hybrid, design-taste-frontend, ui-ux-pro-max, frontend-design,
tailwind-design-system, ui-visual-validator, react-best-practices, react-component-performance,
security-auditor, wcag-audit-patterns, code-reviewer, systematic-debugging,
verification-before-completion, webapp-testing.

## Job → skills → MCPs
| Job | Skills (in order) | MCPs |
|---|---|---|
| Brand, logo, palette, type | design-hybrid → taste-skill → brandkit (direction only) → ui-ux-pro-max (palette/contrast) | better-icons, stitch (moodboards only) |
| Student app screens | DESIGN.md → taste-skill → soft-skill → expo-native-ui → expo-design-system → react-native-best-practices | context7, better-icons |
| App motion | DESIGN.md §4 → expo-animation → react-native-best-practices (Reanimated section) | context7 |
| Routing / structure | expo-router, expo-project-structure, nextjs-app-router-patterns, turborepo-caching | context7, next-devtools |
| Data & realtime | supabase → supabase-postgres-best-practices → expo-data-fetching / tanstack-query-expert | context7 (+ Supabase MCP, see below) |
| Console UI | design-hybrid (PRODUCT mode) → tailwind-design-system → frontend-design | shadcn (base primitives, restyled), magicui/21st-dev (reference only), next-devtools |
| Landing page | design-hybrid (MARKETING mode) → taste-skill → `design-hybrid/references/motion-patterns.md` | gsap-master, magicui (ideas only) |
| Builds & release | eas-workflows → expo-dev-client → eas-app-stores → eas-update | context7 |
| Payments (later) | razorpay-one-time-payment → razorpay-webhook (verify vs razorpay.com/docs) | context7 |
| Testing & visual QA | test-driven-development, webapp-testing, ui-visual-validator, wcag-audit-patterns | playwright, claude-in-chrome |
| Review / hardening | code-reviewer, security-auditor, verification-before-completion | — |
| Planning / big decisions | writing-plans | sequential-thinking |

## MCP verdicts
| MCP | Use? | Why |
|---|---|---|
| context7 | **Always** | Expo/Supabase/Next APIs move fast; check before coding |
| playwright | **Yes** | Web E2E + screenshot review for the slop gate |
| better-icons | **Yes** | One consistent icon set |
| shadcn | **Yes, console** | Accessible primitives; must be restyled to our tokens |
| next-devtools | **Yes, console** | Next.js errors/routes in dev |
| gsap-master | **Landing only** | Scroll storytelling; never in the app |
| sequential-thinking | **For ADRs** | Hard trade-offs |
| stitch | **Exploration only** | Fast layout ideas; output is generic — never ship it |
| magicui, 21st-dev-magic | **Reference only** | Recognisable template look; borrow mechanics, not visuals |
| figma-developer | **If a Figma file exists** | Otherwise idle |
| claude-in-chrome | **Manual checks** | Real-browser poking |
| Claude Docs / Notion / Drive | **Only to share docs with client** | Not part of dev loop |
| threejs | **No** | Weight, no product need |
| filesystem | **No** | Built-in file tools cover it |

## To add (recommended)
- **Supabase MCP** (official, `@supabase/mcp-server-supabase`) — run migrations, inspect tables, generate types. Add once the Supabase project exists; use a dev project, read-only on prod.
- **Expo MCP** (official, EAS) — build status / docs. Verify availability at Phase 0.

## Skill repos considered and not cloned
Hub already vendors the official Supabase and Vercel skills (via agentic-awesome-skills) and the
official Expo + Callstack packs. Nothing else needed was missing, so nothing new was cloned.
