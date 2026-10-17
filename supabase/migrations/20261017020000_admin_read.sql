-- Developer admin panel: admins read every profile and staff link (they already see every order via is_staff_of).
create policy "admins read profiles" on public.profiles for select using (public.is_admin());
create policy "admins read staff links" on public.stall_staff for select using (public.is_admin());
