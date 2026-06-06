-- =============================================================
-- UINR — V2 schema additions
-- Run in Supabase SQL Editor after schema.sql + auth-and-rls.sql.
-- Idempotent.
-- =============================================================

-- ----- Students: bursary + special needs -----
alter table public.students add column if not exists bursary_eligible boolean default false;
alter table public.students add column if not exists special_needs    boolean default false;

-- ----- Hospitals: active patients counter -----
alter table public.hospitals add column if not exists active_patients int default 0;

-- ----- Settings: subscription plan -----
alter table public.settings add column if not exists organization_name text default 'UINR Demo Ministry';
alter table public.settings add column if not exists plan              text default 'District'
    check (plan in ('Free Trial','District','Ministry'));
alter table public.settings add column if not exists plan_renews_at    timestamptz default now() + interval '30 days';

-- ----- Profiles: must-change-password flag for invited users -----
alter table public.profiles add column if not exists must_change_password boolean default false;

-- ----- Billing history (organization-level) -----
create table if not exists public.billing_history (
  id         bigserial primary key,
  date       timestamptz default now(),
  plan       text not null,
  amount_ugx int not null default 0,
  status     text not null default 'Paid' check (status in ('Paid','Pending','Failed')),
  method     text default 'MTN Mobile Money',
  reference  text
);

alter table public.billing_history enable row level security;

drop policy if exists "Authenticated read" on public.billing_history;
drop policy if exists "Super Admin writes"  on public.billing_history;

create policy "Authenticated read" on public.billing_history
  for select using (auth.uid() is not null and public.is_active());

create policy "Super Admin writes" on public.billing_history
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

-- ----- Seed billing history if empty -----
insert into public.billing_history (date, plan, amount_ugx, status, method, reference)
select * from (values
  (now() - interval '60 days', 'Free Trial', 0,      'Paid',    '—',                 'TRIAL-INIT'),
  (now() - interval '30 days', 'District',   500000, 'Paid',    'MTN Mobile Money',  'MM-2026-04-1234'),
  (now(),                      'District',   500000, 'Pending', 'MTN Mobile Money',  'MM-2026-05-9012')
) as v(date, plan, amount_ugx, status, method, reference)
where not exists (select 1 from public.billing_history);
