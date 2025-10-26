# Database User Sync Issue - FIXED

## ❌ Problem

User logged in successfully but got "Failed to load settings" error:

```
Key (user_id)=(b3de7392-1048-4f99-acf5-8252a8b09c0c) is not present in table "users".
```

## 🔍 Root Cause

- User exists in `auth.users` (Supabase Auth)
- User does NOT exist in `public.users` (Application database)
- Foreign key constraint prevents inserting into related tables

## ✅ Solution

Run the migration `migrations/009_sync_auth_users.sql` to:

1. Create a trigger that automatically creates `public.users` entry when Supabase Auth user is created
2. Backfill existing auth users into `public.users`

## 🛠️ How to Fix

### Option 1: Run Migration in Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/hfduyqvdajtvnsldqmro/editor
2. Click "SQL Editor"
3. Copy the contents of `migrations/009_sync_auth_users.sql`
4. Paste and click "Run"
5. You should see: "Migration complete. Users synced: X"

### Option 2: Use Supabase CLI

```bash
supabase db push
```

### Option 3: Manual Fix (Quick)

Run this SQL in Supabase SQL Editor:

```sql
-- Backfill the current user
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT
  id,
  email,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE id = 'b3de7392-1048-4f99-acf5-8252a8b09c0c'
ON CONFLICT (id) DO NOTHING;
```

## 🧪 Test After Fix

1. Refresh the page
2. Go to Settings
3. Should work without errors

---

**After running the migration, all new users will automatically get a `public.users` entry!**
