# OAuth Redirect Fix - Production Environment

## 🔴 Problem

After adding a Microsoft email account on the live site, the system redirects to `localhost:3000` instead of staying on the production domain.

## ✅ Solution Implemented

The code has been updated to dynamically determine the redirect URI based on the current request instead of relying on environment variables.

### Changes Made:

1. **`src/app/api/auth/microsoft/callback/route.ts`** (Lines 73-86)
   - Now reads `x-forwarded-proto` and `host` headers to build the redirect URI dynamically
   - Works correctly in both development and production

2. **`src/lib/settings/email-actions.ts`** (Lines 65-78, 109-121)
   - Falls back to `VERCEL_URL` environment variable when `NEXT_PUBLIC_APP_URL` is not set
   - Added logging to help debug redirect URI issues

---

## 🚀 Additional Steps Required

### Step 1: Set Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables

**Add or verify:**

```bash
# Primary app URL (recommended)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

> **Note:** `VERCEL_URL` is automatically set by Vercel, but setting `NEXT_PUBLIC_APP_URL` explicitly is recommended for clarity.

---

### Step 2: Update Azure App Registration Redirect URIs

The redirect URI must be registered in Azure for OAuth to work:

1. Go to: https://portal.azure.com
2. Navigate to **App registrations**
3. Find your app (Client ID: `7f146ebf-ed50-4714-a9d2-0b2d3200dc63` or your custom one)
4. Click **Authentication** in the left sidebar
5. Under **Platform configurations** → **Web**, add these redirect URIs:

```
https://your-domain.vercel.app/api/auth/microsoft/callback
http://localhost:3000/api/auth/microsoft/callback
```

6. Click **Save**

> **CRITICAL:** The redirect URI in Azure must **exactly match** what your app sends, including:
>
> - Protocol (`https://` vs `http://`)
> - Domain
> - Path
> - No trailing slash

---

### Step 3: Update Google Cloud Console (if using Gmail)

If you're also using Google OAuth for Gmail:

1. Go to: https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:

```
https://your-domain.vercel.app/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

5. Click **Save**

---

## 🧪 Testing

After making these changes:

1. **Redeploy your Vercel app** (or wait for automatic deployment)
2. Go to your live site: `https://your-domain.vercel.app`
3. Navigate to **Dashboard** → **Settings** → **Email Accounts**
4. Click **Connect Email Account** → **Microsoft**
5. Complete the OAuth flow
6. Verify you're redirected back to your live site (not localhost)

---

## 🔍 Debugging

If you still see localhost redirects, check the server logs in Vercel:

1. Go to Vercel dashboard → Your project → **Deployments**
2. Click the latest deployment
3. Click **Functions** tab
4. Look for logs from `/api/auth/microsoft/callback`
5. Check the line that says: `🔗 Using redirect URI: https://...`

This will show you what redirect URI the system is actually using.

---

## 📝 How It Works Now

### Before (Problem):

```typescript
redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/...`;
//            ↑ If not set, defaults to localhost
```

### After (Fixed):

```typescript
// In callback handler:
const protocol = request.headers.get('x-forwarded-proto') || 'http';
const host = request.headers.get('host') || 'localhost:3000';
const currentUrl = `${protocol}://${host}`;
redirectUri: `${currentUrl}/api/auth/microsoft/callback`;
// ↑ Dynamically uses the current request URL

// In initiation:
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000');
redirectUri: `${appUrl}/api/auth/microsoft/callback`;
// ↑ Falls back to Vercel's automatic VERCEL_URL variable
```

---

## ✅ Checklist

- [x] Code updated to use dynamic redirect URIs
- [ ] `NEXT_PUBLIC_APP_URL` set in Vercel environment variables
- [ ] Azure App redirect URIs updated with production domain
- [ ] Google Cloud Console redirect URIs updated (if using Gmail)
- [ ] Vercel app redeployed
- [ ] Tested OAuth flow on live site

---

## 🆘 Still Not Working?

If you're still seeing localhost redirects:

1. **Check Vercel Environment Variables:**

   ```bash
   # In Vercel dashboard, verify:
   NEXT_PUBLIC_APP_URL=https://your-actual-domain.vercel.app
   ```

2. **Verify Azure Redirect URIs:**
   - Must include `https://your-actual-domain.vercel.app/api/auth/microsoft/callback`
   - No typos, no trailing slash
   - Protocol must be `https://` for production

3. **Clear Browser Cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or use incognito mode

4. **Check Server Logs:**
   - Look for the line: `🔗 Using redirect URI: ...`
   - This shows what URI the system is actually using

---

**Once complete, your OAuth flow will stay on your live site! 🎉**
