# 🔧 SMTP Authentication Error - Fix Guide

**Error**: `535 5.7.0 Incorrect username, password or access token`

**Cause**: Your IMAP account's SMTP credentials in the database are incorrect or missing.

---

## 🎯 **How to Fix:**

### **Option 1: Update via Settings UI (RECOMMENDED)**

1. **Go to Settings → Email Accounts**
2. **Click the blue "Edit" button** on your IMAP account
3. **Update the SMTP settings:**
   - **SMTP Username**: `tdaniel@botmakers.ai` (your full email)
   - **SMTP Password**: Your **Fastmail app password** (NOT your regular password)
4. **Test Connection** (to verify it works)
5. **Save**

---

### **Option 2: Update via SQL (Direct)**

Run this SQL in your database (replace `YOUR_APP_PASSWORD` with your actual Fastmail app password):

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

---

## 🔑 **Important Notes:**

### **1. Use App Password, NOT Regular Password**

Fastmail requires an **app-specific password** for SMTP:

**How to get it:**

1. Log in to Fastmail
2. Go to **Settings → Password & Security**
3. Click **"App Passwords"**
4. Create a new app password for "Email Client"
5. **Copy that password** and use it for SMTP

### **2. Verify Settings Are Correct**

Your SMTP settings should be:

- **Host**: `smtp.fastmail.com`
- **Port**: `465`
- **SSL**: Enabled (true)
- **Username**: `tdaniel@botmakers.ai` (full email address)
- **Password**: Your Fastmail app password

---

## 🧪 **Test After Updating:**

1. **Update the credentials** using one of the methods above
2. **Try sending an email** from the composer
3. **Watch the terminal** for success:
   ```
   📧 Sending email via SMTP: smtp.fastmail.com:465
   ✅ Email sent successfully!
   ```

---

## ❓ **Still Getting Errors?**

### **Error: "SMTP authentication failed"**

→ Wrong password. Make sure you're using the **app password**, not your regular Fastmail password.

### **Error: "Connection refused"**

→ Wrong port. Use `465` for SSL/TLS or `587` for STARTTLS.

### **Error: "Server not found"**

→ Wrong host. Use `smtp.fastmail.com` (not `imap.fastmail.com`).

---

## 🚀 **Quick Fix Steps:**

1. Get your Fastmail app password
2. Go to Settings → Email Accounts → Click "Edit"
3. Update SMTP password field
4. Test connection
5. Save
6. Try sending an email

Let me know if you need help getting your Fastmail app password! 🔑


