# 🚀 GitHub Actions Setup - Step by Step

Follow these steps EXACTLY to enable fully automated deployments.

---

## Step 1: Get Your Vercel Tokens (2 minutes)

Open a terminal and run:

```bash
# Login to Vercel
vercel login

# Create a deployment token
vercel token create

# Copy the token that appears - you'll need it!
```

Now get your project IDs:

```bash
# Get organization ID
vercel org ls
# Copy your organization ID

# Get project ID
vercel project ls
# Copy your project ID
```

**Write these down:**

- `VERCEL_TOKEN`: (the token you just created)
- `VERCEL_ORG_ID`: (your org ID)
- `VERCEL_PROJECT_ID`: (your project ID)

---

## Step 2: Add GitHub Secrets (3 minutes)

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

Add these secrets ONE BY ONE:

### Vercel Secrets:

```
Name: VERCEL_TOKEN
Value: <paste-your-vercel-token>

Name: VERCEL_ORG_ID
Value: <paste-your-org-id>

Name: VERCEL_PROJECT_ID
Value: <paste-your-project-id>
```

### Database & Supabase Secrets:

```
Name: DATABASE_URL
Value: <copy from your .env.local>

Name: NEXT_PUBLIC_SUPABASE_URL
Value: <copy from your .env.local>

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: <copy from your .env.local>

Name: SUPABASE_SERVICE_ROLE_KEY
Value: <copy from your .env.local>
```

### OAuth Secrets:

```
Name: MICROSOFT_CLIENT_ID
Value: <copy from your .env.local>

Name: MICROSOFT_CLIENT_SECRET
Value: <copy from your .env.local>

Name: GOOGLE_CLIENT_ID
Value: <copy from your .env.local>

Name: GOOGLE_CLIENT_SECRET
Value: <copy from your .env.local>
```

### App URL:

```
Name: NEXT_PUBLIC_APP_URL
Value: https://easemail.app
(or your production URL)
```

---

## Step 3: Commit and Push (1 minute)

The workflow file is already created at `.github/workflows/deploy.yml`.

Just commit and push:

```bash
# Commit the workflow
git add .github/workflows/deploy.yml
git commit -m "Add automated CI/CD pipeline"
git push origin main
```

---

## Step 4: Verify It Works (2 minutes)

1. Go to your GitHub repo
2. Click **Actions** tab
3. You should see a workflow running!
4. Click on it to watch the progress

Expected output:

```
✅ Validate Deployment
   ├─ Checkout code
   ├─ Setup Node.js
   ├─ Install dependencies
   ├─ TypeScript type check
   ├─ Run linter
   ├─ Validate deployment readiness
   └─ Run integration tests

✅ Deploy to Production
   ├─ Install Vercel CLI
   ├─ Build Project
   ├─ Deploy to Production
   └─ Health check
```

---

## Step 5: Test It! (1 minute)

Make a small change and push:

```bash
# Make a small change (or just an empty commit)
git commit --allow-empty -m "Test automated deployment"
git push origin main

# Watch the magic happen in GitHub Actions!
```

---

## ✅ Success Checklist

You'll know it's working when:

- [ ] GitHub Actions runs automatically on push
- [ ] All validation checks pass (green checkmarks)
- [ ] Vercel deployment succeeds
- [ ] Health check returns 200 OK
- [ ] You get a notification if anything fails

---

## 🎯 What Happens Now?

### Every time you push code:

```bash
git commit -m "Your changes"
git push
```

**Automatically:**

1. ✅ Validates environment variables
2. ✅ Runs TypeScript checks
3. ✅ Runs linting
4. ✅ Validates critical code patterns
5. ✅ Builds project
6. ✅ Deploys to Vercel
7. ✅ Runs health check
8. ✅ Notifies you if anything fails

**Time:** 2-3 minutes, fully automated

---

## 🚨 Troubleshooting

### "Workflow doesn't run"

- Check that `.github/workflows/deploy.yml` exists
- Make sure you pushed to `main` branch
- Check GitHub Actions is enabled in repo settings

### "Vercel deployment fails"

- Verify VERCEL_TOKEN is correct
- Check VERCEL_ORG_ID matches your organization
- Ensure VERCEL_PROJECT_ID is correct

### "Validation fails"

- Check all environment variables are set in GitHub Secrets
- Run `node validate-deployment.js` locally to see what's missing

### "Health check fails"

- Wait a bit longer (deployment might still be rolling out)
- Check your production URL is correct in NEXT_PUBLIC_APP_URL

---

## 📊 What You Get

### Before:

```
You: npm run type-check
You: npm run lint
You: npm run pre-deploy
You: git push
You: vercel --prod
You: check logs
You: verify deployment
Total: 30 minutes
```

### After:

```
You: git push
GitHub Actions: Does everything above automatically
Total: 0 minutes (of your time)
```

---

## 🎉 You're Done!

**Congratulations!** Your email sync system now has:

- ✅ **Automated validation** before deployment
- ✅ **Automated deployment** to production
- ✅ **Automated health checks** after deployment
- ✅ **Automated client onboarding** (already working)
- ✅ **Automated email sync** (already working)
- ✅ **100% scalable** - handle unlimited clients

**You can now focus on building features while everything else runs automatically!**

---

## 🚀 Next Steps (Optional)

### Add Monitoring

1. Set up UptimeRobot: https://uptimerobot.com
2. Monitor: `https://easemail.app/api/health/detailed`
3. Get alerted if site goes down

### Add Error Tracking

```bash
npm install @sentry/nextjs
```

### Add Slack Notifications

Update `.github/workflows/deploy.yml` to notify your Slack channel on deployments.

---

**Need help?** Check the GitHub Actions tab for detailed logs.
