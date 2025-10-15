# 🔧 Azure App Registration Fix for Microsoft Email Connection

## 🎯 The Problem

Your Nylas configuration is **perfect** ✅, but Microsoft OAuth is failing because your **Azure App Registration** (Client ID: `7f146ebf-ed50-4714-a9d2-0b2d3200dc63`) needs proper configuration.

---

## ✅ Required Fix (5 Minutes)

### Step 1: Open Your Azure App

1. Go to: https://portal.azure.com
2. Search for **"App registrations"**
3. Find your app with Client ID: **7f146ebf-ed50-4714-a9d2-0b2d3200dc63**

> **Don't have access?** You may need to create a NEW Azure app - see "Plan B" below.

---

### Step 2: Fix Redirect URIs (CRITICAL)

1. Click on your app
2. Go to **Authentication** (left sidebar)
3. Under **Platform configurations** → **Web**, add these EXACT redirect URIs:

```
https://api.us.nylas.com/v3/connect/callback
http://localhost:3000/api/nylas/oauth/exchange
```

4. Scroll down to **Supported account types**, select:
   - ✅ **"Accounts in any organizational directory and personal Microsoft accounts"**
5. Click **Save**

---

### Step 3: Add Required API Permissions

1. Click **API permissions** (left sidebar)
2. Click **+ Add a permission**
3. Select **Microsoft Graph** → **Delegated permissions**
4. Search and add these permissions:

   **Required:**
   - ✅ `Mail.ReadWrite`
   - ✅ `Mail.Send`
   - ✅ `Calendars.ReadWrite`
   - ✅ `Contacts.ReadWrite`
   - ✅ `offline_access`
   - ✅ `User.Read`

5. Click **Add permissions**
6. **CRITICAL**: Click **"Grant admin consent for [Your Organization]"**
   - This button is at the top of the permissions list
   - You need admin rights to click it
   - If you can't click it, ask your IT admin OR use a personal Microsoft account

---

### Step 4: Verify Client Secret

1. Click **Certificates & secrets** (left sidebar)
2. Under **Client secrets**, check if you have an active secret
3. If expired or missing:
   - Click **+ New client secret**
   - Description: "Nylas Email Client"
   - Expires: 24 months
   - Click **Add**
   - **IMPORTANT**: Copy the **VALUE** (not the Secret ID!)

4. Go to **Nylas Dashboard**:
   - https://dashboard.nylas.com
   - Applications → Your App → Connectors → Microsoft
   - Update **Client Secret** with the VALUE you just copied
   - Save

---

### Step 5: Test Connection

1. **Restart your dev server**:

   ```powershell
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. Open: http://localhost:3000/dashboard/settings

3. Click **Email Accounts** → **Connect Email Account** → **Microsoft**

4. You should see Microsoft OAuth login screen

5. Sign in and grant permissions

---

## 🔍 If Still Not Working...

### Check A: Account Type

**For Personal Accounts** (Outlook.com, Hotmail, Live):

- ✅ Should work with OAuth if Azure app is configured correctly
- ✅ For IMAP, need to generate app password: https://account.microsoft.com/security

**For Work/School Accounts** (Microsoft 365):

- ❌ Admin may have blocked OAuth apps
- ❌ IMAP may be disabled by admin
- ✅ Ask IT admin to whitelist your app or enable IMAP

### Check B: Redirect URI Exact Match

The redirect URI in Azure **MUST EXACTLY MATCH** what Nylas expects:

```
https://api.us.nylas.com/v3/connect/callback
```

**Common mistakes:**

- ❌ `https://api.us.nylas.com/v3/connect/callback/` (trailing slash)
- ❌ `https://api.nylas.com/v3/connect/callback` (missing `.us`)
- ❌ `https://api.eu.nylas.com/v3/connect/callback` (wrong region)

### Check C: Permissions Granted

After adding API permissions, you MUST click **"Grant admin consent"**. Look for green checkmarks in the "Status" column:

✅ = Granted
⚠️ = Not granted (click "Grant admin consent")

---

## 🆘 Plan B: Create New Azure App

If you don't have access to the existing app, create a new one:

### 1. Create New App Registration

1. Go to: https://portal.azure.com
2. **Azure Active Directory** → **App registrations** → **+ New registration**

3. Fill in:
   - **Name**: Imbox Email Client
   - **Supported account types**: Accounts in any organizational directory and personal Microsoft accounts (Multitenant)
   - **Redirect URI**: Web → `https://api.us.nylas.com/v3/connect/callback`

4. Click **Register**

5. **Copy** the following (you'll need them):
   - Application (client) ID
   - Directory (tenant) ID

### 2. Create Client Secret

1. In your new app, go to **Certificates & secrets**
2. **+ New client secret**
3. Description: "Nylas Integration"
4. Expires: 24 months
5. Click **Add**
6. **COPY THE VALUE** immediately (you can't see it again!)

### 3. Add API Permissions

1. Go to **API permissions**
2. **+ Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Add:
   - Mail.ReadWrite
   - Mail.Send
   - Calendars.ReadWrite
   - Contacts.ReadWrite
   - offline_access
   - User.Read
4. Click **Add permissions**
5. Click **Grant admin consent for [Your Organization]**

### 4. Update Nylas Dashboard

1. Go to: https://dashboard.nylas.com
2. **Applications** → Your App → **Connectors** → **Microsoft**
3. Click **Edit** or **Configure**
4. Update:
   - **Client ID**: Your new Application (client) ID
   - **Client Secret**: The VALUE you copied
   - **Tenant**: `common` (or your specific tenant ID)
5. **Save**

### 5. Test Again

Restart dev server and try connecting Microsoft account again.

---

## 🎓 Understanding the Error

When you see **"Forbidden"** or **"Access Denied"**:

1. **OAuth fails** → Azure app permissions issue
2. **IMAP fails** → Account doesn't have IMAP enabled or needs app password

The fact that **both fail** means:

- OAuth: Azure app config wrong
- IMAP: Account needs app password (personal) or admin enable (work)

---

## ✅ Success Checklist

Before trying to connect again, verify:

- [ ] Azure app has EXACT redirect URI: `https://api.us.nylas.com/v3/connect/callback`
- [ ] Azure app has all 6 required Microsoft Graph permissions
- [ ] Admin consent granted (green checkmarks in Status column)
- [ ] Client secret is valid and not expired
- [ ] Client secret VALUE (not ID) is in Nylas Dashboard
- [ ] Nylas Dashboard Microsoft connector shows your Client ID
- [ ] Dev server restarted after any changes
- [ ] Testing with personal Microsoft account (easier than work account)

---

## 🚀 Quick Test

To verify Azure app is working:

1. Open: https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=https://api.us.nylas.com/v3/connect/callback&scope=Mail.ReadWrite%20offline_access

   Replace `YOUR_CLIENT_ID` with: `7f146ebf-ed50-4714-a9d2-0b2d3200dc63`

2. You should see Microsoft login screen
3. If you see error → Azure app not configured correctly
4. If you see login → Azure app is good, issue is in app code or Nylas

---

## 📞 Need Help?

1. **Can't access Azure Portal?**
   - Create a new personal Azure account (free)
   - Create new app registration (Plan B above)

2. **Work/School account not working?**
   - Ask IT admin to enable OAuth apps
   - Or use a personal Microsoft account for testing

3. **Still getting errors?**
   - Check browser console for specific error messages
   - Check dev server terminal for Nylas API errors
   - Share error messages for more specific help

---

**Next**: After fixing Azure app, try connecting again!
