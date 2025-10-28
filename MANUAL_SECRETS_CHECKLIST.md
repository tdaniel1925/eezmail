# 📝 Manual GitHub Secrets Checklist

## Step 1: Go to GitHub Secrets Page

👉 **https://github.com/tdaniel1925/eezmail/settings/secrets/actions**

Click **"New repository secret"** for each one below.

---

## Step 2: Add These 12 Secrets

Copy the **Name** and **Value** for each secret:

### ✅ Secret 1: VERCEL_TOKEN

- **Name:** `VERCEL_TOKEN`
- **Value:** `ruLOeWmgjVCv9O2oVRhyMrBLruLOeWmgjVCv9O2oVRhyMrBL`

### ✅ Secret 2: VERCEL_ORG_ID

- **Name:** `VERCEL_ORG_ID`
- **Value:** `bot-makers`

### ✅ Secret 3: VERCEL_PROJECT_ID

- **Name:** `VERCEL_PROJECT_ID`
- **Value:** `prj_seZ3HBFUXRoFcyyxIkkVIrMiVl8V`

### ✅ Secret 4: DATABASE_URL

- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres.hfduyqvdajtvnsldqmro:ttandSellaBella1234@aws-1-us-east-1.pooler.supabase.com:5432/postgres`

### ✅ Secret 5: NEXT_PUBLIC_SUPABASE_URL

- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://hfduyqvdajtvnsldqmro.supabase.co`

### ✅ Secret 6: NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZHV5cXZkYWp0dm5zbGRxbXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDAyNDgsImV4cCI6MjA3NTk3NjI0OH0.m2gOCob1Kzmlh4CQTdE2NjeRiyVALz5cxSGgpKNM14E`

### ✅ Secret 7: SUPABASE_SERVICE_ROLE_KEY

- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZHV5cXZkYWp0dm5zbGRxbXJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDQwMDI0OCwiZXhwIjoyMDc1OTc2MjQ4fQ.QyLqjIrmeE5nsFlhLtiys_2TI9bSJMzNT9iOLbSzQvY`

### ✅ Secret 8: MICROSOFT_CLIENT_ID

- **Name:** `MICROSOFT_CLIENT_ID`
- **Value:** `bdd42bf0-0516-4fb7-b83d-a064ef0b80f5`

### ✅ Secret 9: MICROSOFT_CLIENT_SECRET

- **Name:** `MICROSOFT_CLIENT_SECRET`
- **Value:** `GqG8Q~wXH7z5O3FgLJovhRf95DMltUuLPxsIEc7f`

### ✅ Secret 10: GOOGLE_CLIENT_ID

- **Name:** `GOOGLE_CLIENT_ID`
- **Value:** `198545223984-vm7fdmej9v5b85p4benn60hpi96v7qn0.apps.googleusercontent.com`

### ✅ Secret 11: GOOGLE_CLIENT_SECRET

- **Name:** `GOOGLE_CLIENT_SECRET`
- **Value:** `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`

### ✅ Secret 12: NEXT_PUBLIC_APP_URL

- **Name:** `NEXT_PUBLIC_APP_URL`
- **Value:** `https://easemail.app`

---

## Step 3: Verify All Secrets Added

Go back to: https://github.com/tdaniel1925/eezmail/settings/secrets/actions

You should see **12 secrets** listed.

---

## Step 4: Commit GitHub Actions Workflow

Once all secrets are added, commit the workflow file:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions CI/CD pipeline"
git push origin main
```

Or if you're on a different branch:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions CI/CD pipeline"
git push origin glassmorphic-redesign
```

---

## Step 5: Watch Your First Automated Deployment! 🚀

Go to: **https://github.com/tdaniel1925/eezmail/actions**

You'll see the workflow running!

---

## ⏱️ Time Estimate: 5-7 minutes

Just copy-paste each Name and Value. GitHub will save them securely.

**Tip:** Open this file and the GitHub secrets page side-by-side for easy copy-pasting!
