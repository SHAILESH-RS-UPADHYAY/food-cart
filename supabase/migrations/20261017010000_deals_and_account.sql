-- Last call deals (stalls sell leftover / surplus food cheaper) and self-serve account deletion.

create table public.deals (
  item_id text primary key references public.menu_items on delete cascade,
  stall_id text not null references public.stalls on delete cascade,
  price int not null check (price > 0),
  left_qty int not null check (left_qty >= 0),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index deals_stall_idx on public.deals (stall_id);

alter table public.deals enable row level security;
create policy "deals are public" on public.deals for select using (true);
revoke insert, update, delete on public.deals from anon, authenticated;

-- Staff put a dish on last call: cheaper than the menu, limited stock, time-boxed.
create function public.set_deal(p_item text, p_price int, p_left int, p_minutes int) returns void
language plpgsql security definer set search_path = public as $$
declare v_item menu_items%rowtype;
begin
  select * into v_item from menu_items where id = p_item;
  if not found or not public.is_staff_of(v_item.stall_id) then raise exception 'NOT_ALLOWED'; end if;
  if p_price <= 0 or p_price >= v_item.price or p_left < 1 or p_left > 500 or p_minutes < 5 or p_minutes > 720 then
    raise exception 'NOT_ALLOWED';
  end if;
  insert into deals (item_id, stall_id, price, left_qty, ends_at)
  values (p_item, v_item.stall_id, p_price, p_left, now() + make_interval(mins => p_minutes))
  on conflict (item_id) do update set price = excluded.price, left_qty = excluded.left_qty, ends_at = excluded.ends_at, created_at = now();
end;
$$;

create function public.clear_deal(p_item text) returns void
language plpgsql security definer set search_path = public as $$
declare v_stall text;
begin
  select stall_id into v_stall from deals where item_id = p_item;
  if v_stall is null then return; end if;
  if not public.is_staff_of(v_stall) then raise exception 'NOT_ALLOWED'; end if;
  delete from deals where item_id = p_item;
end;
$$;

-- place_order, now deal-aware: a live deal sets the price and its stock is taken under a row lock.
create or replace function public.place_order(p_stall text, p_lines jsonb, p_note text, p_payment public.payment_method)
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
  v_deal deals%rowtype;
  v_qty int;
  v_price int;
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

    select * into v_deal from deals where item_id = v_item.id and ends_at > now() and left_qty > 0 for update;
    if found then
      if v_deal.left_qty < v_qty then raise exception 'DEAL_GONE'; end if;
      v_price := v_deal.price;
      update deals set left_qty = left_qty - v_qty where item_id = v_item.id;
    else
      v_price := v_item.price;
    end if;

    insert into order_items (order_id, item_id, name, qty, price) values (v_order.id, v_item.id, v_item.name, v_qty, v_price);
    v_total := v_total + v_qty * v_price;
  end loop;

  update orders set total = v_total where id = v_order.id returning * into v_order;
  update stalls set active_orders = active_orders + 1, updated_at = now() where id = p_stall;
  return v_order;
end;
$$;

-- Account deletion: the person goes, the stall keeps an anonymised sales record.
alter table public.orders alter column user_id drop not null;
alter table public.orders drop constraint orders_user_id_fkey;
alter table public.orders add constraint orders_user_id_fkey foreign key (user_id) references auth.users on delete set null;

create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'NOT_ALLOWED'; end if;
  update orders set customer_name = 'Deleted user' where user_id = v_uid;
  delete from auth.users where id = v_uid; -- cascades to profiles and stall_staff; orders.user_id becomes null
end;
$$;

revoke execute on function public.set_deal(text, int, int, int) from public, anon;
revoke execute on function public.clear_deal(text) from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.set_deal(text, int, int, int) to authenticated;
grant execute on function public.clear_deal(text) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.place_order(text, jsonb, text, public.payment_method) from public, anon;
grant execute on function public.place_order(text, jsonb, text, public.payment_method) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.deals;
  end if;
end $$;
