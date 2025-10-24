# 🔄 RESTART SERVERS TO APPLY NEW CODE

## What Changed:

- Fixed `categorizeFolderName` to properly categorize sent/drafts/trash
- Sent emails will no longer appear in inbox

## Why Restart:

The current sync (2,370+ emails) is using the **OLD cached code**. We need to restart both servers to load the new logic.

## Steps:

### 1. Stop Both Servers

In your terminals:

- **Terminal 1 (Next.js):** Press `Ctrl+C`
- **Terminal 2 (Inngest):** Press `Ctrl+C`

### 2. Wait 3 seconds

### 3. Restart Both Servers

```powershell
# Terminal 1 - Start Next.js
cd c:\dev\win-email_client
npm run dev

# Terminal 2 - Start Inngest (wait 8 seconds after Next.js starts)
npx inngest-cli@latest dev --no-discovery -u http://localhost:3000/api/inngest
```

### 4. Run SQL Script

After servers restart, run this in Supabase SQL Editor:

```sql
-- FIX_SENT_EMAIL_CATEGORIES.sql
UPDATE emails
SET email_category = 'archived'
WHERE folder_name IN ('sent', 'sentitems', 'Sent Items')
  AND account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

UPDATE emails
SET email_category = 'unscreened'
WHERE folder_name = 'drafts'
  AND account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';

UPDATE emails
SET email_category = 'archived'
WHERE folder_name IN ('trash', 'deleteditems', 'deleted', 'Deleted Items')
  AND account_id = '26ddbb0d-12f4-422b-8a33-fd1e8072e33c';
```

### 5. Check Your Inbox

- Go to http://localhost:3000/dashboard/inbox
- You should see **ONLY inbox emails** (not sent emails)

---

## ⚠️ Note About the Current Sync:

The sync that's currently running (2,370+ emails) will finish with the **OLD categorization**. That's why we need to run the SQL script above to fix the categories after the servers restart.

---

## Expected Result After Restart:

✅ Sent emails categorized as 'archived' (won't show in inbox)  
✅ Drafts categorized as 'unscreened'  
✅ Trash categorized as 'archived'  
✅ Only inbox emails show in the inbox view
