# Azure Redirect URI Fix

## 🚨 **CRITICAL ISSUE**: Missing Redirect URI in Azure App

The error `Status 701: invalid_query_params` means your Azure app registration is missing the required redirect URI.

## 🎯 **IMMEDIATE FIX REQUIRED**

### Step 1: Go to Azure Portal

1. Open: https://portal.azure.com
2. **App registrations** → Find your app: `bdd42bf0-0516-4fb7-b83d-a064ef0b80f5`

### Step 2: Add Missing Redirect URI

1. Click **"Authentication"** in the left sidebar
2. Under **"Web"** section, click **"Add URI"**
3. Add this exact URI: `http://localhost:3000/api/nylas/callback`
4. Click **"Save"**

### Step 3: Verify All Required URIs

Make sure you have ALL of these redirect URIs:

- ✅ `http://localhost:3000/api/nylas/callback` (for development)
- ✅ `https://api.us.nylas.com/v3/connect/callback` (for Nylas)
- ✅ `http://localhost:3001/api/nylas/callback` (if using port 3001)

### Step 4: Check API Permissions

While you're in Azure, also verify:

1. **API permissions** → **Microsoft Graph**
2. Ensure these permissions are added and **"Grant admin consent"** is clicked:
   - `Mail.ReadWrite`
   - `Mail.Send`
   - `Calendars.ReadWrite`
   - `Contacts.ReadWrite`
   - `offline_access`
   - `User.Read`

## 🚀 **Test After Fix**

Once you add the redirect URI to Azure:

1. **Restart your development server**
2. **Try connecting Microsoft again**
3. **The error should be resolved**

## 📝 **Why This Happened**

The Azure app registration was missing the localhost redirect URI that Nylas needs for development. This is a common issue when setting up OAuth applications.

---

**After adding the redirect URI, the Microsoft connection should work!** 🎉
