# Step-by-step: enable Supabase Auth + tighten RLS

After this, the app stops accepting the hardcoded `admin / officer / registrar` logins.
Users sign in with real email + password verified by Supabase, and Postgres
enforces per-role / per-district access at the row level.

## Before you start
- The base schema (`supabase/schema.sql`) must already be applied — you've done this.
- You should currently see the green "Database" badge in the app's topbar.

## 1. Apply the auth + RLS migration

1. In Supabase dashboard → **SQL Editor** → **New query**.
2. Open `supabase/auth-and-rls.sql` from this repo.
3. Copy the whole file, paste, click **Run**.
4. Should report "Success. No rows returned".

What this does:
- Creates a `profiles` table linked to `auth.users`.
- Adds `current_role()`, `current_district()`, `is_active()` helper functions.
- Replaces every permissive `anon` policy with role-based RLS.
- Adds a trigger that auto-creates a profile row when an auth user is created.

## 2. Create the three demo accounts

In the Supabase dashboard → **Authentication** → **Users** → click **Add user** → **Create new user** (top right).

Create these three, one at a time. **Check "Auto Confirm User"** each time so you can sign in immediately without an email link.

| Email | Password |
|-------|----------|
| `florence.akello@uinr.go.ug` | `SuperAdmin2024!` |
| `patrick.mukasa@uinr.go.ug`  | `Officer2024!`   |
| `grace.atim@uinr.go.ug`      | `Registrar2024!` |

After each one is created, the trigger automatically inserts a `profiles` row
with default values (role = District Registrar, district = Kampala).

## 3. Assign roles and districts

The defaults aren't what we want for Florence, Patrick, and Grace. Run this in
**SQL Editor → New query**:

```sql
update public.profiles
set name = 'Florence Akello', username = 'admin',
    role = 'Super Admin', district = 'Kampala'
where id = (select id from auth.users where email = 'florence.akello@uinr.go.ug');

update public.profiles
set name = 'Patrick Mukasa', username = 'officer',
    role = 'Ministry Officer', district = 'Kampala'
where id = (select id from auth.users where email = 'patrick.mukasa@uinr.go.ug');

update public.profiles
set name = 'Grace Atim', username = 'registrar',
    role = 'District Registrar', district = 'Gulu'
where id = (select id from auth.users where email = 'grace.atim@uinr.go.ug');
```

Click **Run**. Should return 3 rows updated.

Verify in **Table Editor → profiles** — you should see three rows with
the correct roles and districts.

## 4. Restart and sign in

In your terminal:
```bash
# Ctrl+C the dev server, then:
npm run dev
```

Refresh http://localhost:5173. The login screen will now ask for **Email**
(not Username + Role). Sign in with:

```
florence.akello@uinr.go.ug
SuperAdmin2024!
```

You should land on the dashboard. The topbar still shows green **Database**.

## 5. Test the three roles

Sign out (sidebar → Sign out) and sign in as each in turn:

| Sign in as | What you should see |
|------------|---------------------|
| `florence.akello@uinr.go.ug` | Full access. Can read/edit/delete every record, see Roles & Access menu. |
| `patrick.mukasa@uinr.go.ug`  | All districts visible, but Edit/Delete buttons are greyed out. Cannot create new records. No Roles & Access menu. |
| `grace.atim@uinr.go.ug`      | Only Gulu records visible in Students, Hospitals, Families. Can edit/create within Gulu. No Roles & Access menu. |

If Grace tries an `UPDATE` outside Gulu via Supabase directly, Postgres rejects it.

## 6. Adding more real users later

For every new staff account:

1. Dashboard → **Authentication** → **Users** → **Add user** → **Create new user** (Auto Confirm).
2. Run a single SQL to assign the right role:
   ```sql
   update public.profiles
   set name = '...', username = '...', role = '...', district = '...'
   where id = (select id from auth.users where email = 'newperson@uinr.go.ug');
   ```
3. Done.

## 7. Rotate the secret key

If you haven't already: API Keys page → Secret keys → delete the one you pasted
in chat earlier → generate a new one. Never share that one.

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| "Invalid login credentials" | Wrong email or password. Or the user was not Auto-Confirmed. Check Authentication → Users — that user must show "Confirmed". |
| "No profile found for this account" | The trigger didn't fire. Run `select * from public.profiles;` — if no row for that user, the migration wasn't applied. Re-run `auth-and-rls.sql`. |
| Tables look empty after sign-in | RLS is working *too* hard — the user's profile probably has the wrong role or status. Check `select * from public.profiles where id = '<that-user>';`. |
| "This account has been suspended" | The profile row has `status = 'Suspended'`. Toggle back to Active via Table Editor or `update public.profiles set status='Active' where ...`. |

## Why this is safer

Before this migration:
- Anyone with the publishable key could read/write any row.
- The login was hardcoded in the JS bundle — anyone could log in as "admin" by reading the source.
- RLS policies said "allow everyone".

After this migration:
- Login goes through Supabase Auth — passwords are bcrypt-hashed, sessions are JWT-signed.
- Every Postgres query checks `auth.uid()` and uses the user's profile to decide what they can see.
- A District Registrar literally cannot read another district's rows, even if they construct the query themselves.
