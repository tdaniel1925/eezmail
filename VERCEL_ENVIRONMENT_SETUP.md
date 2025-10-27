# Vercel Environment Variables Setup Guide

## 🚨 Current Issue

**Error**: `getaddrinfo ENOTFOUND db.hfduyqvdajtvnsldqmro.supabase.co`

This means:

- Vercel CAN'T reach your Supabase database
- The `DATABASE_URL` environment variable is set but incorrect
- OR the Supabase project `hfduyqvdajtvnsldqmro` doesn't exist/was deleted

---

## ✅ Solution: Update Vercel Environment Variables

### Step 1: Get Your Correct Supabase Credentials

1. **Go to** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Select your project** (or create a new one if needed)
3. **Click** "Settings" → "Database"
4. **Find** the "Connection string" section
5. **Copy** the "Connection pooling" URL (starts with `postgresql://postgres...`)
6. **Note**: Replace `[YOUR-PASSWORD]` with your actual database password

Example format:

```
postgresql://postgres.hfduyqvdajtvnsldqmro:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Step 2: Get Your Supabase API Credentials

While in Supabase Dashboard:

1. **Go to** "Settings" → "API"
2. **Copy** the following:
   - **Project URL**: `https://hfduyqvdajtvnsldqmro.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Update Vercel Environment Variables

1. **Go to** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Select** your project (eezmail)
3. **Click** "Settings" → "Environment Variables"
4. **Update** or **Add** these variables for **ALL environments** (Production, Preview, Development):

#### Required Database & Auth Variables:

```env
# Supabase Database (Direct Connection - for Drizzle)
DATABASE_URL=postgresql://postgres.YOUR_REF:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase API URLs
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

# Supabase API Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App URL
NEXT_PUBLIC_APP_URL=https://easemail.app
```

#### Payment Processors (if using):

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Square (if using)
SQUARE_ACCESS_TOKEN=...
SQUARE_ENVIRONMENT=production
```

#### Email & AI (if using):

```env
# Resend (for sending emails)
RESEND_API_KEY=re_...

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...

# Twilio (for SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Step 4: Redeploy

After updating environment variables:

1. **Go to** "Deployments" tab in Vercel
2. **Click** the "..." menu on the latest deployment
3. **Select** "Redeploy"
4. **Check** "Use existing Build Cache" (optional)
5. **Click** "Redeploy"

---

## 🔍 Verify Environment Variables

After deployment, you can verify env vars are working:

1. **Check** the deployment logs for any `⚠️ DATABASE_URL not set` warnings
2. **Try logging in** - if you get a different error, env vars are loading
3. **Check** the Vercel Function logs for connection errors

---

## 🚨 Common Issues

### Issue: "relation does not exist" errors

**Solution**: Run migrations in Supabase SQL Editor:

- `drizzle/0010_auth_overhaul.sql`
- `drizzle/0012_onboarding_resume.sql`
- `drizzle/0013_simplify_categories.sql`

### Issue: "column does not exist" errors

**Solution**: Same as above - migrations not run

### Issue: Still can't connect after updating

**Checklist**:

- ✅ Password in `DATABASE_URL` is correct (no special chars that need encoding)
- ✅ Using the **pooler** connection string (port 6543), not direct (port 5432)
- ✅ Environment variables are set for **Production** environment
- ✅ Redeployed after changing env vars

---

## 📝 Quick Reference: Where to Find What

| What You Need              | Where to Find It                                         |
| -------------------------- | -------------------------------------------------------- |
| Database Connection String | Supabase → Settings → Database → Connection string       |
| Project URL                | Supabase → Settings → API → Configuration                |
| Anon Key                   | Supabase → Settings → API → Project API keys             |
| Service Role Key           | Supabase → Settings → API → Project API keys             |
| Vercel Env Vars            | Vercel → Your Project → Settings → Environment Variables |

---

## ✅ Test Checklist

After setup:

- [ ] Can access the login page
- [ ] Can sign up with email/password
- [ ] Can sign in with Google OAuth
- [ ] Can sign in with Microsoft OAuth
- [ ] Can sign in with username (if migrations run)
- [ ] Dashboard loads without errors
- [ ] Email accounts can be connected

---

**Need Help?** Check the Vercel deployment logs for specific error messages.
