# OAuth Setup with Custom Domain

## ✅ Using Your Custom Domain: easemail.app

Your custom domain is the **best choice** for OAuth redirect URIs because it stays the same across all deployments.

---

## 🚀 Step 1: Update Vercel Environment Variable

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_APP_URL` (or create it if it doesn't exist)
5. Set the value to:

```
https://easemail.app
```

6. Make sure it's enabled for:
   - ✅ Production
   - ✅ Preview (optional)
   - ✅ Development (optional)

7. Click **Save**

---

## 🔧 Step 2: Update Azure App Registration

1. Go to: https://portal.azure.com
2. Search for **"App registrations"**
3. Find your app: **Client ID: `bdd42bf0-0516-4fb7-b83d-a064ef0b80f5`**
4. Click **Authentication** in the left sidebar
5. Under **Platform configurations** → **Web** → **Redirect URIs**
6. Add these URIs:

```
https://easemail.app/api/auth/microsoft/callback
http://localhost:3000/api/auth/microsoft/callback
```

7. **Remove or keep the old one** (your choice):
   - `https://win-emailclient-yy0op6536-bot-makers.vercel.app/api/auth/microsoft/callback`

8. Click **Save** at the bottom

---

## 🌐 Step 3: Update Google Cloud Console (if using Gmail)

If you're also connecting Gmail accounts:

1. Go to: https://console.cloud.google.com
2. Navigate to **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:

```
https://easemail.app/api/auth/google/callback
http://localhost:3000/api/auth/google/callback
```

5. Click **Save**

---

## 🔄 Step 4: Redeploy

After updating the environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click the **three dots** (...) on the latest deployment
3. Select **Redeploy**
4. Or just wait for the next automatic deployment when you push code

---

## 🧪 Step 5: Test

Once redeployed:

1. Visit: https://easemail.app
2. Log in and go to **Dashboard** → **Settings** → **Email Accounts**
3. Click **Connect Email Account** → **Microsoft**
4. Complete the OAuth flow
5. ✅ You should stay on `https://easemail.app` throughout!

---

## ✅ Final Configuration Summary

**Vercel Environment Variables:**

```bash
NEXT_PUBLIC_APP_URL=https://easemail.app
```

**Azure App Redirect URIs:**

- ✅ `https://easemail.app/api/auth/microsoft/callback`
- ✅ `http://localhost:3000/api/auth/microsoft/callback`

**Google Cloud Redirect URIs (if applicable):**

- ✅ `https://easemail.app/api/auth/google/callback`
- ✅ `http://localhost:3000/api/auth/google/callback`

---

## 🎯 Why This Is Better

Using your custom domain (`easemail.app`) instead of the Vercel deployment URL:

✅ **Stays consistent** across all deployments
✅ **No need to update** Azure/Google after each deploy
✅ **Professional** - users see your domain, not Vercel's
✅ **Easier to remember** and configure

---

## 🔍 Verifying Your Domain

To confirm your domain is connected to Vercel:

1. Vercel Dashboard → Your Project → **Settings** → **Domains**
2. You should see `easemail.app` listed
3. Make sure it shows as "Production" domain

If it's not connected yet, you'll need to:

1. Add the domain in Vercel
2. Update your DNS records
3. Wait for DNS propagation

---

**Let me know once you've updated Vercel and Azure, and we can test it!** 🚀
