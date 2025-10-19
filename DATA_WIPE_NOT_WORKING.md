# Quick Fix: Restart Dev Server & Clear Data

## The Issue
The updated wipe function code hasn't loaded yet because your dev server is still running the old code.

## Solution Steps

### **Step 1: Stop Dev Server**
In your terminal where `npm run dev` is running:
- Press `Ctrl+C` to stop the server

### **Step 2: Start Dev Server Again**
```bash
npm run dev
```

### **Step 3: Hard Refresh Browser**
```
Ctrl+Shift+R
```
Or:
```
Ctrl+F5
```

### **Step 4: Try Wipe Again**
1. Go to `/dashboard/settings`
2. Scroll to Danger Zone
3. Type "DELETE ALL DATA"
4. Click "Wipe All Data"

---

## If Data STILL Shows After Restart

The calendar events might be **mock/test data** hardcoded in the frontend, not from the database.

Let me check where those calendar events are coming from:

### **Check 1: Are they real database events?**
Open browser console (`F12`) and run:
```javascript
// Check if events are hardcoded
console.log('Calendar events:', document.querySelectorAll('[class*="event"]'));
```

### **Check 2: Clear browser cache completely**
Sometimes the browser caches the old data:
1. Open DevTools (`F12`)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

---

## Alternative: Manual Database Wipe

If the function still doesn't work, we can manually wipe the database:

### **Option 1: Via Supabase Dashboard**
1. Go to https://supabase.com
2. Open your project
3. Go to SQL Editor
4. Run this query:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Replace YOUR_USER_ID_HERE with the ID from above
DELETE FROM contact_notes WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM contact_timeline WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM ai_reply_drafts WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM chatbot_actions WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM extracted_actions WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM follow_up_reminders WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM tasks WHERE user_id = 'YOUR_USER_ID_HERE';

-- Delete emails (requires account ID)
DELETE FROM emails WHERE account_id IN (
  SELECT id FROM email_accounts WHERE user_id = 'YOUR_USER_ID_HERE'
);

-- Delete all other data
DELETE FROM contacts WHERE user_id = 'YOUR_USER_ID_HERE';
DELETE FROM email_accounts WHERE user_id = 'YOUR_USER_ID_HERE';
```

---

## Quick Test: Is It Working?

After restarting:

1. **Check Console Logs**: Look for new log messages showing more tables being deleted
2. **Check Calendar**: Should be completely empty
3. **Check AI Assistant**: Should have no context

---

## What I Need From You

**Please tell me:**

1. **Did you restart the dev server?** (Ctrl+C then `npm run dev`)
2. **Where is the data still showing?**
   - Calendar page?
   - AI assistant?
   - Both?
3. **Can you share a screenshot?**
4. **Can you open browser console and share any error messages?**

This will help me determine if:
- The code didn't load (need restart)
- The data is hardcoded (need to find where)
- The database query failed (need to see error)

---

**Most likely fix: Just restart your dev server with `Ctrl+C` then `npm run dev`** 🎯

