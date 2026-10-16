// Render the brand assets (app icon, adaptive icon layers, splash, favicon) from the shared mark.
// Run: node scripts/make-brand.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

import { Resvg } from '@resvg/resvg-js';

import { markSvg } from '../src/ui/logo-geometry.ts';

const INK = '#141414';
const HALDI = '#FFC21A';
const CHALK = '#F4F4EF';
const SHRIKHAND = 'node_modules/@expo-google-fonts/shrikhand/400Regular/Shrikhand_400Regular.ttf';
const OUT = 'assets/brand';
mkdirSync(OUT, { recursive: true });

function png(name, svg, width) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { fontFiles: [SHRIKHAND], loadSystemFonts: false } });
  writeFileSync(`${OUT}/${name}.png`, r.render().asPng());
  console.log(name, width);
}

// App icon: ink cart on auto-rickshaw yellow, the mark sized to read at 48 px.
png('icon', markSvg({ awning: INK, cart: INK, bg: HALDI, pad: 22 }), 1024);
// Android adaptive: foreground inside the 66% safe zone, flat yellow background, monochrome for themed icons.
png('adaptive-foreground', markSvg({ awning: INK, cart: INK, pad: 52 }), 1024);
png('adaptive-monochrome', markSvg({ awning: '#FFFFFF', cart: '#FFFFFF', pad: 52 }), 1024);
png('adaptive-background', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${HALDI}"/></svg>`, 1024);
png('favicon', markSvg({ awning: INK, cart: INK, bg: HALDI, pad: 10 }), 196);

// Splash: yellow awning, chalk cart and the wordmark, on ink (the onboarding opens on the same ink).
const mark = markSvg({ awning: HALDI, stripe: CHALK, cart: CHALK, size: 600 }).replace(/^<svg[^>]*>/, '').replace('</svg>', '');
png('splash', `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760">
  <svg x="0" y="0" width="600" height="600" viewBox="4 6 120 120">${mark}</svg>
  <text x="300" y="712" text-anchor="middle" font-family="Shrikhand" font-size="118" fill="${CHALK}">food cart</text>
</svg>`, 600);
