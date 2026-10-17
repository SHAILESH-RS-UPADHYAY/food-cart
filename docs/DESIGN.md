# Design system - Food Cart

Status: v2.0 - 2026-10-17 (owner direction: the AgentHub reference). This file outranks every design skill.

**Design read:** clean editorial monochrome. Paper, white, ink and hairlines; colour comes from the
food photography. Big tight Inter headlines with one italic-serif phrase, small spaced eyebrows,
grey body copy. Effects are quiet and physical: frosted glass on floating chrome, tactile solid
buttons, spatial lift on hover, graph-paper backdrop on sign-in screens.

## 1. Concept
- **Monochrome first.** Owner rejected black+yellow, bottle green, ultramarine and violet as
  AI-generic. Ink is the single interactive colour. **No blue or violet anywhere.**
- **The token.** Stalls hand out paper tokens; every order is one. Perforated edge, big serif
  number, stamped READY. The hero object of tracking and celebration.
- **The cart mark.** Logo = a street cart (scalloped awning, body, two wheels) in a black tile,
  "Food Cart" in Inter semibold, italic-serif tagline "Order ahead, skip the line".
- **Copy is English only** (owner, 2026-10-17). Warm and short; no Hinglish.

## 2. Colour (tokens in `src/ui/theme.ts`)
| Token | Hex | Use |
|---|---|---|
| ink / accent | #111111 | text, primary buttons, active pills, toggles |
| ink2 | #3F3F46 | secondary text |
| ink3 | #6B6B73 | tertiary text, the italic headline phrase (AA on canvas) |
| line | #E7E7E3 | hairlines |
| canvas | #F7F7F5 | page background (paper) |
| card | #FFFFFF | raised surfaces |
| saffron / saffronSoft | #F2A007 / #FFF5E1 | Last call deals only |
| leaf / live | #15803D / #22C55E | veg, open, ready, live dots |
| masala | #B45309 | busy, deal text |
| chilli | #D92D20 | kitchen full, errors, no access |

## 3. Type
- **Inter** 400/500/600/700 for everything. Headlines semibold with tight tracking
  (display 38/42 at -1.3, h1 29/34, h2 21/26).
- **Instrument Serif italic** for one emphasised phrase per headline: write `*phrase*` inside a
  `<T>` string. Also token numbers and the tagline.
- Eyebrows: label size, caps, +1.6 tracking. Tabular numerals for prices, timers, codes.

## 4. Shape and effects
Inputs 8, cards 14, sheets 20, buttons 10, chips full pill. Hairline borders, soft ink shadows.
- Glass (`src/ui/Surface.tsx`): blur + 72% fill + hairline + top highlight; tab bar and desktop nav.
- Tactile: solid buttons get an inner top light and a cast shadow.
- Spatial: stall cards lift 4 px with a deeper shadow on hover.
- PaperGrid: 32 px grid on onboarding, sign-in, no-access screens.

## 5. Motion (presets in `src/ui/motion.ts`)
- Press: scale 0.97, 120 ms CSS transition + tap sound on press-in (+ light haptic on commit).
- Pills/chips: 180 ms colour/scale; tabs never slide (content fades 160 ms).
- Entering content: FadeInDown 260 ms, 40 ms stagger, ease-out (0.23, 1, 0.32, 1).
- Sheets: spring { duration: 300, dampingRatio: 0.8 }.
- Rare tier (delight budget): logo build, add-to-cart fly, slide-to-order, token print,
  confetti, READY stamp. Only these may exceed 300 ms.
- Reduced motion: opacity only, no translate/scale/confetti.

## 6. Sound (original kit, `assets/sounds/`)
Soft marimba + glass, A major pentatonic, ~3 ms attacks, quiet UI levels, louder rare moments.
tap, pill, add, remove, like, unlike, open, close, swipe, tick, success, ready, stamp, coin,
error, alert (staff), intro (sonic logo).

## 7. Slop gate (run before every design decision and UI commit; any "yes" = redo)
- Would I mistake this for a template, shadcn default or AI Dribbble shot?
- Purple-blue gradient, glass card, glow, blob, or emoji anywhere?
- Default font instead of chosen one? Every radius/card identical with no rule?
- Generic copy ("Delicious food, delivered fast")? Copy must be campus-specific.
- Any em-dash in visible copy? Fake-precise numbers not backed by data?
- Anything moving just because it can?
- Works one-handed, in sunlight, on a slow network?
Then screenshot at 390 / 820 / 1440 px with Playwright and review.
