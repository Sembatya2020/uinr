# Connecting UINR to Supabase

This guide gets the app talking to a shared Postgres database so every device
(Windows, Mac, mobile) sees the same data. It takes about 10 minutes.

## 1. Create a Supabase project

1. Go to **https://supabase.com** and sign in (free tier is enough).
2. Click **New project**.
3. Pick a name like `uinr-registry`, set a strong database password (save it),
   choose the **closest region** (for Uganda, `eu-west-2` London or
   `ap-south-1` Mumbai give the lowest latency).
4. Wait ~2 minutes for the project to provision.

## 2. Run the schema

1. In the project sidebar open **SQL Editor**.
2. Click **New query**.
3. Open `supabase/schema.sql` from this repo, copy the entire file, paste it,
   and click **Run**. You should see "Success. No rows returned".
4. Open **Table Editor** in the sidebar and confirm these tables exist:
   `students`, `hospitals`, `families`, `audit_log`, `admins`,
   `sync_status`, `settings`.

## 3. Grab your credentials

1. In the sidebar open **Project Settings** (gear icon) → **API**.
2. Copy two values:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon public** key — the long `eyJhbG…` JWT under "Project API keys"

   Do **not** copy the `service_role` key — it bypasses Row Level Security
   and must never live in a browser app.

## 4. Add credentials to the app

In the project root (`uinr/`), copy `.env.example` to `.env` and paste in your
values:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

`.env` is gitignored, so the key never gets committed.

## 5. Restart the dev server

Vite only reads `.env` on startup. In your terminal:

```bash
# Stop the current dev server (Ctrl+C in the terminal running it)
npm run dev
```

When the app loads, you should see a green **"Database connected"** badge
in the topbar. If you see a red **"Demo mode"** badge instead, the env
variables aren't being read — double-check `.env` and restart `npm run dev`.

## 6. Seed the demo data

The schema gives you empty tables. To populate them with the same demo records
the localStorage version uses:

1. Log in to the app (`admin / uinr2024 / Super Admin`).
2. Go to **Settings → Database**.
3. Click **Seed demo data**.

This pushes 17 students, 12 hospitals, 8 families, 22 audit entries, and 6 admin
accounts into Supabase. You can verify in the Supabase Table Editor.

You can re-seed any time by clicking **Reset to demo data** in Settings
(this clears Postgres and re-inserts the seed).

## 7. Try it from another device

Open the same URL in a browser on a Mac, phone, or another Windows PC. Sign in.
Edit a student record. Refresh the original window. The change is there.

## Security note (read this)

Right now the Row Level Security policies in `schema.sql` are permissive —
any client with the anon key can read and write any row. This is fine for a
demo so the existing hard-coded login keeps working. Before this touches real
citizen data, you must:

1. **Wire Supabase Auth** so users sign in with real accounts.
2. **Tighten the policies** so District Registrars can only touch rows in
   their assigned district, Ministry Officers are read-only, etc. The
   policy stubs in `schema.sql` show the shape.
3. **Rotate the anon key** if it ever leaked, from
   Project Settings → API → "Rotate anon key".

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Demo mode" badge after restart | `.env` is in the wrong folder. It must be in `uinr/`, next to `package.json`. |
| `ERROR: relation "students" already exists` | The schema is idempotent — the `drop table` lines at the top should handle this. Make sure you copied the whole file. |
| `permission denied for table students` | RLS policies didn't run. Re-execute the schema script. |
| App loads but tables are empty | Click **Seed demo data** in Settings. |
| Slow first load | Free tier projects pause after 1 week of inactivity. Open the Supabase dashboard once to wake it. |

## Cleanup

To wipe a project entirely, re-run `schema.sql` — the `drop table if exists`
statements at the top reset every table.
