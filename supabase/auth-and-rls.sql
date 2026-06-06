-- =============================================================
-- UINR — Auth + tightened RLS migration
-- Run this in Supabase SQL Editor AFTER schema.sql.
-- Idempotent (safe to re-run).
-- =============================================================

-- ----- 1. Profiles table (linked to auth.users) -----
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  username    text unique,
  role        text not null default 'District Registrar'
              check (role in ('Super Admin','Ministry Officer','District Registrar')),
  district    text,
  status      text not null default 'Active'
              check (status in ('Active','Suspended')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;

-- updated_at trigger
drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----- 2. Helper functions (SECURITY DEFINER to bypass RLS recursion) -----
create or replace function public.current_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_district()
returns text
language sql stable security definer
set search_path = public
as $$
  select district from public.profiles where id = auth.uid();
$$;

create or replace function public.is_active()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select status = 'Active' from public.profiles where id = auth.uid()), false);
$$;

-- ----- 3. Profiles policies -----
drop policy if exists "Read own profile"       on public.profiles;
drop policy if exists "Super Admin reads all"  on public.profiles;
drop policy if exists "Super Admin writes all" on public.profiles;

create policy "Read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Super Admin reads all" on public.profiles
  for select using (public.current_role() = 'Super Admin');

create policy "Super Admin writes all" on public.profiles
  for all
  using (public.current_role() = 'Super Admin')
  with check (public.current_role() = 'Super Admin');

-- ----- 4. Replace permissive policies with role-based ones -----

-- STUDENTS
drop policy if exists "anon read"  on public.students;
drop policy if exists "anon write" on public.students;
drop policy if exists "Super Admin all"          on public.students;
drop policy if exists "Officer read"             on public.students;
drop policy if exists "Registrar own district"   on public.students;

create policy "Super Admin all" on public.students
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

create policy "Officer read" on public.students
  for select using (public.current_role() = 'Ministry Officer' and public.is_active());

create policy "Registrar own district" on public.students
  for all
  using (public.current_role() = 'District Registrar' and public.is_active() and district = public.current_district())
  with check (public.current_role() = 'District Registrar' and public.is_active() and district = public.current_district());

-- HOSPITALS
drop policy if exists "anon read"  on public.hospitals;
drop policy if exists "anon write" on public.hospitals;
drop policy if exists "Super Admin all"          on public.hospitals;
drop policy if exists "Officer read"             on public.hospitals;
drop policy if exists "Registrar own district"   on public.hospitals;

create policy "Super Admin all" on public.hospitals
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

create policy "Officer read" on public.hospitals
  for select using (public.current_role() = 'Ministry Officer' and public.is_active());

create policy "Registrar own district" on public.hospitals
  for all
  using (public.current_role() = 'District Registrar' and public.is_active() and district = public.current_district())
  with check (public.current_role() = 'District Registrar' and public.is_active() and district = public.current_district());

-- FAMILIES
drop policy if exists "anon read"  on public.families;
drop policy if exists "anon write" on public.families;
drop policy if exists "Super Admin all"          on public.families;
drop policy if exists "Officer read"             on public.families;
drop policy if exists "Registrar own district"   on public.families;

create policy "Super Admin all" on public.families
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

create policy "Officer read" on public.families
  for select using (public.current_role() = 'Ministry Officer' and public.is_active());

create policy "Registrar own district" on public.families
  for all
  using (public.current_role() = 'District Registrar' and public.is_active() and district = public.current_district())
  with check (public.current_role() = 'District Registrar' and public.is_active() and district = public.current_district());

-- AUDIT LOG (all authenticated can insert; reads scoped by role)
drop policy if exists "anon read"  on public.audit_log;
drop policy if exists "anon write" on public.audit_log;
drop policy if exists "Super Admin reads"           on public.audit_log;
drop policy if exists "Officer reads"               on public.audit_log;
drop policy if exists "Registrar reads district"    on public.audit_log;
drop policy if exists "Authenticated writes"        on public.audit_log;

create policy "Super Admin reads" on public.audit_log
  for select using (public.current_role() = 'Super Admin' and public.is_active());

create policy "Officer reads" on public.audit_log
  for select using (public.current_role() = 'Ministry Officer' and public.is_active());

create policy "Registrar reads district" on public.audit_log
  for select using (public.current_role() = 'District Registrar' and public.is_active() and district = public.current_district());

create policy "Authenticated writes" on public.audit_log
  for insert with check (auth.uid() is not null and public.is_active());

-- ADMINS (legacy table — kept read-only; profiles is now the source of truth)
drop policy if exists "anon read"  on public.admins;
drop policy if exists "anon write" on public.admins;
drop policy if exists "Super Admin all"   on public.admins;
drop policy if exists "Authenticated read" on public.admins;

create policy "Super Admin all" on public.admins
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

create policy "Authenticated read" on public.admins
  for select using (auth.uid() is not null and public.is_active());

-- SYNC STATUS
drop policy if exists "anon read"  on public.sync_status;
drop policy if exists "anon write" on public.sync_status;
drop policy if exists "Authenticated read" on public.sync_status;
drop policy if exists "Super Admin writes" on public.sync_status;

create policy "Authenticated read" on public.sync_status
  for select using (auth.uid() is not null and public.is_active());

create policy "Super Admin writes" on public.sync_status
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

-- SETTINGS
drop policy if exists "anon read"  on public.settings;
drop policy if exists "anon write" on public.settings;
drop policy if exists "Authenticated read" on public.settings;
drop policy if exists "Super Admin writes" on public.settings;

create policy "Authenticated read" on public.settings
  for select using (auth.uid() is not null and public.is_active());

create policy "Super Admin writes" on public.settings
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

-- ----- 5. Auto-create a profile row whenever a new auth user is created -----
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, name, username, role, district)
  values (
    new.id,
    coalesce(meta->>'name',     split_part(new.email, '@', 1)),
    coalesce(meta->>'username', split_part(new.email, '@', 1)),
    coalesce(meta->>'role',     'District Registrar'),
    coalesce(meta->>'district', 'Kampala')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- DONE.
--
-- Next: create the 3 demo accounts in Supabase Dashboard:
--   Authentication → Users → "Add user" → "Create new user"
--
--   1. florence.akello@uinr.go.ug  password: SuperAdmin2024!
--   2. patrick.mukasa@uinr.go.ug   password: Officer2024!
--   3. grace.atim@uinr.go.ug       password: Registrar2024!
--
-- Check "Auto Confirm User" for each so they can log in immediately.
--
-- Then run the SQL below ONCE to assign their roles and districts:
-- =============================================================

-- Uncomment and run after the users exist in auth.users:
--
-- update public.profiles
-- set name = 'Florence Akello', username = 'admin',
--     role = 'Super Admin', district = 'Kampala'
-- where id = (select id from auth.users where email = 'florence.akello@uinr.go.ug');
--
-- update public.profiles
-- set name = 'Patrick Mukasa', username = 'officer',
--     role = 'Ministry Officer', district = 'Kampala'
-- where id = (select id from auth.users where email = 'patrick.mukasa@uinr.go.ug');
--
-- update public.profiles
-- set name = 'Grace Atim', username = 'registrar',
--     role = 'District Registrar', district = 'Gulu'
-- where id = (select id from auth.users where email = 'grace.atim@uinr.go.ug');
