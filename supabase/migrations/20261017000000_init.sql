-- Food Cart: schema, rules and security. Business rules live here; clients only call RPCs.
-- Mirrors src/api/rules.ts (kitchen statuses, transitions, ETA formula, per-user cap).

create type public.app_role as enum ('student', 'staff', 'admin');
create type public.stall_status as enum ('open', 'paused', 'closed');
create type public.order_status as enum ('placed', 'accepted', 'preparing', 'ready', 'collected', 'cancelled', 'rejected');
create type public.payment_method as enum ('cod', 'online_demo');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  phone text,
  email text,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now()
);

create table public.stalls (
  id text primary key,
  name text not null,
  tagline text,
  location text,
  avg_prep_min int not null default 12 check (avg_prep_min between 1 and 120),
  max_active_orders int not null default 100 check (max_active_orders between 1 and 1000),
  active_orders int not null default 0 check (active_orders >= 0),
  status public.stall_status not null default 'open',
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table public.stall_staff (
  stall_id text not null references public.stalls on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  primary key (stall_id, user_id)
);
create index stall_staff_user_idx on public.stall_staff (user_id);

create table public.menu_items (
  id text primary key,
  stall_id text not null references public.stalls on delete cascade,
  name text not null,
  description text,
  category text not null,
  price int not null check (price > 0),
  photo text,
  available boolean not null default true,
  sort int not null default 0
);
create index menu_items_stall_idx on public.menu_items (stall_id, sort);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  stall_id text not null references public.stalls,
  user_id uuid not null references auth.users,
  customer_name text,
  token_no int not null,
  pickup_code text not null,
  status public.order_status not null default 'placed',
  payment public.payment_method not null default 'cod',
  total int not null check (total >= 0),
  note text check (char_length(note) <= 200),
  eta_min int not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  ready_at timestamptz,
  collected_at timestamptz
);
create index orders_stall_status_idx on public.orders (stall_id, status);
create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_stall_created_idx on public.orders (stall_id, created_at desc);

create table public.order_items (
  order_id uuid not null references public.orders on delete cascade,
  item_id text not null references public.menu_items,
  name text not null,
  qty int not null check (qty between 1 and 20),
  price int not null,
  primary key (order_id, item_id)
);

