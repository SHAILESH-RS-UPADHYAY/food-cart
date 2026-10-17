export const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const token = (n: number) => `#${String(n).padStart(3, '0')}`;

export function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 5) return { hello: 'Up late', head: 'Late-night hunger, *handled.*', sub: 'A few stalls are still cooking. Order now, walk over.' };
  if (h < 11) return { hello: 'Good morning', head: 'Breakfast first, *then class.*', sub: "Order now, grab it on the way to your 9 o'clock." };
  if (h < 15) return { hello: 'Good afternoon', head: "It's lunch *o'clock.*", sub: 'Skip the queue. Order ahead, pick it up hot.' };
  if (h < 19) return { hello: 'Good evening', head: 'Time for a *snack break.*', sub: 'Shakes, chai and snacks, ready when you are.' };
  return { hello: 'Good evening', head: 'Dinner plans, *sorted.*', sub: 'Two taps, then walk over when your token is ready.' };
}

export function ago(ts: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 45) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const clock = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();

/** 98765 43210 */
export const prettyPhone = (digits: string) => (digits.length > 5 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits);

export const isStudentEmail = (email?: string) => !!email && /@cuchd\.in$/i.test(email.trim());

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
