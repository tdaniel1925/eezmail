# Vercel Environment Variables Setup

## Quick Start: Use Vercel Dashboard (Recommended)

### Step 1: Go to Vercel Dashboard

Visit: **https://vercel.com/bot-makers/win-email_client/settings/environment-variables**

### Step 2: Add Each Variable

Click **"Add New"** and enter these variables one by one.

For each variable, select **all three environments**:

- ✅ Production
- ✅ Preview
- ✅ Development

---

## Required Variables

### 📦 Database (REQUIRED)

```
DATABASE_URL
```

Value: Your Supabase Postgres connection string from **Supabase → Project Settings → Database → Connection String (URI)**

---

### 🔐 Supabase Auth (REQUIRED)

```
NEXT_PUBLIC_SUPABASE_URL
```

Value: `https://your-project-id.supabase.co`

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Value: Your anon/public key from **Supabase → Project Settings → API**

```
SUPABASE_SERVICE_ROLE_KEY
```

Value: Your service_role key from **Supabase → Project Settings → API** (keep secret!)

---

### 📧 Microsoft OAuth (REQUIRED for Microsoft accounts)

```
MICROSOFT_CLIENT_ID
```

Value: From **Azure Portal → App Registrations → Your App → Application (client) ID**

```
MICROSOFT_CLIENT_SECRET
```

Value: From **Azure Portal → App Registrations → Your App → Certificates & secrets**

```
MICROSOFT_TENANT_ID
```

Value: `common` (for multi-tenant support)

---

### 📬 Google OAuth (REQUIRED for Gmail)

```
GOOGLE_CLIENT_ID
```

Value: From **Google Cloud Console → APIs & Services → Credentials** (ends with `.apps.googleusercontent.com`)

```
GOOGLE_CLIENT_SECRET
```

Value: From **Google Cloud Console → APIs & Services → Credentials**

---

### 🤖 OpenAI (Optional - for AI features)

```
OPENAI_API_KEY
```

Value: `sk-...` from **OpenAI Platform → API Keys**

---

### 🌐 App URL (Auto-set by Vercel, but you can override)

```
NEXT_PUBLIC_APP_URL
```

Value: `https://win-emailclient-bot-makers.vercel.app` (or your custom domain)

---

## Step 3: Deploy

After adding all variables, run:

```bash
vercel --prod
```

---

## Alternative: Use .env.local Values

If you have a working `.env.local` file, you can pull values from it:

### On Windows (PowerShell):

```powershell
# Copy your .env.local values to Vercel manually via dashboard
# OR use the Vercel UI to import from .env.local file
```

### On macOS/Linux:

```bash
# Install vercel CLI env helper
vercel env pull .env.vercel.local
```

---

## Troubleshooting

### Build fails with "Missing environment variable"

- Make sure you selected **all three environments** (Production, Preview, Development) when adding each variable
- Redeploy after adding variables: `vercel --prod --force`

### OAuth redirects not working after deployment

- Update redirect URIs in Microsoft Azure and Google Cloud Console
- Microsoft: `https://your-app.vercel.app/api/auth/microsoft/callback`
- Google: `https://your-app.vercel.app/api/auth/google/callback`

### Database connection errors

- Verify `DATABASE_URL` is correct
- Use Supabase **Transaction** pooler mode for Vercel
- Check IP allowlist in Supabase (allow all or add Vercel IPs)

---

## Verification

After deployment, check:

1. Visit your deployed app
2. Try to sign up/log in
3. Connect an email account
4. Verify sync works

---

## Security Notes

⚠️ **Never commit these values to Git!**

- All secrets should only exist in Vercel dashboard
- `.env.local` is in `.gitignore`
- Service role key is especially sensitive

---

## Next Steps After Deployment

1. Test the deployed app thoroughly
2. Update OAuth redirect URIs with production URL
3. Run database migrations on production Supabase
4. Monitor logs in Vercel dashboard
5. Set up custom domain (optional)

---

_Last updated: October 15, 2025_
