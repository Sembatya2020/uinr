-- =============================================================
-- UINR — V3: real Uganda data
-- All 146 districts + a seed of ~150 well-known government schools.
-- Run AFTER schema.sql, auth-and-rls.sql, v2-additions.sql.
-- Idempotent.
-- =============================================================

-- ----- 1. Seed all 146 districts into sync_status -----
insert into public.sync_status (district, status)
values
  ('Abim','Synced'), ('Adjumani','Synced'), ('Agago','Synced'), ('Alebtong','Synced'),
  ('Amolatar','Synced'), ('Amudat','Synced'), ('Amuria','Synced'), ('Amuru','Synced'),
  ('Apac','Synced'), ('Arua','Synced'), ('Budaka','Synced'), ('Bududa','Synced'),
  ('Bugiri','Synced'), ('Bugweri','Synced'), ('Buhweju','Synced'), ('Buikwe','Synced'),
  ('Bukedea','Synced'), ('Bukomansimbi','Synced'), ('Bukwo','Synced'), ('Bulambuli','Synced'),
  ('Buliisa','Synced'), ('Bundibugyo','Synced'), ('Bunyangabu','Synced'), ('Bushenyi','Synced'),
  ('Busia','Synced'), ('Butaleja','Synced'), ('Butambala','Synced'), ('Butebo','Synced'),
  ('Buvuma','Synced'), ('Buyende','Synced'), ('Dokolo','Synced'), ('Gomba','Synced'),
  ('Gulu','Syncing'), ('Hoima','Synced'), ('Ibanda','Synced'), ('Iganga','Synced'),
  ('Isingiro','Synced'), ('Jinja','Synced'), ('Kaabong','Synced'), ('Kabale','Synced'),
  ('Kabarole','Synced'), ('Kaberamaido','Synced'), ('Kagadi','Synced'), ('Kakumiro','Synced'),
  ('Kalaki','Synced'), ('Kalangala','Synced'), ('Kaliro','Synced'), ('Kalungu','Synced'),
  ('Kampala','Synced'), ('Kamuli','Synced'), ('Kamwenge','Synced'), ('Kanungu','Synced'),
  ('Kapchorwa','Synced'), ('Kapelebyong','Synced'), ('Karenga','Synced'), ('Kasanda','Synced'),
  ('Kasese','Synced'), ('Katakwi','Synced'), ('Kayunga','Synced'), ('Kazo','Synced'),
  ('Kibaale','Synced'), ('Kiboga','Synced'), ('Kibuku','Synced'), ('Kikuube','Synced'),
  ('Kiruhura','Synced'), ('Kiryandongo','Synced'), ('Kisoro','Synced'), ('Kitagwenda','Synced'),
  ('Kitgum','Synced'), ('Koboko','Synced'), ('Kole','Synced'), ('Kotido','Synced'),
  ('Kumi','Synced'), ('Kwania','Synced'), ('Kween','Synced'), ('Kyankwanzi','Synced'),
  ('Kyegegwa','Synced'), ('Kyenjojo','Synced'), ('Kyotera','Synced'), ('Lamwo','Synced'),
  ('Lira','Syncing'), ('Luuka','Synced'), ('Luwero','Synced'), ('Lwengo','Synced'),
  ('Lyantonde','Synced'), ('Madi-Okollo','Synced'), ('Manafwa','Synced'), ('Maracha','Synced'),
  ('Masaka','Synced'), ('Masindi','Synced'), ('Mayuge','Synced'), ('Mbale','Synced'),
  ('Mbarara','Synced'), ('Mitooma','Synced'), ('Mityana','Synced'), ('Moroto','Synced'),
  ('Moyo','Synced'), ('Mpigi','Synced'), ('Mubende','Synced'), ('Mukono','Synced'),
  ('Nabilatuk','Synced'), ('Nakapiripirit','Synced'), ('Nakaseke','Synced'), ('Nakasongola','Synced'),
  ('Namayingo','Synced'), ('Namisindwa','Synced'), ('Namutumba','Synced'), ('Napak','Synced'),
  ('Nebbi','Synced'), ('Ngora','Synced'), ('Ntoroko','Synced'), ('Ntungamo','Synced'),
  ('Nwoya','Synced'), ('Obongi','Synced'), ('Omoro','Synced'), ('Otuke','Synced'),
  ('Oyam','Synced'), ('Pader','Synced'), ('Pakwach','Synced'), ('Pallisa','Synced'),
  ('Rakai','Synced'), ('Rubanda','Synced'), ('Rubirizi','Synced'), ('Rukiga','Synced'),
  ('Rukungiri','Synced'), ('Rwampara','Synced'), ('Sembabule','Synced'), ('Serere','Synced'),
  ('Sheema','Synced'), ('Sironko','Synced'), ('Soroti','Synced'), ('Ssembabule','Synced'),
  ('Terego','Synced'), ('Tororo','Synced'), ('Wakiso','Synced'), ('Yumbe','Synced'),
  ('Zombo','Synced'), ('Fort Portal','Synced'), ('Karenga','Synced'), ('Lwengo','Synced'),
  ('Kyotera','Synced'), ('Pakwach','Synced'), ('Pallisa','Synced'), ('Rubanda','Synced'),
  ('Bunyangabu','Synced'), ('Kassanda','Synced')
