-- =============================================================
-- UINR — Uganda Integrated National Registry
-- Postgres schema for Supabase
-- Run this once in Supabase SQL Editor (Database → SQL Editor)
-- Safe to re-run during development (drops existing tables first)
-- =============================================================

-- ----- 1. Drop old objects (so the script is idempotent) -----
drop table if exists public.audit_log   cascade;
drop table if exists public.students    cascade;
drop table if exists public.hospitals   cascade;
drop table if exists public.families    cascade;
drop table if exists public.admins      cascade;
drop table if exists public.sync_status cascade;
drop table if exists public.settings    cascade;
drop function if exists public.set_updated_at() cascade;

-- ----- 2. Students -----
create table public.students (
  id              bigserial primary key,
  name            text not null,
  nin             text not null unique,
  school          text not null,
  district        text not null,
  level           text not null,
  enrolment_year  int  not null,
  uneb_results    text default '—',
  status          text not null default 'Enrolled'
                  check (status in ('Enrolled','Dropped Out','Graduated')),
  guardian_nin    text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index students_district_idx on public.students (district);
create index students_status_idx   on public.students (status);

-- ----- 3. Hospitals -----
create table public.hospitals (
  id              bigserial primary key,
  name            text not null,
  level           text not null
                  check (level in ('HC II','HC III','General Hospital','Regional Referral')),
  district        text not null,
  in_charge       text,
  beds            int default 0,
  stock           text default 'Adequate'
                  check (stock in ('Adequate','Low','Critical')),
  last_inspection date,
  visits          int default 0,
  vac_coverage    int default 0 check (vac_coverage between 0 and 100),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
create index hospitals_district_idx on public.hospitals (district);

-- ----- 4. Families (with embedded family tree as JSONB) -----
create table public.families (
  id          bigserial primary key,
  head        text not null,
  nin         text not null,
  clan        text,
  tribe       text,
  village     text,
  district    text not null,
  members     int default 1,
  marriage    text default 'Monogamous',
  tree        jsonb default '{"grandparents":[],"parents":[],"children":[]}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index families_district_idx on public.families (district);

-- ----- 5. Audit log -----
create table public.audit_log (
  id           bigserial primary key,
  ts           timestamptz default now(),
  action       text not null check (action in ('Created','Edited','Deleted','Viewed')),
  module       text not null,
  record       text not null,
  performed_by text not null,
  role         text not null,
  district     text
);
create index audit_ts_idx     on public.audit_log (ts desc);
create index audit_module_idx on public.audit_log (module);

-- ----- 6. Admin users (mirrors the demo login until Supabase Auth is wired) -----
create table public.admins (
  id         bigserial primary key,
  name       text not null,
  username   text not null unique,
  role       text not null check (role in ('Super Admin','Ministry Officer','District Registrar')),
  district   text,
  status     text not null default 'Active' check (status in ('Active','Suspended')),
  created_at timestamptz default now()
);

-- ----- 7. District sync status -----
create table public.sync_status (
  district  text primary key,
  status    text not null default 'Synced' check (status in ('Synced','Syncing')),
  last_sync timestamptz default now()
);

-- ----- 8. Settings (single row) -----
create table public.settings (
  id           int primary key default 1 check (id = 1),
  sys_name     text not null default 'Uganda Integrated National Registry',
  admin_email  text not null default 'admin@uinr.go.ug',
  offline_sync boolean default true,
  updated_at   timestamptz default now()
);
insert into public.settings (id) values (1) on conflict do nothing;

-- ----- 9. updated_at trigger -----
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger students_updated  before update on public.students  for each row execute function public.set_updated_at();
create trigger hospitals_updated before update on public.hospitals for each row execute function public.set_updated_at();
create trigger families_updated  before update on public.families  for each row execute function public.set_updated_at();
create trigger settings_updated  before update on public.settings  for each row execute function public.set_updated_at();

-- ----- 10. Row Level Security -----
-- For the demo the app uses the anon key and the existing demo login,
-- so policies are permissive. TIGHTEN these once Supabase Auth is wired:
-- e.g. only allow Super Admin to write, restrict registrars to their district.
alter table public.students     enable row level security;
alter table public.hospitals    enable row level security;
alter table public.families     enable row level security;
alter table public.audit_log    enable row level security;
alter table public.admins       enable row level security;
alter table public.sync_status  enable row level security;
alter table public.settings     enable row level security;

create policy "anon read"   on public.students    for select using (true);
create policy "anon write"  on public.students    for all    using (true) with check (true);
create policy "anon read"   on public.hospitals   for select using (true);
create policy "anon write"  on public.hospitals   for all    using (true) with check (true);
create policy "anon read"   on public.families    for select using (true);
create policy "anon write"  on public.families    for all    using (true) with check (true);
create policy "anon read"   on public.audit_log   for select using (true);
create policy "anon write"  on public.audit_log   for all    using (true) with check (true);
create policy "anon read"   on public.admins      for select using (true);
create policy "anon write"  on public.admins      for all    using (true) with check (true);
create policy "anon read"   on public.sync_status for select using (true);
create policy "anon write"  on public.sync_status for all    using (true) with check (true);
create policy "anon read"   on public.settings    for select using (true);
create policy "anon write"  on public.settings    for all    using (true) with check (true);

-- ----- 11. Seed sync_status rows (the 10 districts the demo uses) -----
insert into public.sync_status (district, status) values
  ('Kampala','Synced'), ('Wakiso','Synced'), ('Gulu','Syncing'),
  ('Mbarara','Synced'), ('Jinja','Synced'), ('Mbale','Synced'),
  ('Lira','Syncing'),   ('Arua','Synced'),  ('Masaka','Synced'),
  ('Fort Portal','Synced')
on conflict (district) do nothing;
