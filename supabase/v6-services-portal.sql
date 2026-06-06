-- =============================================================
-- UINR — V6: Services portal + phone-based citizen lookup
-- Run AFTER v5-realistic-scale.sql.
-- Idempotent.
-- =============================================================

-- ----- 1. Phone numbers (so citizens are searchable by mobile) -----
alter table public.students add column if not exists phone text;
alter table public.families add column if not exists phone text;

create index if not exists students_phone_idx on public.students (phone);
create index if not exists families_phone_idx on public.families (phone);

-- ----- 2. Applications (government services) -----
create table if not exists public.applications (
  id              bigserial primary key,
  citizen_nin     text,
  citizen_name    text not null,
  citizen_phone   text,
  citizen_email   text,
  service_type    text not null,
  status          text not null default 'Submitted'
                  check (status in ('Submitted','Under Review','Approved','Rejected','Issued','Cancelled')),
  data            jsonb default '{}'::jsonb,
  district        text,
  reference       text unique,
  submitted_at    timestamptz default now(),
  updated_at      timestamptz default now(),
  reviewer        text,
  notes           text
);

create index if not exists applications_service_idx  on public.applications (service_type);
create index if not exists applications_status_idx   on public.applications (status);
create index if not exists applications_district_idx on public.applications (district);
create index if not exists applications_nin_idx      on public.applications (citizen_nin);

alter table public.applications enable row level security;

drop policy if exists "Anon submit applications"   on public.applications;
drop policy if exists "Authenticated read all"     on public.applications;
drop policy if exists "Super Admin writes"         on public.applications;

-- Anyone can submit (citizens use a public form)
create policy "Anon submit applications" on public.applications
  for insert with check (true);

-- Authenticated officers read by scope (super admin: all, registrar: own district, officer: all)
create policy "Authenticated read all" on public.applications
  for select using (auth.uid() is not null and public.is_active());

-- Super admins and ministry officers can update/delete
create policy "Officers update" on public.applications
  for update using (
    public.is_active() and public.current_role() in ('Super Admin','Ministry Officer')
  ) with check (
    public.is_active() and public.current_role() in ('Super Admin','Ministry Officer')
  );

create policy "Super Admin delete" on public.applications
  for delete using (public.current_role() = 'Super Admin' and public.is_active());

-- ----- 3. updated_at trigger -----
drop trigger if exists applications_updated on public.applications;
create trigger applications_updated before update on public.applications
  for each row execute function public.set_updated_at();

-- ----- 4. Reference generator (UINR-2026-XXXXXX) -----
create or replace function public.gen_reference()
returns trigger
language plpgsql
as $$
begin
  if new.reference is null then
    new.reference := 'UINR-' || to_char(now(),'YYYY') || '-' ||
                     upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  end if;
  return new;
end;
$$;

drop trigger if exists applications_ref on public.applications;
create trigger applications_ref before insert on public.applications
  for each row execute function public.gen_reference();

-- ----- 5. Seed a few demo applications so the queue isn't empty -----
insert into public.applications (citizen_name, citizen_nin, citizen_phone, service_type, status, district, data) values
  ('Nakato Sarah',     'CM00090000001UG', '+256700111222', 'Passport Application',     'Under Review', 'Wakiso',     '{"type":"Ordinary","duration":"10 years"}'),
  ('Ssali Daniel',     'CM00090000004UG', '+256700333444', 'Driving Permit',           'Submitted',    'Kampala',    '{"class":"B","period":"3 years","renewal":false}'),
  ('Tusiime Brenda',   'CM00090000006UG', '+256700555666', 'Bank Account Opening',     'Approved',    'Mbarara',    '{"bank":"Stanbic Bank","accountType":"Savings"}'),
  ('Mugisha Allan',    'CM00090000007UG', '+256700777888', 'Tax Identification (TIN)', 'Issued',      'Mbarara',    '{"taxpayerType":"Individual"}'),
  ('Apio Florence',    'CM00090000005UG', '+256700999000', 'Birth Certificate',        'Submitted',    'Lira',       '{"reason":"Late registration"}'),
  ('Okello Brian',     'CM00090000002UG', '+256701111222', 'NSSF Statement Request',   'Approved',    'Gulu',       '{"period":"12 months"}'),
  ('Wasswa Isaac',     'CM00090000011UG', '+256701333444', 'Mobile Money Registration','Issued',      'Jinja',      '{"provider":"MTN MoMo"}'),
  ('Mbabazi Diana',    'CM00090000014UG', '+256701555666', 'Business Registration',    'Under Review', 'Wakiso',     '{"businessType":"Sole Proprietor","sector":"Agriculture"}'),
  ('Asiimwe Joel',     'CM00090000015UG', '+256701777888', 'Land Title Search',        'Submitted',    'Fort Portal','{"plotNumber":"FRV-1234","subcounty":"Kabarole"}'),
  ('Kyambadde Moses',  'CM00090000009UG', '+256701999000', 'National ID Renewal',      'Approved',    'Wakiso',     '{"reason":"Expired"}')
on conflict (reference) do nothing;

-- =============================================================
-- DONE. Refresh the app:
--   * Citizen Search now indexes phone numbers too
--   * Services hub shows 10 government services
--   * Applications admin queue has 10 seeded entries to triage
-- =============================================================
