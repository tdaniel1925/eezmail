# 🔧 FIX: RLS Policy for Nested Folder Structure

## Problem

Your storage path is:

```
attachments/{userId}/2025/01/filename.pdf
```

But the RLS policies are checking:

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

This checks the **first** folder, which is `attachments`, not the user ID!

## ✅ Solution: Update RLS Policies

Run this SQL in **Supabase SQL Editor**:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own attachments" ON storage.objects;

-- Create new policies that check the SECOND folder (userId)
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can read their own attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

## What Changed?

**Before:**

```sql
(storage.foldername(name))[1] = auth.uid()::text
```

This checked if folder #1 matches user ID.

**After:**

```sql
(storage.foldername(name))[1] = 'attachments'
AND (storage.foldername(name))[2] = auth.uid()::text
```

This checks if folder #1 is `attachments` AND folder #2 matches user ID.

## Folder Structure:

```
email-attachments/
└── attachments/              ← Folder [1]
    └── {userId}/             ← Folder [2] (must match auth.uid())
        └── 2025/             ← Folder [3]
            └── 01/           ← Folder [4]
                └── file.pdf
```

---

## After Running SQL:

1. **Test upload immediately:**
   - The background sync should start working
   - Check terminal for `✅ Uploaded and saved attachment` messages
   - No more RLS policy errors!

2. **If attachments page is still empty:**
   - Click the orange **Reset** button
   - Confirm
   - Wait for page refresh
   - Wait 30-60 seconds for sync
   - Refresh page (F5)
   - Attachments should appear!

---

## Verify It Works:

Run this SQL to check if files are being uploaded:

```sql
SELECT
  name,
  created_at,
  bucket_id
FROM storage.objects
WHERE bucket_id = 'email-attachments'
ORDER BY created_at DESC
LIMIT 10;
```

Should see files with paths like:

```
attachments/bc958faa-efe4-4136-9882-789d9b161c6a/2025/01/1234567890-file.pdf
```

---

**TL;DR:** The RLS policies were checking folder [1] but needed to check folder [2] where the user ID actually is!


