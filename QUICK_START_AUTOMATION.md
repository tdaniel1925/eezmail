# ⚡ Quick Start - 5 Minutes to Full Automation

## What You'll Get

✅ Push code → Auto-validates → Auto-deploys → Done  
✅ Client signs up → Auto-onboards → Auto-syncs → Done  
✅ Zero manual work required

---

## Setup (One Time - 5 Minutes)

### 1. Get Vercel Info (1 min)

```bash
vercel login
vercel token create    # Copy this token!
vercel org ls         # Copy your org ID
vercel project ls     # Copy your project ID
```

### 2. Add to GitHub Secrets (2 min)

Go to: **GitHub Repo** → **Settings** → **Secrets** → **Actions** → **New secret**

Add these 12 secrets:

```
VERCEL_TOKEN=<from step 1>
VERCEL_ORG_ID=<from step 1>
VERCEL_PROJECT_ID=<from step 1>

DATABASE_URL=<from .env.local>
NEXT_PUBLIC_SUPABASE_URL=<from .env.local>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from .env.local>
SUPABASE_SERVICE_ROLE_KEY=<from .env.local>

MICROSOFT_CLIENT_ID=<from .env.local>
MICROSOFT_CLIENT_SECRET=<from .env.local>
GOOGLE_CLIENT_ID=<from .env.local>
GOOGLE_CLIENT_SECRET=<from .env.local>

NEXT_PUBLIC_APP_URL=https://easemail.app
```

### 3. Push to GitHub (1 min)

```bash
git add .github/workflows/deploy.yml
git commit -m "Add CI/CD automation"
git push origin main
```

### 4. Watch It Work! (1 min)

Go to: **GitHub Repo** → **Actions** tab

Watch your first automated deployment! 🎉

---

## Usage (Forever After)

### To Deploy New Features:

```bash
git commit -m "Add cool feature"
git push
```

**That's it!** Everything else is automatic:

- ✅ Validates code
- ✅ Runs tests
- ✅ Deploys to Vercel
- ✅ Health check
- ✅ Notifies you

### When Clients Sign Up:

**Do nothing!** It's all automatic:

- ✅ Account created
- ✅ Payment processed
- ✅ Email connected
- ✅ Sync started
- ✅ Folders loaded
- ✅ Emails synced

---

## Verify It Works

```bash
# Make a test commit
git commit --allow-empty -m "Test automation"
git push

# Watch in GitHub Actions tab
# Should see: ✅ All checks passed → ✅ Deployed
```

---

## Result

**Before:** 30 min per deployment + 15 min per client = Can't scale  
**After:** 0 min per deployment + 0 min per client = Infinite scale

**You're done!** 🚀

---

## Need Help?

**Detailed guides:**

- [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md) - Full setup guide
- [AUTOMATION_SETUP.md](./AUTOMATION_SETUP.md) - Automation overview
- [AUTOMATED_VS_MANUAL.md](./AUTOMATED_VS_MANUAL.md) - Before/after comparison

**Common issues:**

- Workflow not running? Check it's on `main` branch
- Deployment failing? Verify all 12 secrets are set
- Health check failing? Wait 30 more seconds

---

**Your system is now 100% automated. Focus on building, not deploying!** ✨
