# URGENT FIX: Supabase Storage RLS Policies

**Run these SQL commands in your Supabase SQL Editor NOW to fix attachment uploads!**

---

## Problem

You're getting this error:

```
Failed to upload IMAP attachment: Error: Storage upload failed: new row violates row-level security policy
```

This happens because the `email-attachments` bucket exists but has no RLS policies allowing uploads.

---

## Solution: Run These SQL Commands

### Step 1: Verify Bucket Exists

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'email-attachments';
```

**Expected result:** Should show 1 row with the bucket details.

---

### Step 2: Create RLS Policies

Copy and paste this **entire block** into Supabase SQL Editor and click "Run":

```sql
-- ============================================
-- Email Attachments Storage RLS Policies
-- ============================================

-- Policy 1: Allow users to upload to their own folder
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 2: Allow users to read from their own folder
CREATE POLICY "Users can read their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Allow users to delete from their own folder
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 4: Allow users to update their own attachments (optional)
CREATE POLICY "Users can update their own attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

---

### Step 3: Verify Policies Were Created

```sql
-- Check that all 4 policies exist
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

**Expected result:** Should show 4 policies for email attachments.

---

## How the RLS Policies Work

Your attachments are stored in this structure:

```
email-attachments/
└── attachments/
    └── {userId}/          ← This is auth.uid()
        └── 2025/
            └── 10/
                └── 1729430200000-document.pdf
```

The RLS policies check:

1. `bucket_id = 'email-attachments'` - Correct bucket
2. `(storage.foldername(name))[1] = 'attachments'` - First folder is 'attachments'
3. `(storage.foldername(name))[2] = auth.uid()::text` - Second folder matches user ID

This ensures users can only access their own attachments!

---

## After Running SQL

1. **Refresh your dev server page** (or wait for next sync)
2. **Send a test email** with attachment
3. **Watch terminal** - should see:
   ```
   📎 Processing attachments for email: xyz (imap)
   💾 Uploading attachment: document.pdf
   ✅ Uploaded and saved attachment: document.pdf
   ✅ Saved 1 attachment(s) metadata
   ```
4. **No more RLS errors!** ✅

---

## Clean Up Duplicate Metadata (Optional)

After RLS policies are working, you may want to clean up duplicate attachment records:

```sql
-- WARNING: This will delete duplicate attachment metadata
-- Only run AFTER RLS policies are working!

-- Preview duplicates (run this first to see what will be deleted)
SELECT
  email_id,
  original_filename,
  COUNT(*) as duplicate_count
FROM email_attachments
WHERE storage_url IS NULL  -- Failed uploads have no URL
GROUP BY email_id, original_filename
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- If you're happy with the preview, delete duplicates
-- Keep only the most recent record for each email+filename combo
DELETE FROM email_attachments
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY email_id, original_filename
        ORDER BY created_at DESC
      ) as rn
    FROM email_attachments
    WHERE storage_url IS NULL
  ) t
  WHERE t.rn > 1
);
```

---

## Troubleshooting

### Error: "policy already exists"

If you see this error when creating policies, they already exist! Skip to Step 3 to verify.

### Error: "relation does not exist"

Make sure you're running the SQL in the correct Supabase project. Check your `.env.local` file for the correct Supabase URL.

### Attachments still not uploading

1. Check terminal for different error messages
2. Verify your Supabase keys in `.env.local`
3. Make sure you're logged in to the app
4. Check Supabase Dashboard → Storage → email-attachments to see if any files appear

---

✅ **Run the SQL above and attachments will work!**


