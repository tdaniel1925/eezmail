# Reply Later - Quick Debugging Steps

## Step 1: Clear Existing Data (If Needed)

Run this SQL in your Supabase SQL Editor:

```sql
UPDATE emails 
SET 
  reply_later_until = NULL,
  reply_later_note = NULL,
  updated_at = NOW()
WHERE reply_later_until IS NOT NULL;
```

## Step 2: Test Reply Later Functionality

1. **Open your email client** at `http://localhost:3000/dashboard/inbox`
2. **Open browser console** (`F12` or `Ctrl+Shift+J`)
3. **Clear console** to see fresh logs
4. **Click on any email** to open it
5. **Click the Clock icon** in the top action bar
6. **Select "In 2 hours"**

## Step 3: Check Console Logs

You should see logs in this order:

### **A. When you click "Reply Later":**
```
[markAsReplyLater] Called with: { emailId: "...", replyLaterUntil: Date, note: undefined }
[markAsReplyLater] User: "your-user-id"
[markAsReplyLater] User account IDs: ["account-id-1"]
[markAsReplyLater] Database update result: [{ id: "email-id" }]
[markAsReplyLater] Success!
```

### **B. Context refreshes automatically:**
```
[getReplyLaterEmails] Called
[getReplyLaterEmails] User: "your-user-id"
[getReplyLaterEmails] User account IDs: ["account-id-1"]
[getReplyLaterEmails] Found emails: 1 [...]
```

### **C. Component updates:**
```
[ReplyLaterContext] Emails updated: 1 [Array with 1 email]
[ReplyLaterStack] Emails prop: 1 [Array with 1 email]
[ReplyLaterStack] Mounted: true Mobile: false
```

### **D. Bubble should appear:**
You should now see a circular bubble at the **bottom-center** of your screen!

---

## Troubleshooting Specific Errors

### Error: "syntax error at or near 'in'"

**This happens when:**
- Using SQL keywords as column names without quotes
- Incorrect SQL syntax

**Common mistakes:**
```sql
❌ DELETE FROM emails WHERE id in (...)  -- 'in' needs to be 'IN'
❌ UPDATE emails SET reply_later_until in NULL  -- Should be '= NULL'
❌ SELECT * from emails where reply_later_until in not null  -- Should be 'IS NOT NULL'
```

**Correct syntax:**
```sql
✅ UPDATE emails SET reply_later_until = NULL WHERE reply_later_until IS NOT NULL;
✅ DELETE FROM emails WHERE id IN ('id1', 'id2');
✅ SELECT * FROM emails WHERE reply_later_until IS NOT NULL;
```

---

## Step 4: Verify Database Directly

Run this SQL to see if any emails have `reply_later_until` set:

```sql
SELECT 
  id,
  subject,
  reply_later_until,
  reply_later_note,
  is_trashed,
  "fromAddress"
FROM emails 
WHERE reply_later_until IS NOT NULL
ORDER BY reply_later_until DESC
LIMIT 10;
```

**Expected result:**
- If Reply Later worked: You'll see 1+ rows with `reply_later_until` timestamps
- If it didn't work: You'll see 0 rows

---

## Step 5: Manual Test (Bypass UI)

If the UI isn't working, test the database directly:

```sql
-- Find any email ID from your account
SELECT id, subject FROM emails LIMIT 1;

-- Manually set reply_later_until on that email
UPDATE emails 
SET reply_later_until = NOW() + INTERVAL '2 hours'
WHERE id = 'your-email-id-here';

-- Verify it was set
SELECT id, subject, reply_later_until 
FROM emails 
WHERE id = 'your-email-id-here';
```

Then refresh your dashboard and check if the bubble appears.

---

## Common Issues

### 1. No logs appear when clicking "Reply Later"
**Problem:** Function isn't being called  
**Solution:** Check if `useReplyLater` hook is properly imported in EmailViewer

### 2. Log shows "No user found"
**Problem:** Not authenticated  
**Solution:** Log out and log back in

### 3. Log shows "User account IDs: []"
**Problem:** No email accounts connected  
**Solution:** Connect an email account (Gmail/Microsoft)

### 4. Log shows "Database update result: []"
**Problem:** Email doesn't belong to your account  
**Solution:** Make sure you're clicking on an email that's actually in your inbox

### 5. Bubble doesn't appear even though logs show success
**Problem:** CSS or positioning issue  
**Solution:** 
- Hard refresh (`Ctrl+F5`)
- Check if bubble is off-screen (use browser DevTools to find `ReplyLaterStack` element)
- Verify `z-index` isn't being overridden

---

## What to Share with Me

If it's still not working, please share:

1. **All console logs** after clicking "Reply Later"
2. **Result of this SQL query:**
   ```sql
   SELECT COUNT(*) as total_emails FROM emails;
   SELECT COUNT(*) as reply_later_emails FROM emails WHERE reply_later_until IS NOT NULL;
   ```
3. **Screenshot of your screen** after clicking Reply Later (to see if bubble is hidden somewhere)
4. **Browser and screen size** (e.g., "Chrome on 1920x1080 desktop")

This will help me identify exactly where the issue is!

