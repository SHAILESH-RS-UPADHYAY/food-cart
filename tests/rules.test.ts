import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canTransition, etaMinutes, lineTotal, stallState } from '../src/api/rules.ts';

const live = (active: number, maxActive = 100, status: 'open' | 'paused' | 'closed' = 'open') => ({ id: 's', status, active, maxActive });

test('stall state follows load and status', () => {
  assert.equal(stallState(live(10)), 'open');
  assert.equal(stallState(live(85)), 'busy');
  assert.equal(stallState(live(100)), 'full');
  assert.equal(stallState(live(120)), 'full');
  assert.equal(stallState(live(10, 100, 'paused')), 'paused');
});

test('transitions match the SQL rules', () => {
  assert.ok(canTransition('placed', 'accepted', 'staff'));
  assert.ok(canTransition('placed', 'cancelled', 'student'));
  assert.ok(!canTransition('placed', 'cancelled', 'staff'));
  assert.ok(!canTransition('placed', 'ready', 'staff'));
  assert.ok(!canTransition('accepted', 'ready', 'student'));
  assert.ok(canTransition('ready', 'collected', 'student'));
  assert.ok(!canTransition('collected', 'ready', 'admin'));
});

test('eta grows with load and never drops below 3 min', () => {
  assert.equal(etaMinutes(10, live(0)), 10);
  assert.equal(etaMinutes(10, live(100)), 18);
  assert.equal(etaMinutes(1, live(0)), 3);
});

test('totals', () => {
  assert.equal(lineTotal([{ qty: 2, price: 90 }, { qty: 1, price: 60 }]), 240);
});
