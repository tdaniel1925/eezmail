# Supabase Storage Setup for Email Attachments

This document explains how to set up the Supabase Storage bucket and Row Level Security (RLS) policies for email attachments.

## Step 1: Create Storage Bucket

Go to your Supabase Dashboard → Storage → Create a new bucket

**Bucket Configuration:**

- **Name**: `email-attachments`
- **Public**: ❌ **NO** (Keep private for security)
- **File size limit**: 50 MB (or your preference)
- **Allowed MIME types**: Leave empty (allow all) or restrict to specific types

**SQL Method (Alternative):**

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-attachments',
  'email-attachments',
  false,  -- Private bucket
  52428800,  -- 50 MB in bytes
  NULL  -- Allow all MIME types
);
```

## Step 2: Set Up RLS Policies

Email attachments should only be accessible by the user who owns them.

### Policy 1: Allow Users to Read Their Own Attachments

```sql
-- Policy for SELECT (download)
CREATE POLICY "Users can read their own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Explanation:**

- Attachments are stored in folders named by `userId`
- Example path: `attachments/{userId}/2025/01/1234567890-document.pdf`
- Policy checks if the folder name matches the authenticated user's ID

### Policy 2: Allow Users to Upload Their Own Attachments

```sql
-- Policy for INSERT (upload)
CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: Allow Users to Delete Their Own Attachments

```sql
-- Policy for DELETE
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 3: Enable Storage API Access

Make sure your environment variables are set correctly:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Step 4: Verify Setup

Test that your storage is working:

### Test 1: Upload a Test File

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'email-attachments';
```

### Test 2: Check Policies

```sql
-- List all policies for the bucket
SELECT * FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%attachment%';
```

### Test 3: Test Upload via API

Send an email with an attachment through the app and verify:

1. The attachment appears in Supabase Storage
2. The `email_attachments` table has a record
3. The `storage_url` and `storage_key` fields are populated

## Storage Structure

Files are organized by user and date:

```
email-attachments/
├── attachments/
│   └── {userId}/
│       ├── sent/
│       │   └── 1705123456789-document.pdf
│       ├── 2025/
│       │   ├── 01/
│       │   │   └── 1705123456789-invoice.pdf
│       │   └── 02/
│       │       └── 1705234567890-report.docx
│       └── ...
```

**Benefits of this structure:**

- Easy to query by user
- Organized by date for archival
- Prevents filename conflicts with timestamps
- Separate folder for sent email attachments

## Security Features

1. **Private Bucket**: Files are not publicly accessible
2. **User-scoped RLS**: Users can only access their own files
3. **Authenticated Access**: All operations require valid Supabase auth
4. **No Direct URLs**: Files can only be downloaded through authenticated API routes

## Troubleshooting

### Issue: "Access denied" when downloading

**Solution**: Check that:

1. User is authenticated
2. RLS policies are enabled
3. File path matches user ID structure

### Issue: Upload fails with 413 error

**Solution**: File exceeds bucket size limit. Either:

- Increase bucket file size limit
- Compress files before upload
- Show error to user

### Issue: Storage quota exceeded

**Solution**:

- Check Supabase dashboard for storage usage
- Implement cleanup for old attachments
- Upgrade Supabase plan if needed

## Monitoring

Track storage usage:

```sql
-- Get total storage used per user
SELECT
  (storage.foldername(name))[1] as user_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_bytes
FROM storage.objects
WHERE bucket_id = 'email-attachments'
GROUP BY (storage.foldername(name))[1]
ORDER BY total_bytes DESC;
```

## Cleanup Policy (Optional)

Automatically delete attachments older than 1 year:

```sql
-- Run this as a cron job or manually
DELETE FROM storage.objects
WHERE bucket_id = 'email-attachments'
  AND created_at < NOW() - INTERVAL '1 year';
```

**Note**: This will also trigger cascade deletion in `email_attachments` table.

## Complete Setup Checklist

- [ ] Create `email-attachments` bucket (private)
- [ ] Add RLS policy for SELECT (read)
- [ ] Add RLS policy for INSERT (upload)
- [ ] Add RLS policy for DELETE (delete)
- [ ] Verify environment variables are set
- [ ] Test upload via app
- [ ] Test download via app
- [ ] Test delete via app
- [ ] Monitor storage usage

## Next Steps

After setup:

1. Run the database migration: `migrations/add-attachment-fields.sql`
2. Test sending an email with attachment
3. Test receiving an email with attachment
4. Verify attachments page displays all files correctly


