// Runs the real migration + seed in an in-process Postgres (PGlite) and checks the rules that
// matter for money and fairness: the order cap, server-side prices, transitions, RLS.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

import { PGlite } from '@electric-sql/pglite';

const STUB = `
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, phone text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

const STUDENT = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const STAFF = '33333333-3333-3333-3333-333333333333';

async function setup() {
  const db = new PGlite();
  await db.exec(STUB);
  for (const f of readdirSync('supabase/migrations').sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, 'utf8'));
  await db.exec(readFileSync('supabase/seed.sql', 'utf8'));
  await db.exec(`grant select on all tables in schema public to anon, authenticated;
    insert into auth.users (id, email, phone, raw_user_meta_data) values
      ('${STUDENT}', null, '+919800000001', '{"name":"Simran"}'),
      ('${OTHER}', null, '+919800000002', '{}'),
      ('${STAFF}', 'staff@hrcafe.in', null, '{}');
    select assign_staff('staff@hrcafe.in', 'hr-cafe');`);
  return db;
}

/** Run as a signed-in user, the way PostgREST does (role + JWT sub). */
async function as(db, uid, sql, params) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec('reset role;');
  }
}

const order = (db, uid, lines, stall = 'hr-cafe') =>
  as(db, uid, `select * from place_order($1, $2::jsonb, 'less spicy', 'cod')`, [stall, JSON.stringify(lines)]);

test('profile row is created on sign-up with the metadata name', async () => {
  const db = await setup();
  const { rows } = await db.query(`select name, role from profiles where id = $1`, [STUDENT]);
  assert.deepEqual(rows[0], { name: 'Simran', role: 'student' });
});

test('price comes from the menu, never the client', async () => {
  const db = await setup();
  const { rows } = await order(db, STUDENT, [{ item_id: 'hr-cold-coffee', qty: 2, price: 1 }, { item_id: 'hr-maggi', qty: 1 }]);
  assert.equal(rows[0].total, 2 * 90 + 60);
  assert.equal(rows[0].token_no, 41);
  assert.match(rows[0].pickup_code, /^\d{4}$/);
  const items = await db.query(`select item_id, qty, price from order_items where order_id = $1 order by item_id`, [rows[0].id]);
  assert.deepEqual(items.rows.map((r) => r.price), [90, 60]);
});

test('the cap blocks orders atomically and frees a slot when an order is ready', async () => {
  const db = await setup();
  await db.exec(`update stalls set max_active_orders = 2 where id = 'hr-cafe'`);
  const a = (await order(db, STUDENT, [{ item_id: 'hr-maggi', qty: 1 }])).rows[0];
  await order(db, OTHER, [{ item_id: 'hr-maggi', qty: 1 }]);
  await assert.rejects(order(db, STUDENT, [{ item_id: 'hr-fries', qty: 1 }]), /STALL_AT_CAPACITY/);
  // staff moves one order out of the kitchen: capacity returns
  await as(db, STAFF, `select set_order_status($1, 'accepted')`, [a.id]);
  await as(db, STAFF, `select set_order_status($1, 'ready')`, [a.id]);
  const { rows } = await db.query(`select active_orders from stalls where id = 'hr-cafe'`);
  assert.equal(rows[0].active_orders, 1);
  await order(db, STUDENT, [{ item_id: 'hr-fries', qty: 1 }]);
});

test('unavailable items, closed stalls and foreign items are refused', async () => {
  const db = await setup();
  await db.exec(`update menu_items set available = false where id = 'hr-brownie'`);
  await assert.rejects(order(db, STUDENT, [{ item_id: 'hr-brownie', qty: 1 }]), /ITEM_UNAVAILABLE/);
  await assert.rejects(order(db, STUDENT, [{ item_id: 'lp-margherita', qty: 1 }]), /ITEM_UNAVAILABLE/);
  await assert.rejects(order(db, STUDENT, [{ item_id: 'hr-maggi', qty: 21 }]), /ITEM_UNAVAILABLE/);
  await db.exec(`update stalls set status = 'paused' where id = 'hr-cafe'`);
  await assert.rejects(order(db, STUDENT, [{ item_id: 'hr-maggi', qty: 1 }]), /STALL_CLOSED/);
});

test('a student can hold at most three kitchen orders', async () => {
  const db = await setup();
  for (let i = 0; i < 3; i++) await order(db, STUDENT, [{ item_id: 'hr-maggi', qty: 1 }]);
  await assert.rejects(order(db, STUDENT, [{ item_id: 'hr-maggi', qty: 1 }]), /TOO_MANY_ACTIVE/);
});

test('roles: students cannot cook, staff cannot touch other stalls, transitions are ordered', async () => {
  const db = await setup();
  const o = (await order(db, STUDENT, [{ item_id: 'hr-maggi', qty: 1 }])).rows[0];
  await assert.rejects(as(db, STUDENT, `select set_order_status($1, 'ready')`, [o.id]), /BAD_TRANSITION/);
  await assert.rejects(as(db, OTHER, `select set_order_status($1, 'cancelled')`, [o.id]), /NOT_ALLOWED/);
  await assert.rejects(as(db, STAFF, `select set_order_status($1, 'collected')`, [o.id]), /BAD_TRANSITION/);
  const lp = (await order(db, OTHER, [{ item_id: 'lp-margherita', qty: 1 }], 'lapinoz')).rows[0];
  await assert.rejects(as(db, STAFF, `select set_order_status($1, 'accepted')`, [lp.id]), /NOT_ALLOWED/);
  await as(db, STUDENT, `select set_order_status($1, 'cancelled')`, [o.id]);
  const { rows } = await db.query(`select active_orders from stalls where id = 'hr-cafe'`);
  assert.equal(rows[0].active_orders, 0);
});

test('RLS: students see only their orders, staff see their stall, nobody writes directly', async () => {
  const db = await setup();
  await order(db, STUDENT, [{ item_id: 'hr-maggi', qty: 1 }]);
  await order(db, OTHER, [{ item_id: 'hr-fries', qty: 1 }]);
  await order(db, OTHER, [{ item_id: 'lp-margherita', qty: 1 }], 'lapinoz');
  assert.equal((await as(db, STUDENT, `select id from orders`)).rows.length, 1);
  assert.equal((await as(db, STAFF, `select id from orders`)).rows.length, 2);
  await assert.rejects(as(db, STUDENT, `update stalls set max_active_orders = 999`), /permission denied/);
  await assert.rejects(as(db, STUDENT, `update profiles set role = 'admin' where id = '${STUDENT}'`), /permission denied/);
  await as(db, STUDENT, `update profiles set name = 'Simran K' where id = '${STUDENT}'`);
});
