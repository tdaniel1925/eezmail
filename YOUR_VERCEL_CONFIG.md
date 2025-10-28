# ✅ Your Vercel Configuration for GitHub Actions

## Information I Found:

### 1. Organization ID

```
VERCEL_ORG_ID = bot-makers
```

### 2. Project Name

```
win-email_client
```

---

## 🔑 Get Your Vercel Token & Project ID

The Vercel CLI is having issues, so let's get the token from the dashboard:

### Step 1: Get Vercel Token (2 minutes)

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name it: `github-actions-automation`
4. Scope: **Full Account**
5. Click **"Create"**
6. **COPY THE TOKEN** (you'll only see it once!)

### Step 2: Get Project ID (1 minute)

1. Go to: https://vercel.com/bot-makers/win-email_client/settings
2. Scroll down to **"Project ID"**
3. **COPY THE PROJECT ID**

---

## 📝 Your GitHub Secrets Checklist

Once you have the token and project ID, add these to GitHub:

**GitHub Repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Vercel Secrets (3):

```
Name: VERCEL_TOKEN
Value: <paste-token-from-step-1>

Name: VERCEL_ORG_ID
Value: bot-makers

Name: VERCEL_PROJECT_ID
Value: <paste-id-from-step-2>
```

### From Your .env.local (9):

```
Name: DATABASE_URL
Value: <copy from .env.local>

Name: NEXT_PUBLIC_SUPABASE_URL
Value: <copy from .env.local>

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: <copy from .env.local>

Name: SUPABASE_SERVICE_ROLE_KEY
Value: <copy from .env.local>

Name: MICROSOFT_CLIENT_ID
Value: <copy from .env.local>

Name: MICROSOFT_CLIENT_SECRET
Value: <copy from .env.local>

Name: GOOGLE_CLIENT_ID
Value: <copy from .env.local>

Name: GOOGLE_CLIENT_SECRET
Value: <copy from .env.local>

Name: NEXT_PUBLIC_APP_URL
Value: https://win-emailclient-bot-makers.vercel.app
```

**Total: 12 secrets**

---

## ✅ After Adding Secrets

Run:

```bash
git add .
git commit -m "Add GitHub Actions CI/CD"
git push origin main
```

Then watch your first automated deployment at:
**https://github.com/your-username/win-email_client/actions**

---

## 🎯 Quick Links

- Token: https://vercel.com/account/tokens
- Project Settings: https://vercel.com/bot-makers/win-email_client/settings
- Your GitHub: https://github.com/your-username/win-email_client

---

**Once you've added the secrets, let me know and I'll help you test it!** 🚀
