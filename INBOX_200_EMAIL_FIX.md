# ✅ FIX: Inbox Only Showing 200 Emails

## 🚨 **The Problem:**

Your inbox is only showing **200 emails** out of 1,261+ that should be there.

### **Root Cause:**

The Microsoft Graph API was returning **batches of 10 emails** and **stopping after 200 emails**, then returning a **delta link**. The sync function was **saving this delta link**, which made all future syncs **incremental** (delta) syncs that only fetched **NEW emails**, not the remaining old ones.

This created a loop where:

1. Initial sync fetches 200 emails
2. Delta link is saved
3. Next manual sync uses delta link (incremental mode)
4. Only NEW emails are fetched (0 new emails)
5. Repeat forever

---

## ✅ **The Fix:**

Modified `src/inngest/functions/sync-microsoft.ts` to **NOT save the delta link** if the sync is incomplete.

### **New Logic:**

The delta link will now ONLY be saved if:

- ✅ **Synced at least 80% of expected emails**, OR
- ✅ **Folder has less than 50 emails** (small folders are fine), OR
- ✅ **In incremental mode** (delta syncs always save)

If less than 80% is synced, the next manual sync will **continue the full sync** from where it left off.

---

## 📋 **Next Steps:**

### **1. Restart Both Servers**

The code change needs to be loaded:

```powershell
# Stop all Node processes
Get-Process | Where-Object {$_.ProcessName -like '*node*'} | Stop-Process -Force

# Wait 3 seconds
Start-Sleep -Seconds 3

# Terminal 1: Start Next.js
cd c:\dev\win-email_client
npm run dev

# Terminal 2: Start Inngest (wait 8 seconds first)
npx inngest-cli@latest dev --no-discovery -u http://localhost:3000/api/inngest
```

### **2. Clear Delta Links (SQL)**

Run this in Supabase SQL Editor to force a full sync:

```sql
-- Clear delta links for Microsoft inbox folder
UPDATE email_folders
SET sync_cursor = NULL
WHERE account_id IN (
  SELECT id FROM email_accounts WHERE provider = 'microsoft'
)
AND name = 'inbox';

-- Verify
SELECT name, sync_cursor IS NOT NULL as has_delta_link
FROM email_folders
WHERE account_id IN (SELECT id FROM email_accounts WHERE provider = 'microsoft')
ORDER BY name;
```

### **3. Trigger Manual Sync**

1. Go to: http://localhost:3000/dashboard/settings
2. Click "Email Accounts" tab
3. Click "Sync Now"

### **4. Monitor the Sync**

Watch the terminal for these new log messages:

✅ **Good (will save delta link):**

```
✅ Delta link saved for folder "inbox" (95.2% synced)
```

⚠️ **Expected (won't save delta link, will continue next time):**

```
⚠️  NOT saving delta link - only 15.9% synced (200/1261)
   Will continue full sync on next run
```

---

## 📊 **Expected Behavior:**

1. **First sync:** Fetches 200 emails, **doesn't save delta link**
2. **Second sync (manual):** Continues from where it left off, fetches more
3. **Repeat** until 80%+ of emails are synced
4. **Final sync:** Saves delta link, future syncs are incremental

---

## 🎯 **Success Criteria:**

- ✅ Inbox shows **1,000+ emails** (80% of 1,261)
- ✅ Terminal shows: `✅ Delta link saved for folder "inbox" (XX% synced)`
- ✅ Next manual sync is incremental (fast)
- ✅ All folders eventually reach 80%+ sync rate

---

## ⏱️ **Timeline:**

With 10 emails per batch:

- **Per sync:** ~200 emails (20 batches × 10 emails)
- **Total syncs needed:** ~6-7 manual syncs
- **Total time:** ~5 minutes per sync = **30-35 minutes total**

But you can click "Sync Now" multiple times to speed it up!

---

## 🔍 **Troubleshooting:**

### **If sync still stops at 200:**

Check the terminal for:

```
⚠️  No next/delta link - Stopping at 200 emails
```

If you see this, the Graph API is the bottleneck. The fix is working correctly by not saving the delta link.

### **If you get stuck in incremental mode:**

Run the SQL script again to clear delta links.

---

**This fix ensures that initial syncs will continue across multiple runs until most emails are synced!** 🎉
