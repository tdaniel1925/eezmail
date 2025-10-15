# 🔧 Nylas IMAP Setup Guide

## Overview

Instead of using OAuth (which has Microsoft permission issues), you can connect via **IMAP** - a direct connection to your email server.

## ✅ Benefits of IMAP

- ✅ No OAuth permission issues
- ✅ Works with any email provider
- ✅ More reliable for Microsoft accounts
- ✅ No need to configure Microsoft Graph API scopes
- ✅ Direct access to mailbox

## 📋 What You Need

### For Microsoft/Outlook Accounts

**IMAP Settings:**

- **Server**: `outlook.office365.com`
- **Port**: `993`
- **Security**: SSL/TLS
- **Username**: Your full email address (e.g., tdaniel@bundlefly.com)
- **Password**: App password (see below)

**SMTP Settings (for sending):**

- **Server**: `smtp.office365.com`
- **Port**: `587`
- **Security**: STARTTLS
- **Username**: Your full email address
- **Password**: Same app password

### For Gmail Accounts

**IMAP Settings:**

- **Server**: `imap.gmail.com`
- **Port**: `993`
- **Security**: SSL/TLS
- **Username**: Your Gmail address
- **Password**: App password (see below)

**SMTP Settings:**

- **Server**: `smtp.gmail.com`
- **Port**: `587`
- **Security**: STARTTLS
- **Username**: Your Gmail address
- **Password**: Same app password

---

## 🔐 Step 1: Generate App Password

### For Microsoft Accounts