-- ---------- helpers ----------

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create function public.is_staff_of(p_stall text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_admin() or exists (select 1 from stall_staff where stall_id = p_stall and user_id = auth.uid());
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, phone, email, name)
  values (new.id, new.phone, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- place_order: the order cap is enforced under a row lock ----------

create function public.place_order(p_stall text, p_lines jsonb, p_note text, p_payment public.payment_method)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_stall stalls%rowtype;
  v_order orders%rowtype;
  v_total int := 0;
  v_count int;
  v_line jsonb;
  v_item menu_items%rowtype;
  v_qty int;
begin
  if v_uid is null then raise exception 'NOT_ALLOWED'; end if;

  select * into v_stall from stalls where id = p_stall for update;
  if not found or v_stall.status <> 'open' then raise exception 'STALL_CLOSED'; end if;
  if v_stall.active_orders >= v_stall.max_active_orders then raise exception 'STALL_AT_CAPACITY'; end if;

  select count(*) into v_count from orders
   where user_id = v_uid and status in ('placed', 'accepted', 'preparing');
  if v_count >= 3 then raise exception 'TOO_MANY_ACTIVE'; end if;

  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 30 then
    raise exception 'ITEM_UNAVAILABLE';
  end if;

  insert into orders (stall_id, user_id, customer_name, token_no, pickup_code, payment, total, note, eta_min)
  values (
    p_stall, v_uid,
    (select nullif(name, '') from profiles where id = v_uid),
    coalesce((select max(token_no) from orders
               where stall_id = p_stall
                 and created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata'), 40) + 1,
    lpad((floor(random() * 9000) + 1000)::int::text, 4, '0'),
    p_payment, 0, nullif(trim(p_note), ''),
    greatest(3, round(v_stall.avg_prep_min * (1 + 0.8 * least(1, v_stall.active_orders::numeric / v_stall.max_active_orders))))
  )
  returning * into v_order;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_qty := (v_line ->> 'qty')::int;
    select * into v_item from menu_items where id = v_line ->> 'item_id' and stall_id = p_stall and available;
    if not found or v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'ITEM_UNAVAILABLE'; end if;
    insert into order_items (order_id, item_id, name, qty, price) values (v_order.id, v_item.id, v_item.name, v_qty, v_item.price);
    v_total := v_total + v_qty * v_item.price;
  end loop;

  update orders set total = v_total where id = v_order.id returning * into v_order;
  update stalls set active_orders = active_orders + 1, updated_at = now() where id = p_stall;
  return v_order;
end;
$$;

-- ---------- set_order_status: role + transition checks, frees the kitchen slot ----------

create function public.set_order_status(p_order uuid, p_status public.order_status)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_staff boolean;
  v_allowed public.order_status[];
begin
  select * into v_order from orders where id = p_order for update;
  if not found then raise exception 'NOT_ALLOWED'; end if;

  v_staff := public.is_staff_of(v_order.stall_id);
  if not v_staff and v_order.user_id is distinct from auth.uid() then raise exception 'NOT_ALLOWED'; end if;

  v_allowed := case v_order.status
    when 'placed' then array['accepted', 'rejected', 'cancelled']
    when 'accepted' then array['preparing', 'ready', 'rejected']
    when 'preparing' then array['ready']
    when 'ready' then array['collected']
    else array[]::text[] end::public.order_status[];
  if not (p_status = any (v_allowed)) then raise exception 'BAD_TRANSITION'; end if;
  if not v_staff and p_status not in ('cancelled', 'collected') then raise exception 'BAD_TRANSITION'; end if;
  if v_staff and not public.is_admin() and p_status = 'cancelled' then raise exception 'BAD_TRANSITION'; end if;

  update orders set
    status = p_status,
    accepted_at = case when p_status = 'accepted' then now() else accepted_at end,
    ready_at = case when p_status = 'ready' then now() else ready_at end,
    collected_at = case when p_status = 'collected' then now() else collected_at end
  where id = p_order
  returning * into v_order;
  return v_order; -- the kitchen slot is freed by the orders_release_slot trigger
end;
$$;

-- Free the kitchen slot exactly when an order leaves the kitchen statuses (covers every path).
create function public.release_kitchen_slot() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status in ('placed', 'accepted', 'preparing') and new.status not in ('placed', 'accepted', 'preparing') then
    update stalls set active_orders = greatest(0, active_orders - 1), updated_at = now() where id = new.stall_id;
  end if;
  return new;
end;
$$;

create trigger orders_release_slot after update of status on public.orders
  for each row execute function public.release_kitchen_slot();

-- ---------- staff controls ----------

create function public.update_stall(p_stall text, p_status public.stall_status, p_max int)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff_of(p_stall) then raise exception 'NOT_ALLOWED'; end if;
  update stalls set
    status = coalesce(p_status, status),
    max_active_orders = coalesce(least(greatest(p_max, 1), 1000), max_active_orders),
    updated_at = now()
  where id = p_stall;
end;
$$;

create function public.set_item_available(p_item text, p_available boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare v_stall text;
begin
  select stall_id into v_stall from menu_items where id = p_item;
  if v_stall is null or not public.is_staff_of(v_stall) then raise exception 'NOT_ALLOWED'; end if;
  update menu_items set available = p_available where id = p_item;
end;
$$;

-- Service role only: link a staff login to a stall. select assign_staff('staff@hrcafe.in', 'hr-cafe');
create function public.assign_staff(p_email text, p_stall text) returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(p_email);
  if v_uid is null then raise exception 'no auth user with email %', p_email; end if;
  update profiles set role = 'staff' where id = v_uid and role = 'student';
  insert into stall_staff (stall_id, user_id) values (p_stall, v_uid) on conflict do nothing;
end;
$$;

-- ---------- row level security ----------

alter table public.profiles enable row level security;
alter table public.stalls enable row level security;
alter table public.stall_staff enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "read own profile" on public.profiles for select using (id = auth.uid());
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- users may change their name only; role/phone/email are not theirs to edit
revoke update on public.profiles from anon, authenticated;
grant update (name) on public.profiles to authenticated;

create policy "stalls are public" on public.stalls for select using (true);
create policy "menus are public" on public.menu_items for select using (true);
create policy "see own staff links" on public.stall_staff for select using (user_id = auth.uid());

create policy "own orders or stall staff" on public.orders for select
  using (user_id = auth.uid() or public.is_staff_of(stall_id));
create policy "items of visible orders" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff_of(o.stall_id))));

-- writes only through the functions above
revoke insert, update, delete on public.stalls, public.menu_items, public.orders, public.order_items, public.stall_staff from anon, authenticated;
-- functions are executable by PUBLIC by default: lock them to signed-in users (assign_staff: service role only)
revoke execute on function public.assign_staff(text, text) from public, anon, authenticated;
revoke execute on function public.place_order(text, jsonb, text, public.payment_method) from public, anon;
revoke execute on function public.set_order_status(uuid, public.order_status) from public, anon;
revoke execute on function public.update_stall(text, public.stall_status, int) from public, anon;
revoke execute on function public.set_item_available(text, boolean) from public, anon;
grant execute on function public.place_order(text, jsonb, text, public.payment_method) to authenticated;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;
grant execute on function public.update_stall(text, public.stall_status, int) to authenticated;
grant execute on function public.set_item_available(text, boolean) to authenticated;

-- ---------- realtime ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.stalls, public.orders, public.menu_items;
  end if;
end $$;
