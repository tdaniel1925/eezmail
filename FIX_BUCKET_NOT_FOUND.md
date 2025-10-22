# 🚨 FIX: "Bucket not found" Error

## Problem

When clicking attachments, you get:

```json
{
  "statusCode": "404",
  "error": "Bucket not found",
  "message": "Bucket not found"
}
```

This means the Supabase Storage bucket `email-attachments` **doesn't exist yet**.

---

## ✅ SOLUTION: Create the Storage Bucket

### Option 1: Via Supabase Dashboard (EASIEST)

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage:**
   - Click "Storage" in left sidebar
   - Click "Create a new bucket"

3. **Create the bucket:**

   ```
   Name: email-attachments
   Public: NO (keep it private)
   File size limit: 50MB (or your preference)
   Allowed MIME types: Leave empty (allow all)
   ```

4. **Click "Create bucket"**

5. **Set up RLS policies** (you already have the SQL in `RLS_POLICIES_FIX_NOW.md`):
   - Go to Storage → email-attachments → Policies
   - Or go to SQL Editor
   - Run the SQL from `RLS_POLICIES_FIX_NOW.md` (Step 2)

---

### Option 2: Via SQL (if Dashboard fails)

Run this in Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('email-attachments', 'email-attachments', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;
```

Then run the RLS policies from `RLS_POLICIES_FIX_NOW.md`.

---

## 🔍 Verify Bucket Exists

Run this in Supabase SQL Editor:

```sql
SELECT * FROM storage.buckets WHERE id = 'email-attachments';
```

Should return:

```
id                 | name              | public | file_size_limit | allowed_mime_types
email-attachments  | email-attachments | false  | 52428800        | NULL
```

---

## 🎯 After Creating Bucket

### Test Download:

1. Go back to `/dashboard/attachments`
2. Click on "Letter*to_Trent_Daniel*-\_10-17-25.pdf"
3. Should now download successfully!

### If Still Failing:

The file might not have been uploaded to storage yet. The logs show:

```
✅ Uploaded and saved attachment: Letter to Trent Daniel - 10-17-25.pdf
```

But this might have failed silently if the bucket didn't exist.

**Solution:** Use the **Reset button** to re-sync all attachments:

1. Click orange "Reset" button on attachments page
2. Confirm reset
3. Wait for page refresh
4. Wait 30-60 seconds for background sync
5. Refresh page
6. Try downloading again

---

## 📊 Quick Status Check

**Check if bucket exists:**

```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'email-attachments';
```

**Check if files are in storage:**

```sql
SELECT name, bucket_id, created_at
FROM storage.objects
WHERE bucket_id = 'email-attachments'
ORDER BY created_at DESC
LIMIT 10;
```

**Check attachment metadata:**

```sql
SELECT
  original_filename,
  download_status,
  storage_url,
  storage_key,
  created_at
FROM email_attachments
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎬 Step-by-Step Fix NOW:

### 1. Create Bucket (30 seconds)

- Go to Supabase → Storage → Create bucket
- Name: `email-attachments`
- Public: NO
- Click "Create"

### 2. Add RLS Policies (1 minute)

- Go to SQL Editor
- Copy SQL from `RLS_POLICIES_FIX_NOW.md` Step 2
- Paste and RUN

### 3. Reset Attachments (2 minutes)

- Go to `/dashboard/attachments`
- Click orange "Reset" button
- Confirm
- Wait for auto-refresh
- Wait 30-60 seconds
- Refresh page manually

### 4. Test Download

- Click any attachment
- Should download successfully! ✅

---

## 🐛 Why This Happened

The attachment system was built assuming the storage bucket existed, but it needs to be created manually in Supabase first. The bucket creation step was documented in `SUPABASE_STORAGE_SETUP.md` but might have been missed.

---

## ✅ Expected Result

After creating the bucket:

- Attachments download successfully
- Preview modal shows file content
- No "Bucket not found" errors
- Files stored securely in Supabase Storage

---

**TL;DR:**

1. Go to Supabase Dashboard → Storage
2. Create bucket named `email-attachments` (private)
3. Run RLS policies SQL from `RLS_POLICIES_FIX_NOW.md`
4. Click "Reset" button on attachments page
5. Wait for re-sync
6. Try downloading again ✅


