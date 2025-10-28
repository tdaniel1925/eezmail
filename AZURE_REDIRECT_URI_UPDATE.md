# Azure Redirect URI Fix - Urgent

## 🔴 Error

```
AADSTS50011: The redirect URI 'https://win-emailclient-yy0op6536-bot-makers.vercel.app/api/auth/microsoft/callback'
specified in the request does not match the redirect URIs configured for the application
```

## ✅ Quick Fix (5 minutes)

### Step 1: Open Your Azure App

1. Go to: https://portal.azure.com
2. Search for **"App registrations"** in the top search bar
3. Find your app with **Client ID: `bdd42bf0-0516-4fb7-b83d-a064ef0b80f5`**
   - Or look for the app name you used

### Step 2: Add the Correct Redirect URI

1. Click on your app to open it
2. In the left sidebar, click **Authentication**
3. Under **Platform configurations** → **Web**
4. Look at the **Redirect URIs** section
5. Click **Add URI** (or **Add a platform** if Web isn't configured yet)
6. Add this EXACT URI (copy/paste to avoid typos):

```
https://win-emailclient-yy0op6536-bot-makers.vercel.app/api/auth/microsoft/callback
```

7. Also make sure you have localhost for development:

```
http://localhost:3000/api/auth/microsoft/callback
```

8. Click **Save** at the bottom

### Step 3: Verify Configuration

Your **Redirect URIs** section should now have at least:

- ✅ `https://win-emailclient-yy0op6536-bot-makers.vercel.app/api/auth/microsoft/callback`
- ✅ `http://localhost:3000/api/auth/microsoft/callback`

### Step 4: (Optional) Add Custom Domain

If you have a custom domain configured in Vercel, also add:

```
https://your-custom-domain.com/api/auth/microsoft/callback
```

---

## 🧪 Test Again

1. Go back to your live site: https://win-emailclient-yy0op6536-bot-makers.vercel.app
2. Dashboard → Settings → Email Accounts
3. Connect Email Account → Microsoft
4. The OAuth flow should now work! ✅

---

## 🔍 Important Notes

### Why This Happened

The redirect URI must **exactly match** what your app sends. Your Vercel deployment is at:

```
https://win-emailclient-yy0op6536-bot-makers.vercel.app
```

But Azure didn't have this specific URI registered.

### About Vercel URLs

Vercel gives you multiple URLs:

- **Deployment URL**: `win-emailclient-yy0op6536-bot-makers.vercel.app` (changes per deployment)
- **Production URL**: `win-emailclient.vercel.app` (or your custom domain - stable)

**Recommendation:**

1. If you have a production domain/custom domain, use that in `NEXT_PUBLIC_APP_URL`
2. If using the auto-generated Vercel URL, you'll need to update Azure each time you deploy

### Better Solution: Use Production Domain

**In Vercel:**

1. Go to your project → Settings → Domains
2. If you have a production domain listed (like `win-emailclient.vercel.app` without the hash)
3. Update your environment variable:
   ```
   NEXT_PUBLIC_APP_URL=https://win-emailclient.vercel.app
   ```
4. Add that production URL to Azure instead

**In Azure:**

```
https://win-emailclient.vercel.app/api/auth/microsoft/callback
```

This way, the redirect URI stays consistent across deployments.

---

## ✅ Checklist

- [ ] Opened Azure Portal
- [ ] Found app with ID `bdd42bf0-0516-4fb7-b83d-a064ef0b80f5`
- [ ] Clicked Authentication
- [ ] Added redirect URI: `https://win-emailclient-yy0op6536-bot-makers.vercel.app/api/auth/microsoft/callback`
- [ ] Clicked Save
- [ ] Tested OAuth flow again

---

## 🆘 If You Can't Find Your App

If you can't find the app with that Client ID:

1. In Azure Portal, go to **App registrations**
2. Click **All applications** tab (not just "Owned applications")
3. Search for `bdd42bf0-0516-4fb7-b83d-a064ef0b80f5`
4. If it doesn't show up, you may need to ask the app owner/admin to add the redirect URI

**Or** you can create a new Azure app registration and update your environment variables with the new credentials.

---

**This should fix the OAuth redirect issue immediately!** 🎉
