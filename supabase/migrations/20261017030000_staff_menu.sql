-- Staff manage their own menu: add a dish, or change a dish's name, details and price.
create function public.upsert_menu_item(
  p_id text, p_stall text, p_name text, p_description text, p_category text, p_price int, p_photo text
) returns text
language plpgsql security definer set search_path = public as $$
declare v_id text := coalesce(nullif(p_id, ''), p_stall || '-' || substr(md5(random()::text), 1, 8));
declare v_owner text;
begin
  if not public.is_staff_of(p_stall) then raise exception 'NOT_ALLOWED'; end if;
  select stall_id into v_owner from menu_items where id = v_id;
  if v_owner is not null and v_owner <> p_stall then raise exception 'NOT_ALLOWED'; end if;
  if char_length(trim(p_name)) < 2 or p_price is null or p_price < 1 or p_price > 5000 then raise exception 'NOT_ALLOWED'; end if;
  insert into menu_items (id, stall_id, name, description, category, price, photo, sort)
  values (v_id, p_stall, trim(p_name), nullif(trim(p_description), ''), p_category, p_price, p_photo,
          coalesce((select max(sort) + 1 from menu_items where stall_id = p_stall), 0))
  on conflict (id) do update set name = excluded.name, description = excluded.description,
    category = excluded.category, price = excluded.price, photo = excluded.photo;
  return v_id;
end;
$$;
revoke execute on function public.upsert_menu_item(text, text, text, text, text, int, text) from public, anon;
grant execute on function public.upsert_menu_item(text, text, text, text, text, int, text) to authenticated;