1. Go to https://account.microsoft.com/security
2. Sign in with your Microsoft account
3. Click **Advanced security options**
4. Scroll down to **App passwords**
5. Click **Create a new app password**
6. Copy the generated password (you won't see it again!)
7. Save it somewhere safe

**Note**: If you don't see "App passwords", you may need to:

- Enable 2-factor authentication first
- Contact your IT admin (for work accounts)

### For Gmail Accounts

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Click **2-Step Verification**
4. Scroll down to **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Enter "Imbox Email Client"
7. Click **Generate**
8. Copy the 16-character password
9. Save it somewhere safe

---

## 🚀 Step 2: Configure Nylas for IMAP

### Option A: Nylas Dashboard (Recommended)

1. **Log in to Nylas Dashboard**
   - Go to https://dashboard.nylas.com
   - Sign in to your account

2. **Enable IMAP Connector**
   - Go to **Connectors** → **IMAP**
   - Click **Enable IMAP**
   - Toggle it **ON**

3. **Configure Settings**
   - **Allow custom IMAP servers**: ✅ Enabled
   - **Allow insecure connections**: ❌ Disabled (keep secure)
   - **Supported providers**: Add Microsoft, Gmail, Yahoo, etc.

4. **Save Configuration**

### Option B: Via Nylas API (Advanced)

You can also create IMAP grants directly via API:

```bash
curl -X POST "https://api.us.nylas.com/v3/connect/grants" \
  -H "Authorization: Bearer YOUR_NYLAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "imap",
    "settings": {
      "imap_host": "outlook.office365.com",
      "imap_port": 993,
      "imap_username": "tdaniel@bundlefly.com",
      "imap_password": "YOUR_APP_PASSWORD",
      "smtp_host": "smtp.office365.com",
      "smtp_port": 587,
      "smtp_username": "tdaniel@bundlefly.com",
      "smtp_password": "YOUR_APP_PASSWORD"
    },
    "scope": ["email", "calendar", "contacts"]
  }'
```

---

## 🔧 Step 3: Update Application Code

### Option A: Add IMAP Connection UI (Simple)

I can add a new "Connect via IMAP" option to your settings page that asks for:

1. Email address
2. App password
3. Provider selection (Microsoft/Gmail/Other)

### Option B: Use Nylas Hosted Auth (Easier)

Nylas can handle the IMAP authentication UI for you:

1. Update your OAuth URL generation to support IMAP
2. Nylas shows IMAP credential form
3. User enters email + app password
4. Nylas creates the grant

---

## 📝 Step 4: Test Connection

### For Microsoft/Outlook

```bash
# Test IMAP connection
openssl s_client -connect outlook.office365.com:993

# Login
a1 LOGIN tdaniel@bundlefly.com YOUR_APP_PASSWORD

# List folders
a2 LIST "" "*"

# Select inbox
a3 SELECT INBOX

# Logout
a4 LOGOUT
```

### For Gmail

```bash
# Test IMAP connection
openssl s_client -connect imap.gmail.com:993

# Login
a1 LOGIN your.email@gmail.com YOUR_APP_PASSWORD

# List folders
a2 LIST "" "*"

# Select inbox
a3 SELECT INBOX

# Logout
a4 LOGOUT
```

---

## 🔄 Step 5: Implementation Options

### Option 1: Nylas Hosted Auth (Easiest) ⭐ RECOMMENDED

**Pros:**

- No code changes needed
- Nylas handles IMAP credential UI
- Secure password handling
- Works immediately

**Implementation:**
Just enable IMAP in Nylas Dashboard. When user clicks "Connect Account", Nylas will show:

- OAuth option (for Google)
- IMAP option (for Microsoft, others)

### Option 2: Custom IMAP Form (More Control)

**Pros:**

- Full UI control
- Custom branding
- Better UX integration

**Cons:**

- Requires code changes
- Need to handle credentials securely

**Implementation:**
I can build a form in your settings page:

```
┌─────────────────────────────────────┐
│ Connect Email Account via IMAP      │
├─────────────────────────────────────┤
│ Email Address:                      │
│ [tdaniel@bundlefly.com         ]    │
│                                      │
│ Provider:                            │
│ ( ) Microsoft/Outlook ✓             │
│ ( ) Gmail                            │
│ ( ) Other                            │
│                                      │
│ App Password:                        │
│ [••••••••••••••••••            ]    │
│                                      │
│ [Cancel] [Connect via IMAP]         │
└─────────────────────────────────────┘
```

---

## ⚡ Quick Start (Choose Your Method)

### Method A: Use Nylas Hosted Auth (5 minutes)

1. ✅ Enable IMAP in Nylas Dashboard
2. ✅ Generate Microsoft app password
3. ✅ Click "Connect Account" in your app
4. ✅ Choose "IMAP" option
5. ✅ Enter email + app password
6. ✅ Emails sync immediately!

### Method B: Custom IMAP Form (20 minutes)

1. ✅ Generate Microsoft app password
2. ✅ I build custom IMAP form in settings
3. ✅ User enters credentials
4. ✅ App creates Nylas grant via API
5. ✅ Emails sync!

---

## 🔒 Security Best Practices

1. **Never store passwords in plain text**
   - Nylas handles this for you
   - App passwords are encrypted

2. **Use app passwords, not account passwords**
   - Limits access scope
   - Can be revoked independently

3. **Enable 2FA on email account**
   - Required for app passwords
   - Better security

4. **Rotate app passwords periodically**
   - Good security practice
   - Generate new ones every 90 days

---

## 🆚 OAuth vs IMAP Comparison

| Feature              | OAuth                   | IMAP                           |
| -------------------- | ----------------------- | ------------------------------ |
| **Setup Complexity** | Complex                 | Simple                         |
| **Microsoft Issues** | Yes (403 errors)        | No                             |
| **Permissions**      | Granular                | Full mailbox access            |
| **Token Expiry**     | Yes (needs refresh)     | No                             |
| **Works Offline**    | No                      | No                             |
| **Security**         | Very secure             | Secure (with app password)     |
| **User Experience**  | Click & authorize       | Enter credentials              |
| **Recommended For**  | Gmail, Google Workspace | Microsoft, Outlook, Office 365 |

---

## 🎯 My Recommendation

For your Microsoft account (tdaniel@bundlefly.com), use **IMAP with Nylas Hosted Auth**:

1. ✅ **Quickest solution** (5 minutes)
2. ✅ **No code changes** needed
3. ✅ **Bypasses OAuth issues** completely
4. ✅ **Nylas handles security**
5. ✅ **Works immediately**

---

## 📞 Need Help?

### Generate App Password Now

**Microsoft**: https://account.microsoft.com/security → App passwords
**Gmail**: https://myaccount.google.com/apppasswords

### Enable IMAP in Nylas

1. Go to https://dashboard.nylas.com
2. Connectors → IMAP → Enable
3. Done!

### Test Your IMAP Credentials

```bash
# Windows (PowerShell)
Test-NetConnection -ComputerName outlook.office365.com -Port 993

# macOS/Linux
telnet outlook.office365.com 993
```

---

## 🚀 Ready to Implement?

**Choose one:**

**A) Quick Fix (Recommended)**

- Enable IMAP in Nylas Dashboard now
- Generate Microsoft app password
- Try connecting again
- Should work in 5 minutes!

**B) Custom Implementation**

- I'll build a custom IMAP form
- Better UX, more control
- Takes 20 minutes to implement

**Which would you prefer?**
