# Duplicate Attachments Fix ✅

## Problem

Attachments were being synced multiple times, creating tons of duplicate records in the database. Every time an email was re-synced (which happens on conflict updates), new attachment records were being created instead of checking for existing ones.

---

## Root Cause

The attachment saving functions didn't check for duplicates before inserting:

1. **`saveAttachmentMetadata()`** in `src/lib/email/attachment-service.ts`
   - Used for Gmail/Outlook attachments (metadata only, on-demand download)
   - Inserted attachment records every time without checking if they already exist

2. **`uploadAndSave()`** in `src/lib/email/attachment-service.ts`
   - Used for IMAP attachments (immediate upload) and sent emails
   - Uploaded to storage and saved to DB without duplicate checking

3. **Email Sync Behavior**
   - Emails use `onConflictDoUpdate` to handle re-syncs
   - When an email is updated, `processEmailAttachments()` is called again
   - This created new attachment records every time

---

## Solution Implemented

### 1. Added Duplicate Prevention in `saveAttachmentMetadata()`

```typescript
async function saveAttachmentMetadata(params: SaveMetadataParams): Promise<void> {
  for (const att of attachments) {
    try {
      const sanitizedFilename = sanitizeFilename(att.filename);

      // ✅ NEW: Check if attachment already exists for this email + filename
      const existingAttachment = await db
        .select()
        .from(emailAttachments)
        .where(
          and(
            eq(emailAttachments.emailId, emailId),
            eq(emailAttachments.originalFilename, att.filename)
          )
        )
        .limit(1);

      if (existingAttachment.length > 0) {
        console.log(`⏭️  Skipping duplicate attachment: ${att.filename}`);
        continue; // Skip this attachment, it already exists
      }

      // Only insert if doesn't exist
      await db.insert(emailAttachments).values({...});
    } catch (error) {
      console.error(`Failed to save attachment metadata:`, error);
    }
  }
}
```

### 2. Added Duplicate Prevention in `uploadAndSave()`

```typescript
export async function uploadAndSave(
  params: UploadAndSaveParams
): Promise<void> {
  try {
    // ✅ NEW: Check if attachment already exists for this email + filename
    const existingAttachment = await db
      .select()
      .from(emailAttachments)
      .where(
        and(
          eq(emailAttachments.emailId, params.emailId),
          eq(emailAttachments.originalFilename, params.originalFilename)
        )
      )
      .limit(1);

    if (existingAttachment.length > 0) {
      console.log(
        `⏭️  Skipping duplicate attachment upload: ${params.originalFilename}`
      );
      return; // Skip this attachment, it already exists
    }

    // Only upload and insert if doesn't exist
    const supabase = await createClient();
    // ... rest of upload logic
  } catch (error) {
    console.error(`Failed to upload attachment:`, error);
    throw error;
  }
}
```

---

## How It Works Now

### Email Sync Flow (No More Duplicates!)

1. **First Sync:**
   - Email synced with attachments
   - `processEmailAttachments()` called
   - Checks database: no existing attachments found
   - Creates new attachment records ✅

2. **Re-Sync (Manual/Auto):**
   - Same email synced again (maybe folder changed, read status, etc.)
   - Email uses `onConflictDoUpdate` - gets updated, not duplicated
   - `processEmailAttachments()` called again
   - Checks database: existing attachments found for same `emailId` + `filename`
   - Skips creating new records ✅
   - Logs: `⏭️  Skipping duplicate attachment: document.pdf`

3. **Result:**
   - Each email + filename combination only exists once
   - No duplicate storage uploads
   - No duplicate database records
   - Sync can run multiple times safely

---

## Files Modified

1. **`src/lib/email/attachment-service.ts`**
   - Added duplicate checking in `saveAttachmentMetadata()` (lines 254-268)
   - Added duplicate checking in `uploadAndSave()` (lines 527-542)
   - Uses `and()`, `eq()` from Drizzle ORM for precise queries

---

## Testing

### To Verify Fix Works:

1. **Trigger Multiple Syncs:**

   ```bash
   # In browser, manually sync your account 3-4 times
   # Go to Settings → Email Accounts → Click "Sync Now" multiple times
   ```

2. **Check for Duplicates:**

   ```sql
   -- Run in Supabase SQL Editor
   SELECT
     email_id,
     original_filename,
     COUNT(*) as count
   FROM email_attachments
   GROUP BY email_id, original_filename
   HAVING COUNT(*) > 1;
   ```

   Should return **0 rows** ✅

3. **Check Console Logs:**
   - Look for `⏭️  Skipping duplicate attachment: ...` messages
   - Confirms duplicate prevention is working

---

## Clean Up Existing Duplicates

If you already have duplicates from before this fix, run this SQL in Supabase:

```sql
-- Delete duplicates, keep only the newest record for each email_id + filename combo
WITH duplicates AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY email_id, original_filename
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

**⚠️ Backup first!** This is destructive and cannot be undone.

---

## Additional Improvements Made

### Stop Sync Button

Added a "Stop Sync" button to the attachments page:

- Always visible (not conditional)
- Disabled when sync is not running
- Enabled and animated (pulse) when sync is running
- Calls `/api/attachments/stop-sync` endpoint

**Files:**

- `src/app/dashboard/attachments/page.tsx` - Added button and `handleStopSync()` function
- `src/app/api/attachments/stop-sync/route.ts` - Created new API endpoint

---

## Future Enhancements (Optional)

### Add Unique Constraint

To enforce uniqueness at the database level:

```sql
-- Add unique constraint to prevent duplicates at DB level
ALTER TABLE email_attachments
ADD CONSTRAINT unique_email_attachment
UNIQUE (email_id, original_filename);
```

This would make duplicate prevention even more robust, but might cause errors if not handled properly in the code (would need to catch the constraint violation error).

---

## Status

✅ **Duplicate Prevention: COMPLETE**
✅ **Stop Sync Button: COMPLETE**  
✅ **API Endpoint: CREATED**
✅ **Testing: READY**

**Next Step:** Test by manually syncing multiple times and verifying no new duplicates are created.


