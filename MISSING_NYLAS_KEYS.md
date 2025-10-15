# ⚠️ Missing Nylas API Keys

## The Problem

When you try to add an email account, you're getting a 404 error because the Nylas OAuth configuration is incomplete.

## Required Environment Variables

You need these 3 variables in your `.env.local` file:

### ✅ Already Set:

- `NEXT_PUBLIC_NYLAS_CLIENT_ID` - ✓ Found in your .env.local
- `NEXT_PUBLIC_APP_URL` - ✓ Found in your .env.local

### ❌ Missing:

- `NYLAS_API_KEY` - **Missing** (Required)
- `NYLAS_API_URI` - **Missing** (Required)
- `NYLAS_CLIENT_SECRET` - **Missing** (Required for token exchange)

---

## How to Get These Values

### 1. Go to Nylas Dashboard

Visit: https://dashboard.nylas.com

### 2. Get Your API Key

1. In the dashboard, go to **API Keys** or **Application Settings**
2. Copy your **API Key** (starts with `nylas_...`)
3. This is your `NYLAS_API_KEY`

### 3. Get Your API URI

- For US region: `https://api.us.nylas.com`
- For EU region: `https://api.eu.nylas.com`
- Check your Nylas dashboard to see which region you're in

### 4. Get Your Client Secret

1. In the dashboard, go to **App Settings** or **OAuth Settings**
2. Find your **Client Secret** (different from Client ID)
3. This is your `NYLAS_CLIENT_SECRET`

---

## Add to .env.local

Add these lines to your `.env.local` file:

```env
# Nylas Configuration (Add these)
NYLAS_API_KEY=nylas_YOUR_API_KEY_HERE
NYLAS_API_URI=https://api.us.nylas.com
NYLAS_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
```

**Keep the existing lines:**

```env
NEXT_PUBLIC_NYLAS_CLIENT_ID=YOUR_CLIENT_ID_HERE (already set)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (already set)
```

---

## After Adding Keys

1. **Restart the dev server**
2. **Refresh your browser**
3. **Try adding an email account again**

---

## What Will Happen

### Before (Current):

- Click "Add Account" → 404 error
- OAuth URL cannot be generated

### After (With All Keys):

- Click "Add Account" → Redirected to Google/Microsoft login
- Complete OAuth flow
- Account connected successfully ✅

---

## Still Having Issues?

If you still get errors after adding all the keys:

1. **Check the Nylas Dashboard Callback URL:**
   - Go to Nylas Dashboard → OAuth Settings
   - Add callback URL: `http://localhost:3000/api/nylas/callback`
   - For production: `https://yourdomain.com/api/nylas/callback`

2. **Check that keys are correct:**
   - No extra spaces
   - No quotes around values
   - API Key starts with `nylas_`

3. **Restart the server:**

   ```bash
   # Kill the server
   Stop-Process -Name node -Force

   # Start again
   npm run dev
   ```

---

## Why Are These Keys Needed?

- **`NYLAS_API_KEY`**: Authenticates your app with Nylas API
- **`NYLAS_API_URI`**: Tells the SDK which region to connect to
- **`NYLAS_CLIENT_SECRET`**: Used to exchange OAuth codes for access tokens
- **`NEXT_PUBLIC_NYLAS_CLIENT_ID`**: Your app's public identifier (already set)

Without these, the Nylas SDK cannot initialize or generate OAuth URLs.

---

**Once you add these keys, the 404 error will be resolved! 🎉**
