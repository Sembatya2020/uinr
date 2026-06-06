-- =============================================================
-- UINR — V4: flexible identity + religion
-- Run AFTER schema.sql, auth-and-rls.sql, v2-additions.sql, v3-real-uganda.sql.
-- Idempotent.
--
-- What this changes:
--  1. NIN is now optional on students. Many young children, refugees, and
--     adults in remote districts do not yet have NIRA identity cards.
--     The registry must still capture them.
--  2. NIN uniqueness is preserved when present (Postgres allows multiple NULLs
--     on a unique column by default).
--  3. Religion is added as an optional field on students and families.
--  4. Guardian NIN was already nullable — confirmed.
-- =============================================================

-- ----- 1. Make student NIN optional -----
alter table public.students alter column nin drop not null;

-- ----- 1b. Make family head NIN optional too (same reason) -----
alter table public.families alter column nin drop not null;

-- ----- 2. Add religion to students and families -----
alter table public.students  add column if not exists religion text;
alter table public.families  add column if not exists religion text;

-- ----- 3. Index religion for filtering -----
create index if not exists students_religion_idx on public.students (religion);

-- =============================================================
-- DONE.
-- After running this, the app supports:
--   * Students without NIN (shown as "—" in tables and profile)
--   * Religion picker on student and family forms
--   * No data loss for existing rows (religion defaults to null)
-- =============================================================
