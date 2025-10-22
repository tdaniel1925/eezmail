# SQL: Find and Clean Up Duplicate Attachments

## Problem

You mentioned getting "a lot of duplicate attachment files" on the attachments page. This is likely due to multiple sync attempts creating duplicate database records.

---

## Step 1: Check for Duplicates

Run this in Supabase SQL Editor to see how many duplicates you have:

```sql
-- Find duplicate attachments (same email_id + filename)
SELECT
  email_id,
  filename,
  original_filename,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at DESC) as attachment_ids
FROM email_attachments
WHERE email_id IS NOT NULL
GROUP BY email_id, filename, original_filename
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

This shows:

- Which emails have duplicate attachments
- How many duplicates exist
- The IDs of all duplicate records (newest first)

---

## Step 2: Delete Duplicates (Keep Newest)

**⚠️ BACKUP FIRST!** This is destructive.

```sql
-- Delete duplicates, keep only the newest record for each email_id + filename combo
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email_id, filename, original_filename
      ORDER BY created_at DESC
    ) as row_num
  FROM email_attachments
  WHERE email_id IS NOT NULL
)
DELETE FROM email_attachments
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);
```

This query:

1. Groups attachments by `email_id` + `filename` + `original_filename`
2. Numbers each group (1 = newest, 2+ = duplicates)
3. Deletes all records where `row_num > 1` (keeps only #1, the newest)

---

## Step 3: Verify Cleanup

Check that duplicates are gone:

```sql
-- Should return 0 rows if all duplicates removed
SELECT
  email_id,
  filename,
  COUNT(*) as count
FROM email_attachments
WHERE email_id IS NOT NULL
GROUP BY email_id, filename
HAVING COUNT(*) > 1;
```

---

## Alternative: Just Count Duplicates

If you just want to see how bad it is:

```sql
-- Total duplicate records
SELECT COUNT(*) as total_duplicates
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email_id, filename, original_filename
      ORDER BY created_at DESC
    ) as row_num
  FROM email_attachments
  WHERE email_id IS NOT NULL
) sub
WHERE row_num > 1;
```

---

## Or Just Use the Reset Button! 🎉

**Easiest Option:**

1. Go to `/dashboard/attachments`
2. Click the orange **"Reset"** button
3. Confirm
4. Wait for page to refresh
5. Background sync will re-process ALL attachments
6. Duplicates will be automatically eliminated

The reset button does all this cleanup for you, plus applies the latest filters (inline attachments, etc.)!

---

## Which Should You Use?

### Use SQL (Step 2) if:

- ✅ You want to keep current attachment records
- ✅ You only want to remove duplicates
- ✅ You understand SQL and want manual control

### Use Reset Button if:

- ✅ You want a fresh start
- ✅ You want latest filtering logic applied
- ✅ You want the easiest solution
- ✅ You're okay waiting 30-60 seconds for re-sync

**Recommendation:** Use the **Reset button** - it's safer, easier, and ensures everything is up-to-date! 🚀


