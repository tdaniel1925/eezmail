# 🔍 Microsoft Email Connection Troubleshooting Guide

## Current Issue

Microsoft email accounts are failing to connect via **both OAuth and IMAP**, indicating a configuration-level issue.

---

## 🎯 Root Cause Analysis

Since **neither OAuth nor IMAP** is working, the issue is likely:

1. ❌ **Nylas Application Configuration** - Microsoft provider not properly set up
2. ❌ **Azure App Registration** - Incorrect redirect URIs or permissions
3. ❌ **Environment Variables** - Missing or incorrect Nylas credentials
4. ❌ **Microsoft Tenant Settings** - Admin consent required but not granted

---

## ✅ Step-by-Step Fix

### Step 1: Verify Nylas Environment Variables

Check your `.env.local` file has these set correctly:

```bash
NYLAS_CLIENT_ID=your_nylas_client_id
NYLAS_API_KEY=your_nylas_api_key
NYLAS_API_URI=https://api.us.nylas.com  # or .eu.nylas.com depending on your region
```

**Action**: Run this command to verify:

```powershell
Get-Content .env.local | Select-String "NYLAS"
```

---

### Step 2: Check Nylas Dashboard Configuration

Go to: **https://dashboard.nylas.com**

#### A. Application Settings

1. Navigate to **Applications** → Your App
2. Check **Callback URI** is set to:
   ```
   http://localhost:3000/api/nylas/oauth/exchange
   https://your-production-domain.com/api/nylas/oauth/exchange
   ```

#### B. Microsoft Provider Configuration

**CRITICAL**: Ensure Microsoft provider is enabled with correct scopes

1. Go to **Applications** → **Integrations** → **Microsoft**
2. Click **Configure** or **Edit**
3. Ensure these settings:

**OAuth Method (Recommended)**:

- ✅ **Client ID**: Your Azure App Client ID
- ✅ **Client Secret**: Your Azure App Client Secret
- ✅ **Tenant ID**: `common` (for multi-tenant) or your specific tenant ID
- ✅ **Scopes Required**:
  - `Mail.ReadWrite`
  - `Mail.Send`
  - `Calendars.ReadWrite`
  - `Contacts.ReadWrite`
  - `offline_access`
  - `User.Read`

**IMAP Method (Alternative)**:

- ✅ **IMAP Host**: `outlook.office365.com`
- ✅ **IMAP Port**: `993`
- ✅ **SSL**: Enabled
- ✅ **SMTP Host**: `smtp.office365.com`
- ✅ **SMTP Port**: `587`

---

### Step 3: Verify Azure App Registration

Go to: **https://portal.azure.com** → **Azure Active Directory** → **App registrations**

#### Required Settings:

1. **Redirect URIs** (under Authentication):

   ```
   https://api.us.nylas.com/v3/connect/callback
   http://localhost:3000/api/nylas/oauth/exchange
   https://your-production-domain.com/api/nylas/oauth/exchange
   ```

2. **API Permissions** (under API permissions):
   - Microsoft Graph → Delegated permissions:
     - ✅ `Mail.ReadWrite`
     - ✅ `Mail.Send`
     - ✅ `Calendars.ReadWrite`
     - ✅ `Contacts.ReadWrite`
     - ✅ `offline_access`
     - ✅ `User.Read`
   - ✅ **Grant admin consent** (if in organization tenant)

3. **Client Secret**:
   - Ensure you have a valid, non-expired client secret
   - Copy the **Value** (not the Secret ID)

4. **Supported Account Types**:
   - For personal accounts: "Accounts in any organizational directory and personal Microsoft accounts"
   - For work accounts: "Accounts in this organizational directory only"

---

### Step 4: Check Microsoft Account Settings

#### For Personal Microsoft Accounts (Outlook.com, Hotmail, Live):

1. Go to: **https://account.microsoft.com/security**
2. Navigate to **Advanced security options** → **App passwords**
3. Generate a new app password for "Nylas" or "Email Client"
4. Use this app password (not your regular password) for IMAP

#### For Work/School Accounts (Microsoft 365):

1. Ask your **IT Admin** to enable:
   - ✅ IMAP access (Exchange Online settings)
   - ✅ OAuth app permissions
   - ✅ Admin consent for your Azure app
2. Verify IMAP is enabled for your mailbox:
   ```
   Settings → Mail → POP and IMAP → Enable IMAP
   ```

---

### Step 5: Test Connection Method

#### Option A: Test OAuth Connection

1. In Nylas Dashboard, go to **Integrations** → **Microsoft**
2. Click **Test Connection**
3. Complete the OAuth flow
4. Check for errors in the Nylas logs

#### Option B: Test IMAP Directly

Use this PowerShell script to test IMAP:

```powershell
# Test IMAP connection to Microsoft
$server = "outlook.office365.com"
$port = 993
$email = "your-email@outlook.com"
$password = "your-app-password"  # Use app password if enabled

# Test connection
Test-NetConnection -ComputerName $server -Port $port

# If successful, try connecting with openssl (if installed)
# openssl s_client -connect outlook.office365.com:993 -crlf
```

---

## 🔧 Common Issues & Fixes

### Issue 1: "Forbidden" or "Access Denied"

**Cause**: Missing OAuth scopes or admin consent

**Fix**:

