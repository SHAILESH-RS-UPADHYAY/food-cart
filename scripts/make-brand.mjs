// Render the brand assets (app icon, adaptive icon layers, splash, favicon) from the shared mark.
// Run: node scripts/make-brand.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

import { Resvg } from '@resvg/resvg-js';

import { markSvg } from '../src/ui/logo-geometry.ts';

const INK = '#111111';
const ACCENT = '#111111';
const SOFT = '#BDBDB7';
const WHITE = '#FFFFFF';
const SHRIKHAND = 'node_modules/@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf';
const OUT = 'assets/brand';
mkdirSync(OUT, { recursive: true });

function png(name, svg, width) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: [SHRIKHAND], loadSystemFonts: false } });
  writeFileSync(`${OUT}/${name}.png`, r.render().asPng());
  console.log(name, width);
}

// App icon: white cart under a white-and-periwinkle awning, on ultramarine.
png('icon', markSvg({ awning: WHITE, stripe: SOFT, cart: WHITE, bg: ACCENT, pad: 22 }), 1024);
// Android adaptive: foreground inside the 66% safe zone, flat ultramarine background, monochrome for themed icons.
png('adaptive-foreground', markSvg({ awning: WHITE, stripe: SOFT, cart: WHITE, pad: 52 }), 1024);
png('adaptive-monochrome', markSvg({ awning: '#FFFFFF', cart: '#FFFFFF', pad: 52 }), 1024);
png('adaptive-background', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${ACCENT}"/></svg>`, 1024);
png('favicon', markSvg({ awning: WHITE, stripe: SOFT, cart: WHITE, bg: ACCENT, pad: 10 }), 196);

// Splash: the brand mark and wordmark on white (the onboarding opens on the same white).
const mark = markSvg({ awning: ACCENT, stripe: SOFT, cart: INK, size: 600 }).replace(/^<svg[^>]*>/, '').replace('</svg>', '');
png('splash', `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">
  <svg x="0" y="0" width="600" height="600" viewBox="4 6 120 120">${mark}</svg>
  <text x="300" y="712" text-anchor="middle" font-family="Inter" font-weight="600" font-size="104" letter-spacing="-4" fill="${INK}">Food Cart</text>
</svg>`, 600);
