// The Food Cart mark on a 120-unit grid. Shared by the app (react-native-svg) and
// scripts/make-brand.mjs (app icon, splash, favicon), so every rendering is the same drawing.
// Pieces are separate so the onboarding can build the cart one part at a time.

export const VIEWBOX = '4 6 120 120';

/** Four awning stripes, each a roof segment with its scallop: one per note of the sonic logo. */
export const TABS = [0, 1, 2, 3].map((i) => {
  const x0 = 14 + 23 * i;
  const x1 = x0 + 23;
  const scallop = `V35A11.5 11.5 0 0 1 ${x0} 35Z`;
  if (i === 0) return `M${x0} 35V28.5A6.5 6.5 0 0 1 ${x0 + 6.5} 22H${x1}${scallop}`;
  if (i === 3) return `M${x0} 35V22H${x1 - 6.5}A6.5 6.5 0 0 1 ${x1} 28.5${scallop}`;
  return `M${x0} 35V22H${x1}${scallop}`;
});

export const POLES = ['M22.5 44h5v16h-5z', 'M92.5 44h5v16h-5z'];

/** Cart body with a counter ledge cut out (even-odd fill). */
export const BODY = 'M25 58H95A9 9 0 0 1 104 67V82A9 9 0 0 1 95 91H25A9 9 0 0 1 16 82V67A9 9 0 0 1 25 58Z'
  + 'M25.5 66H94.5A1.6 1.6 0 0 1 94.5 69.2H25.5A1.6 1.6 0 0 1 25.5 66Z';

export const HANDLE = 'M104 69L113 60';

/** Spoked cart wheel centred on (0,0): ring (even-odd), hub, six spokes (stroke). */
export const WHEEL_RING = 'M0 -11A11 11 0 1 1 0 11A11 11 0 1 1 0 -11ZM0 -7.4A7.4 7.4 0 1 0 0 7.4A7.4 7.4 0 1 0 0 -7.4Z';
export const WHEEL_HUB = 'M0 -3A3 3 0 1 1 0 3A3 3 0 1 1 0 -3Z';
export const WHEEL_SPOKES = 'M0 -8L0 8M-6.93 -4L6.93 4M-6.93 4L6.93 -4';
export const WHEEL_CENTERS: [number, number][] = [[35, 98], [85, 98]];

/** Full mark as an SVG string (for the build scripts). `stripe` colours tabs 2 and 4. */
export function markSvg({ awning, stripe = awning, cart, size = 1024, bg, pad = 0 }:
  { awning: string; stripe?: string; cart: string; size?: number; bg?: string; pad?: number }) {
  const [vx, vy, vw, vh] = VIEWBOX.split(' ').map(Number);
  const box = `${vx - pad} ${vy - pad} ${vw + pad * 2} ${vh + pad * 2}`;
  const wheels = WHEEL_CENTERS.map(([x, y]) => `<g transform="translate(${x} ${y})">`
    + `<path fill-rule="evenodd" fill="${cart}" d="${WHEEL_RING}"/><path fill="${cart}" d="${WHEEL_HUB}"/>`
    + `<path stroke="${cart}" stroke-width="1.9" stroke-linecap="round" d="${WHEEL_SPOKES}"/></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${box}">`
    + (bg ? `<rect x="${vx - pad}" y="${vy - pad}" width="${vw + pad * 2}" height="${vh + pad * 2}" fill="${bg}"/>` : '')
    + TABS.map((d, i) => `<path fill="${i % 2 ? stripe : awning}" d="${d}"/>`).join('')
    + POLES.map((d) => `<path fill="${cart}" d="${d}"/>`).join('')
    + `<path fill-rule="evenodd" fill="${cart}" d="${BODY}"/>`
    + `<path stroke="${cart}" stroke-width="6" stroke-linecap="round" fill="none" d="${HANDLE}"/>${wheels}</svg>`;
}
