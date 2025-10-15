# ⚡ Quick Fix Checklist - Microsoft OAuth Not Connecting

## 🔍 Diagnosis Complete

✅ **Nylas API**: Connected  
✅ **Nylas Providers**: Microsoft configured  
✅ **Environment Variables**: All set  
❌ **Azure App**: Needs configuration fixes

**Your Azure App Client ID**: `7f146ebf-ed50-4714-a9d2-0b2d3200dc63`

---

## 🎯 3-Minute Fix

### 1. Go to Azure Portal

```
https://portal.azure.com
→ Search "App registrations"
→ Find app: 7f146ebf-ed50-4714-a9d2-0b2d3200dc63
```

### 2. Fix Authentication

```
→ Click "Authentication"
→ Add redirect URI: https://api.us.nylas.com/v3/connect/callback
→ Save
```

### 3. Add API Permissions

```
→ Click "API permissions"
→ Add permission → Microsoft Graph → Delegated
→ Add these 6 permissions:
   ✓ Mail.ReadWrite
   ✓ Mail.Send
   ✓ Calendars.ReadWrite
   ✓ Contacts.ReadWrite
   ✓ offline_access
   ✓ User.Read
→ Click "Grant admin consent for..."
→ Wait for green checkmarks
```

### 4. Check Client Secret

```
→ Click "Certificates & secrets"
→ If no active secret or expired:
   → New client secret → Copy VALUE
   → Go to https://dashboard.nylas.com
   → Update Microsoft connector with new secret
```

### 5. Test

```
→ Restart dev server (Ctrl+C then npm run dev)
→ Go to http://localhost:3000/dashboard/settings
→ Try connecting Microsoft account
```

---

## 🆘 Can't Access That Azure App?

**Option A**: Ask the person who created it to give you access

**Option B**: Create your own (5 minutes):

```
1. Azure Portal → App registrations → New registration
2. Name: "Imbox Email Client"
3. Account types: "Multitenant + Personal accounts"
4. Redirect URI: https://api.us.nylas.com/v3/connect/callback
5. Copy Client ID and create Client Secret
6. Add the 6 API permissions above
7. Update Nylas Dashboard with new credentials
```

See `AZURE_APP_FIX.md` for detailed steps.

---

## 🔍 Test if Azure App is Valid

Open this URL in browser (replace YOUR_CLIENT_ID):

```
https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=7f146ebf-ed50-4714-a9d2-0b2d3200dc63&response_type=code&redirect_uri=https://api.us.nylas.com/v3/connect/callback&scope=Mail.ReadWrite%20offline_access
```

✅ **See Microsoft login?** → Azure app is working  
❌ **See error?** → Azure app needs fixes above

---

## 📋 Most Common Mistakes

1. ❌ Redirect URI has trailing slash: `...callback/` (wrong)
2. ❌ Forgot to click "Grant admin consent" after adding permissions
3. ❌ Client secret expired
4. ❌ Client secret VALUE not updated in Nylas Dashboard
5. ❌ Testing with work account that has admin restrictions

**Tip**: Test with a personal Outlook.com account first!

---

## 🎯 After You Fix Azure

You should be able to:

1. Click "Connect Email Account" → "Microsoft"
2. See Microsoft OAuth login screen
3. Grant permissions
4. Successfully connect account ✅

---

**Need more details?** See:

- `AZURE_APP_FIX.md` - Complete Azure setup guide
- `MICROSOFT_CONNECTION_TROUBLESHOOTING.md` - Full troubleshooting guide