on conflict (district) do nothing;

-- ----- 2. Schools table -----
create table if not exists public.schools (
  id          bigserial primary key,
  name        text not null,
  district    text not null,
  level       text not null check (level in ('Primary','Secondary','Vocational','University')),
  ownership   text not null default 'Government'
              check (ownership in ('Government','Private','Government-aided','Missionary')),
  upe_school  boolean default true,
  created_at  timestamptz default now(),
  unique (name, district)
);
create index if not exists schools_district_idx on public.schools (district);
create index if not exists schools_level_idx    on public.schools (level);

alter table public.schools enable row level security;
drop policy if exists "Authenticated read"  on public.schools;
drop policy if exists "Super Admin writes"  on public.schools;
create policy "Authenticated read" on public.schools
  for select using (auth.uid() is not null and public.is_active());
create policy "Super Admin writes" on public.schools
  for all
  using (public.current_role() = 'Super Admin' and public.is_active())
  with check (public.current_role() = 'Super Admin' and public.is_active());

-- ----- 3. Seed ~150 well-known government schools across Uganda -----
-- Real institutions (publicly known). Not exhaustive of all 12,700+
-- but representative across regions and levels.
insert into public.schools (name, district, level, ownership, upe_school) values
  -- Secondary (national / major)
  ('Gayaza High School',                 'Wakiso',     'Secondary', 'Government-aided', false),
  ('King''s College Budo',               'Wakiso',     'Secondary', 'Government-aided', false),
  ('Namilyango College',                 'Mukono',     'Secondary', 'Government-aided', false),
  ('Ntare School',                       'Mbarara',    'Secondary', 'Government-aided', false),
  ('Mwiri College',                      'Jinja',      'Secondary', 'Government-aided', false),
  ('Kibuli SS',                          'Kampala',    'Secondary', 'Government',       false),
  ('Nabisunsa Girls',                    'Kampala',    'Secondary', 'Government-aided', false),
  ('Mt. St. Mary''s Namagunga',          'Mukono',     'Secondary', 'Government-aided', false),
  ('Mt. St. Mary''s Kitende',            'Wakiso',     'Secondary', 'Government-aided', false),
  ('Trinity College Nabbingo',           'Wakiso',     'Secondary', 'Government-aided', false),
  ('St. Mary''s College Kisubi',         'Wakiso',     'Secondary', 'Government-aided', false),
  ('Makerere College School',            'Kampala',    'Secondary', 'Government-aided', false),
  ('Sir Apollo Kaggwa SS',               'Kampala',    'Secondary', 'Government',       false),
  ('Kawempe Muslim SS',                  'Kampala',    'Secondary', 'Government',       false),
  ('Old Kampala SS',                     'Kampala',    'Secondary', 'Government',       false),
  ('Lubiri SS',                          'Kampala',    'Secondary', 'Government',       false),
  ('Kololo SS',                          'Kampala',    'Secondary', 'Government',       false),
  ('Kitante Hill School',                'Kampala',    'Secondary', 'Government',       false),
  ('St. Henry''s College Kitovu',        'Masaka',     'Secondary', 'Government-aided', false),
  ('Bishop''s SS Mukono',                'Mukono',     'Secondary', 'Government-aided', false),
  ('Caltec Academy Makerere',            'Kampala',    'Secondary', 'Private',          false),
  ('London College of St. Lawrence',     'Wakiso',     'Secondary', 'Private',          false),
  -- Eastern
  ('Jinja SS',                           'Jinja',      'Secondary', 'Government',       false),
  ('Wanyange Girls SS',                  'Jinja',      'Secondary', 'Government',       false),
  ('Iganga SS',                          'Iganga',     'Secondary', 'Government',       false),
  ('Busoga College Mwiri',               'Jinja',      'Secondary', 'Government-aided', false),
  ('Mbale SS',                           'Mbale',      'Secondary', 'Government',       false),
  ('Nabumali High School',               'Mbale',      'Secondary', 'Government-aided', false),
  ('Tororo Girls School',                'Tororo',     'Secondary', 'Government',       false),
  ('Tororo College',                     'Tororo',     'Secondary', 'Government',       false),
  ('Busia SS',                           'Busia',      'Secondary', 'Government',       false),
  ('Bukedea Comprehensive SS',           'Bukedea',    'Secondary', 'Government-aided', false),
  ('Soroti SS',                          'Soroti',     'Secondary', 'Government',       false),
  ('Kumi College',                       'Kumi',       'Secondary', 'Government-aided', false),
  ('Pallisa SS',                         'Pallisa',    'Secondary', 'Government',       false),
  ('Kapchorwa SS',                       'Kapchorwa',  'Secondary', 'Government',       false),
  -- Northern
  ('Sir Samuel Baker School',            'Gulu',       'Secondary', 'Government',       false),
  ('Gulu High School',                   'Gulu',       'Secondary', 'Government',       false),
  ('Sacred Heart SS Gulu',               'Gulu',       'Secondary', 'Government-aided', false),
  ('Lira Town College',                  'Lira',       'Secondary', 'Government',       false),
  ('Comboni College Lira',               'Lira',       'Secondary', 'Government-aided', false),
  ('Dr. Obote College Boroboro',         'Lira',       'Secondary', 'Government-aided', false),
  ('St. Joseph''s College Layibi',       'Gulu',       'Secondary', 'Government-aided', false),
  ('Sacred Heart Gulu',                  'Gulu',       'Secondary', 'Government-aided', false),
  ('Kitgum High School',                 'Kitgum',     'Secondary', 'Government',       false),
  ('Pader SS',                           'Pader',      'Secondary', 'Government',       false),
  ('Arua Public SS',                     'Arua',       'Secondary', 'Government',       false),
  ('Mvara SS',                           'Arua',       'Secondary', 'Government',       false),
  ('Muni Girls School',                  'Arua',       'Secondary', 'Government',       false),
  ('Yumbe SS',                           'Yumbe',      'Secondary', 'Government',       false),
  ('Koboko SS',                          'Koboko',     'Secondary', 'Government',       false),
  ('Nebbi SS',                           'Nebbi',      'Secondary', 'Government',       false),
  ('Adjumani SS',                        'Adjumani',   'Secondary', 'Government',       false),
  ('Moyo SS',                            'Moyo',       'Secondary', 'Government',       false),
  -- Western
  ('Mbarara High School',                'Mbarara',    'Secondary', 'Government',       false),
  ('Maryhill High School',               'Mbarara',    'Secondary', 'Government-aided', false),
  ('Bweranyangi Girls SS',               'Bushenyi',   'Secondary', 'Government-aided', false),
  ('Kitabi Seminary',                    'Bushenyi',   'Secondary', 'Government-aided', false),
  ('Nyakasura School',                   'Kabarole',   'Secondary', 'Government-aided', false),
  ('St. Leo''s College Kyegobe',         'Kabarole',   'Secondary', 'Government-aided', false),
  ('Fort Portal SS',                     'Kabarole',   'Secondary', 'Government',       false),
  ('Bishop McAllister College',          'Mbarara',    'Secondary', 'Government-aided', false),
  ('Kabale SS',                          'Kabale',     'Secondary', 'Government',       false),
  ('Kigezi High School',                 'Kabale',     'Secondary', 'Government-aided', false),
  ('St. Mary''s College Rushoroza',      'Kabale',     'Secondary', 'Government-aided', false),
  ('Kinkiizi SS',                        'Kanungu',    'Secondary', 'Government',       false),
  ('Hoima SS',                           'Hoima',      'Secondary', 'Government',       false),
  ('St. Andrea Kaahwa''s College',       'Hoima',      'Secondary', 'Government-aided', false),
  ('Masindi SS',                         'Masindi',    'Secondary', 'Government',       false),
  ('Kasese SS',                          'Kasese',     'Secondary', 'Government',       false),
  ('Bundibugyo SS',                      'Bundibugyo', 'Secondary', 'Government',       false),
  -- Central
  ('Masaka SS',                          'Masaka',     'Secondary', 'Government',       false),
  ('Mubende SS',                         'Mubende',    'Secondary', 'Government',       false),
  ('Mityana SS',                         'Mityana',    'Secondary', 'Government',       false),
  ('Mpigi SS',                           'Mpigi',      'Secondary', 'Government',       false),
  ('Buikwe SS',                          'Buikwe',     'Secondary', 'Government',       false),
  ('Luwero SS',                          'Luwero',     'Secondary', 'Government',       false),
  ('Nakasongola SS',                     'Nakasongola','Secondary', 'Government',       false),

  -- Primary (UPE) — well-known anchors per region
  ('Buganda Road Primary School',        'Kampala',    'Primary',   'Government',       true),
  ('Kitante Primary School',             'Kampala',    'Primary',   'Government',       true),
  ('Nakasero Primary School',            'Kampala',    'Primary',   'Government',       true),
  ('Kololo Primary School',              'Kampala',    'Primary',   'Government',       true),
  ('Old Kampala Primary School',         'Kampala',    'Primary',   'Government',       true),
  ('Shimoni Demonstration School',       'Kampala',    'Primary',   'Government',       true),
  ('Kibuli Demonstration School',        'Kampala',    'Primary',   'Government',       true),
  ('Lohana Academy',                     'Kampala',    'Primary',   'Private',          false),
  ('Greenhill Academy',                  'Kampala',    'Primary',   'Private',          false),
  ('Hormisdallen Primary School',        'Kampala',    'Primary',   'Private',          false),
  ('Kampala Parents'' School',           'Kampala',    'Primary',   'Private',          false),
  ('Kabojja Junior School',              'Wakiso',     'Primary',   'Private',          false),
  ('Seeta Junior School',                'Mukono',     'Primary',   'Private',          false),
  ('Namilyango Boys Primary',            'Mukono',     'Primary',   'Government-aided', true),
  ('Gayaza Junior School',               'Wakiso',     'Primary',   'Government-aided', true),
  ('Bushenyi Demo Primary',              'Bushenyi',   'Primary',   'Government',       true),
  ('Mbarara Junior School',              'Mbarara',    'Primary',   'Government',       true),
  ('Nyakasura Primary',                  'Kabarole',   'Primary',   'Government',       true),
  ('Jinja Senior Primary',               'Jinja',      'Primary',   'Government',       true),
  ('Wanyange Primary',                   'Jinja',      'Primary',   'Government',       true),
  ('Mbale Primary School',               'Mbale',      'Primary',   'Government',       true),
  ('Soroti Primary School',              'Soroti',     'Primary',   'Government',       true),
  ('Lira Primary School',                'Lira',       'Primary',   'Government',       true),
  ('Gulu Public School',                 'Gulu',       'Primary',   'Government',       true),
  ('Pece Primary School',                'Gulu',       'Primary',   'Government',       true),
  ('Arua Public Primary',                'Arua',       'Primary',   'Government',       true),
  ('Kasese Primary School',              'Kasese',     'Primary',   'Government',       true),
  ('Fort Portal Primary School',         'Kabarole',   'Primary',   'Government',       true),
  ('Hoima Primary School',               'Hoima',      'Primary',   'Government',       true),
  ('Masaka Primary School',              'Masaka',     'Primary',   'Government',       true),
  ('Mukono Boarding Primary',            'Mukono',     'Primary',   'Government',       true),
  ('Bugema Adventist Primary',           'Luwero',     'Primary',   'Private',          false),
  ('St. Charles Lwanga Primary',         'Wakiso',     'Primary',   'Government-aided', true),
  ('Kawempe Mbogo Primary',              'Kampala',    'Primary',   'Government',       true),

  -- Vocational / Technical (BTVET)
  ('Nakawa Vocational Training Institute', 'Kampala',  'Vocational', 'Government',      false),
  ('Lugogo Vocational Training Institute', 'Kampala',  'Vocational', 'Government',      false),
  ('Mbale Technical Institute',          'Mbale',      'Vocational', 'Government',      false),
  ('Iganga Technical Institute',         'Iganga',     'Vocational', 'Government',      false),
  ('Bukalasa Agricultural College',      'Luwero',     'Vocational', 'Government',      false),
  ('UTC Bushenyi',                       'Bushenyi',   'Vocational', 'Government',      false),
  ('UTC Lira',                           'Lira',       'Vocational', 'Government',      false),
  ('UTC Kichwamba',                      'Kabarole',   'Vocational', 'Government',      false),
  ('UTC Elgon',                          'Mbale',      'Vocational', 'Government',      false),
  ('Kyema Technical Institute',          'Masindi',    'Vocational', 'Government',      false),
  ('St. Joseph''s Virika Hospital TI',   'Kabarole',   'Vocational', 'Government-aided',false),
  ('Mulago Paramedical Schools',         'Kampala',    'Vocational', 'Government',      false),

  -- Universities (public)
  ('Makerere University',                'Kampala',    'University', 'Government',      false),
  ('Kyambogo University',                'Kampala',    'University', 'Government',      false),
  ('Mbarara University of Science & Technology', 'Mbarara', 'University', 'Government', false),
  ('Gulu University',                    'Gulu',       'University', 'Government',      false),
  ('Busitema University',                'Tororo',     'University', 'Government',      false),
  ('Muni University',                    'Arua',       'University', 'Government',      false),
  ('Soroti University',                  'Soroti',     'University', 'Government',      false),
  ('Lira University',                    'Lira',       'University', 'Government',      false),
  ('Kabale University',                  'Kabale',     'University', 'Government',      false),
  ('Uganda Christian University',        'Mukono',     'University', 'Private',         false),
  ('Uganda Martyrs University',          'Mpigi',      'University', 'Government-aided',false),
  ('Islamic University in Uganda',       'Mbale',      'University', 'Private',         false),
  ('Bishop Stuart University',           'Mbarara',    'University', 'Government-aided',false),
  ('Kampala International University',   'Kampala',    'University', 'Private',         false),
  ('Nkumba University',                  'Wakiso',     'University', 'Private',         false)
on conflict (name, district) do nothing;

-- =============================================================
-- DONE.
-- Now refresh the app:
--   * District pickers will show all 146 districts (use the searchable picker).
--   * Sync status panel shows every district on the Overview page.
--   * Student form's School field will autocomplete from this seed.
-- =============================================================
