# Design system - Food Cart

Status: locked v1.0 - 2026-10-17. This file outranks every design skill.

**Design read:** consumer ordering app for CU students and stall staff, in a bold editorial
street-food language: ink, chalk and one auto-rickshaw yellow, real food photography,
physical, quick motion. Dials: VARIANCE 7, MOTION 7, DENSITY 4.

## 1. Concept
- **Auto-rickshaw yellow + ink.** The black-and-yellow of Indian autos and turmeric: fast,
  local, unmistakable. Deliberately not Swiggy orange or Zomato red, and not the beige/brass
  "premium" default (banned by taste-skill).
- **The token.** Stalls hand out paper tokens; every order is one. Perforated edge, big number,
  stamped READY. The hero object of tracking and celebration.
- **The cart mark.** Logo = a street cart: scalloped awning (yellow/ink stripes), body, two wheels.
  The awning scallops double as a token's perforation.

## 2. Colour (tokens in `src/ui/theme.ts`)
| Token | Hex | Use |
|---|---|---|
| ink | #141414 | text, dark surfaces, primary dark buttons |
| ink2 | #3D3D3A | secondary text on light |
| ink3 | #6E6E68 | tertiary text (AA on canvas) |
| line | #E3E3DE | hairlines |
| canvas | #F1F1EC | app background |
| card | #FCFCFA | raised surfaces |
| haldi | #FFC21A | the one accent: primary CTA fill, active pill, token highlight. Text on it is ink, never white |
| haldiSoft | #FFF1C2 | accent tint backgrounds |
| leaf | #1F8A4C | veg mark, Ready, success (semantic only) |
| masala | #E07B10 | Busy (semantic only) |
| chilli | #D93A26 | Kitchen full, errors (semantic only) |
Night surfaces (onboarding, celebration, staff header): ink background, chalk text, haldi accent.

## 3. Type
- **Shrikhand** (brand moments only): wordmark, token numbers, celebration headline.
- **Schibsted Grotesk** 400/500/700/800/900 for everything else. Tight tracking on 800-900 headlines.
- Tabular numerals for prices, timers, codes. Never Inter/Poppins/Montserrat.

## 4. Shape
Interactive = full pill. Cards 22. Inputs 16. Sheets 28 (top). Token 18 with perforation.
Shadows tinted ink at <= 10% opacity; no glow, no glass, no gradients except photo scrims.

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