1. Go to Azure Portal → Your App → API Permissions
2. Ensure all required scopes are added
3. Click **Grant admin consent for [Your Organization]**
4. Wait 5-10 minutes for propagation
5. Try reconnecting

---

### Issue 2: "Invalid Client" or "Client ID not found"

**Cause**: Nylas doesn't have correct Azure App credentials

**Fix**:

1. In Azure Portal, copy:
   - Application (client) ID
   - Client secret VALUE (not ID)
   - Directory (tenant) ID
2. In Nylas Dashboard → Integrations → Microsoft:
   - Paste Client ID
   - Paste Client Secret
   - Set Tenant ID to "common" or your specific tenant
3. Save and test

---

### Issue 3: IMAP Authentication Failed

**Cause**: IMAP disabled or app password not generated

**Fix for Personal Accounts**:

1. Enable 2-factor authentication on Microsoft account
2. Generate app password: https://account.microsoft.com/security
3. Use app password instead of regular password

**Fix for Work Accounts**:

1. Admin must enable IMAP in Exchange Online
2. Admin must enable modern authentication
3. May require admin consent for OAuth app

---

### Issue 4: Redirect URI Mismatch

**Cause**: Callback URL not matching between Nylas and Azure

**Fix**:

1. Get correct callback from Nylas Dashboard:
   - Go to Applications → Your App → Details
   - Copy the OAuth Callback URL (should be `https://api.us.nylas.com/v3/connect/callback`)
2. Add to Azure Portal:
   - App registrations → Your App → Authentication
   - Add redirect URI: `https://api.us.nylas.com/v3/connect/callback`
   - Add redirect URI: `http://localhost:3000/api/nylas/oauth/exchange`
3. Save

---

## 🚨 Nuclear Option: Start Fresh

If nothing works, create a new setup:

### 1. Create New Azure App Registration

```bash
Name: Imbox Email Client
Supported accounts: Accounts in any organizational directory and personal Microsoft accounts
Redirect URI: https://api.us.nylas.com/v3/connect/callback
```

### 2. Configure Permissions

Add these Microsoft Graph **Delegated** permissions:

- Mail.ReadWrite
- Mail.Send
- Calendars.ReadWrite
- Contacts.ReadWrite
- offline_access
- User.Read

Click **Grant admin consent**

### 3. Create Client Secret

1. Go to Certificates & secrets
2. New client secret
3. Copy the VALUE (not Secret ID)
4. Store securely

### 4. Update Nylas Dashboard

1. Go to Integrations → Microsoft
2. Enter your NEW:
   - Client ID
   - Client Secret
   - Tenant ID: `common`
3. Save

### 5. Update Your .env.local

Ensure these are correct:

```bash
NYLAS_CLIENT_ID=your_nylas_client_id
NYLAS_API_KEY=your_nylas_api_key
NYLAS_API_URI=https://api.us.nylas.com
```

---

## 🧪 Debug Checklist

Run through this checklist:

- [ ] Nylas environment variables are set in `.env.local`
- [ ] Dev server restarted after env changes
- [ ] Nylas Dashboard has Microsoft provider configured
- [ ] Azure App has correct redirect URIs
- [ ] Azure App has all required API permissions
- [ ] Admin consent granted (if work account)
- [ ] Client secret is valid and not expired
- [ ] For IMAP: App password generated (personal accounts)
- [ ] For IMAP: IMAP enabled in Exchange Online (work accounts)
- [ ] Firewall/network not blocking ports 993, 587
- [ ] Browser console shows no CORS errors
- [ ] Nylas webhook URL is accessible (if using webhooks)

---

## 📞 Next Steps

1. **Verify Nylas API Keys**:

   ```powershell
   Get-Content .env.local | Select-String "NYLAS"
   ```

2. **Check Nylas Dashboard**:
   - Go to https://dashboard.nylas.com
   - Check Microsoft provider configuration
   - Look at recent connection attempts in logs

3. **Check Azure App**:
   - Verify redirect URIs match Nylas exactly
   - Ensure all permissions are granted
   - Check client secret hasn't expired

4. **Test with Nylas CLI** (optional):

   ```bash
   npm install -g @nylas/cli
   nylas auth
   ```

5. **Contact Nylas Support** if issue persists:
   - https://support.nylas.com
   - Provide: Application ID, Error messages, Screenshots

---

## 🎯 Most Likely Issues (Ranked)

Based on "neither OAuth nor IMAP working":

1. **80% Chance**: Microsoft provider not configured in Nylas Dashboard
2. **15% Chance**: Azure App redirect URIs don't match Nylas callback
3. **5% Chance**: Nylas API keys missing or incorrect in .env.local

**Start with Issue #1 first!**

---

## 💡 Quick Test

To verify your Nylas setup is working at all:

1. Try connecting a **Gmail** account instead
2. If Gmail works → Microsoft-specific configuration issue
3. If Gmail fails → Nylas API keys or general setup issue

---

## 📝 Logging for Debug

Add this to your OAuth exchange route to see detailed errors:

```typescript
// src/app/api/nylas/oauth/exchange/route.ts
console.log('🔍 Full Nylas error:', JSON.stringify(error, null, 2));
console.log('🔍 Error response:', error?.response?.data);
```

Then check your dev server terminal for detailed error messages.

---

**Updated**: October 14, 2025
**Status**: Troubleshooting Microsoft OAuth + IMAP connection issues
