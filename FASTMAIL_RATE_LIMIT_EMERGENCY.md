# 🚨 EMERGENCY: Fastmail Rate Limit Hit

**Error**: `451 Already reached per-10 minute limit for logins by "tdaniel@botmakers.ai" of 500`

---

## ⚠️ **What Happened:**

You've made **500 login attempts** to Fastmail in 10 minutes! This is because:

1. ❌ **Wrong SMTP password** in the database
2. 🔄 **Sync service keeps retrying** with bad credentials
3. 📧 **Every sync attempt** = 1 IMAP login + 1 SMTP login
4. ⏰ **Background sync** runs every few seconds
5. 💥 **Result**: Rate limit hit!

---

## 🛑 **IMMEDIATE ACTIONS NEEDED:**

### **1. STOP THE SERVER (Right Now!)**

```bash
# Press Ctrl+C in your terminal to stop the dev server
# This will stop the sync from hammering Fastmail
```

### **2. Wait 10 Minutes**

- ⏰ Fastmail's rate limit is **per 10 minutes**
- 🕐 Wait **at least 10 minutes** before trying again
- ☕ Go grab a coffee!

### **3. When You Come Back:**

**Do NOT start the server yet!** First, we need to fix your credentials.

---

## ✅ **How to Fix (After 10 Minutes):**

### **Step 1: Get Your REAL Fastmail App Password**

1. **Go to Fastmail** → Settings → Password & Security
2. **Click "App Passwords"**
3. **Create NEW app password** for "Email Client"
4. **Copy it** (you'll only see it once!)

### **Step 2: Update Via Supabase Dashboard**

Since we can't connect to the database directly, use Supabase:

1. **Go to your Supabase dashboard**
2. **Open SQL Editor**
3. **Run this query** (replace `YOUR_APP_PASSWORD` with your actual password):

```sql
UPDATE email_accounts
SET
  access_token = 'YOUR_ACTUAL_FASTMAIL_APP_PASSWORD',
  smtp_password = 'YOUR_ACTUAL_FASTMAIL_APP_PASSWORD',
  status = 'inactive',
  error_message = NULL
WHERE email_address = 'tdaniel@botmakers.ai';
```

**Note:** Setting `status = 'inactive'` will prevent auto-sync when you restart the server.

### **Step 3: Restart Server Safely**

After updating the password:

1. Start the server: `npm run dev`
2. Go to **Settings → Email Accounts**
3. Click **"Edit"** on your IMAP account
4. **Verify** all settings are correct
5. Click **"Test Connection"** (just ONCE!)
6. If successful, click **"Update Account"**

---

## 🔧 **Why This Happened:**

Looking at the code, there are **multiple sync processes** running:

1. **AutoSyncStarter** - Starts sync on page load
2. **Background sync** - Runs every 30 seconds
3. **Manual sync** - When you click "Sync Now"
4. **Your testing** - Multiple test connections

With **wrong credentials**, each attempt:

- ❌ Fails authentication
- 🔄 Retry logic kicks in
- ⏰ Happens every few seconds
- 💥 = 500+ attempts in 10 minutes

---

## 🚫 **What NOT To Do:**

- ❌ **Don't restart the server yet** - wait 10 minutes first
- ❌ **Don't test connection multiple times** - once is enough
- ❌ **Don't use your regular password** - must be app password
- ❌ **Don't skip the waiting period** - Fastmail will block you for longer

---

## ⏰ **Timeline:**

1. **Now**: Stop the server (Ctrl+C)
2. **Wait 10 minutes**: Get your app password ready
3. **After 10 min**: Update password in Supabase
4. **Then**: Restart server
5. **Finally**: Test connection ONCE

---

## 📝 **Checklist Before Restarting:**

- [ ] Stopped the dev server
- [ ] Waited 10 minutes
- [ ] Got real Fastmail app password
- [ ] Updated password in Supabase
- [ ] Set status to 'inactive' in database
- [ ] Ready to restart carefully

---

## 🎯 **Summary:**

**Current Status**: 🔴 **RATE LIMITED - DO NOT START SERVER**

**What to do**:

1. Stop server NOW
2. Wait 10 minutes
3. Get real app password
4. Update in Supabase
5. Restart carefully

**Time needed**: ~15 minutes total

---

Sorry about this! The aggressive retry logic combined with wrong credentials created a perfect storm. Once you update the password, it'll work perfectly! 🚀


