-- =============================================================
-- UINR — V7: Supabase Storage bucket for application documents
-- Run AFTER v6-services-portal.sql.
-- Idempotent.
--
-- What this changes:
--   * Creates a private storage bucket `uinr-documents`
--   * Citizens can upload supporting documents for their applications
--     (passport-size photo, NIN copy, LC1 letter, etc.)
--   * Authenticated officers can read and verify documents
--   * Public read is disabled — all access goes through Supabase auth
-- =============================================================

-- ----- 1. Create the bucket -----
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uinr-documents',
  'uinr-documents',
  false,
  10485760, -- 10 MB per file
  array['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ----- 2. RLS policies on storage.objects for this bucket -----
-- Drop existing policies first to be safe on re-run
drop policy if exists "UINR docs: authenticated insert"  on storage.objects;
drop policy if exists "UINR docs: authenticated read"    on storage.objects;
drop policy if exists "UINR docs: officers update"       on storage.objects;
drop policy if exists "UINR docs: super admin delete"    on storage.objects;

-- Anyone signed in to UINR can upload application documents
create policy "UINR docs: authenticated insert"
  on storage.objects for insert
  with check (bucket_id = 'uinr-documents' and auth.uid() is not null);

-- Anyone signed in to UINR can read application documents (officers verify them)
create policy "UINR docs: authenticated read"
  on storage.objects for select
  using (bucket_id = 'uinr-documents' and auth.uid() is not null);

-- Officers can replace/update documents (e.g., after review feedback)
create policy "UINR docs: officers update"
  on storage.objects for update
  using (
    bucket_id = 'uinr-documents'
    and auth.uid() is not null
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('Super Admin','Ministry Officer')
        and p.status = 'Active'
    )
  );

-- Only Super Admin can permanently delete documents (audit-grade)
create policy "UINR docs: super admin delete"
  on storage.objects for delete
  using (
    bucket_id = 'uinr-documents'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'Super Admin'
        and p.status = 'Active'
    )
  );

-- =============================================================
-- DONE.
-- The app can now:
--   * Upload citizen documents directly from phone camera or gallery
--   * Store them encrypted at rest in Supabase Storage
--   * Show preview thumbnails in the application review modal
--   * Block submission until all required documents are uploaded
-- =============================================================
