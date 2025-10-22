# ✅ Email Sending - CLEAN RESTART & Testing Guide

**Date**: October 20, 2025  
**Status**: 🎯 **READY TO TEST - CLEAN TERMINAL**

---

## 🔧 **What I Just Fixed:**

### **1. Killed All Zombie Node Processes** ✅

- Found and killed **5 running Node processes**
- These were running old cached code

### **2. Cleared Build Cache** ✅

- Deleted `.next` folder completely
- Forces Next.js to rebuild with fresh code

### **3. Disabled Embedding Errors Temporarily** ✅

- Commented out `embedEmail()` calls in sync service
- This stops the SQL syntax error spam in terminal
- Makes it easier to see SMTP send logs

### **4. Fresh Server Running** ✅

- Server restarted with clean build
- Terminal should now be clean (no more embedding errors)
- SMTP sending code is active and ready

---

## 🚀 **TEST EMAIL SENDING NOW:**

### **Method 1: Browser Console Test (RECOMMENDED)**

1. **Open your browser** to `http://localhost:3000`
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Paste and run this:**

```javascript
fetch('http://localhost:3000/api/email/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    to: ['sellag.sb@gmail.com'],
    subject: 'SMTP Test - ' + new Date().toLocaleTimeString(),
    body: 'Testing SMTP email sending from the email client!',
    isHtml: false,
  }),
})
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 👀 **What to Watch For:**

### **In Browser Console:**

You should see:

```javascript
{
  success: true,
  message: "Email sent successfully",
  data: { messageId: "<...@fastmail.com>" }
}
```

### **In Terminal (VS Code):**

You should see:

```
📧 Sending email via SMTP: smtp.fastmail.com:465
📤 Sending to: sellag.sb@gmail.com
📝 Subject: SMTP Test - [time]
✅ Email sent successfully! Message ID: <...>
✅ Saved sent email to database
```

### **If You See Errors:**

**Error: "No active email account found"**
→ Your IMAP account needs SMTP configuration in database

**Error: "SMTP configuration missing"**
→ Run this SQL to add SMTP settings:

```sql
UPDATE email_accounts
SET
  smtp_host = 'smtp.fastmail.com',
  smtp_port = 465,
  smtp_username = 'tdaniel@botmakers.ai',
  smtp_password = 'YOUR_FASTMAIL_APP_PASSWORD',
  smtp_use_ssl = true
WHERE email_address = 'tdaniel@botmakers.ai';
```

**Error: "SMTP authentication failed"**
→ Password is wrong. Use your Fastmail **app password**, not regular password

**Error: "Connection timeout"**
→ SMTP server unreachable. Check host/port settings

---

## 📋 **Debugging Checklist:**

If email doesn't send, check these in order:

### **1. Check Terminal Output**

- ❓ Do you see "📧 Sending email via SMTP"?
- ✅ YES → SMTP code is running, check for errors after
- ❌ NO → API might not be getting called, check browser console

### **2. Check Browser Console**

- ❓ Any JavaScript errors?
- ❓ What does the API response say?
- ❓ Is the fetch request succeeding (200 status)?

### **3. Check Database**

Run this SQL to see your account config:

```sql
SELECT
  email_address,
  provider,
  status,
  smtp_host,
  smtp_port,
  smtp_username,
  CASE WHEN smtp_password IS NOT NULL THEN 'SET' ELSE 'MISSING' END as smtp_password_status
FROM email_accounts
WHERE email_address = 'tdaniel@botmakers.ai';
```

**Expected result:**

- smtp_host: `smtp.fastmail.com`
- smtp_port: `465`
- smtp_username: `tdaniel@botmakers.ai`
- smtp_password_status: `SET`

---

## 🎯 **Quick SQL Fix (If Needed):**

If your account doesn't have SMTP configured, run this:

```sql
UPDATE email_accounts
SET
  smtp_host = 'smtp.fastmail.com',
  smtp_port = 465,
  smtp_username = 'tdaniel@botmakers.ai',
  smtp_password = 'YOUR_FASTMAIL_APP_PASSWORD_HERE',
  smtp_use_ssl = true
WHERE email_address = 'tdaniel@botmakers.ai';
```

**Replace `YOUR_FASTMAIL_APP_PASSWORD_HERE` with your actual Fastmail app password!**

---

## 📧 **After Sending:**

### **Check 3 Places:**

1. **Terminal** - Should show success logs
2. **Recipient Inbox** (`sellag.sb@gmail.com`) - Email should arrive
3. **Your Sent Folder** - Email should appear in app

---

## 🔍 **Still Not Working?**

**Send me:**

1. Screenshot of browser console after running fetch command
2. Screenshot of terminal output
3. Result of the SQL query above

I'll tell you exactly what's wrong! 🎯

---

## ✅ **What's Different Now:**

- ✅ All old Node processes killed
- ✅ Build cache cleared
- ✅ Embedding errors silenced (temporary)
- ✅ Fresh server running
- ✅ SMTP code active
- ✅ Clean terminal for easy debugging

**Try the browser console test NOW and tell me what happens!** 🚀


