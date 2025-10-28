# 🚀 Automated Secret Upload - 2 Minutes!

## Step 1: Login to GitHub CLI (30 seconds)

Run this command and follow the prompts:

```powershell
gh auth login
```

Choose:

- Account: **GitHub.com**
- Protocol: **HTTPS**
- Authenticate: **Login with a web browser** (easiest)
- Copy the code, press Enter, paste in browser, authorize

## Step 2: Get Vercel Info (1 minute)

### Get Vercel Token:

1. Go to: https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: `github-actions`
4. Copy the token

### Get Project ID:

1. Go to: https://vercel.com/bot-makers/win-email_client/settings
2. Scroll down to "Project ID"
3. Copy the ID (starts with `prj_`)

## Step 3: Run the Upload Script (30 seconds)

```powershell
node upload-secrets.js <VERCEL_TOKEN> <PROJECT_ID>
```

Replace:

- `<VERCEL_TOKEN>` with your token
- `<PROJECT_ID>` with your project ID

Example:

```powershell
node upload-secrets.js vercel_abc123xyz prj_def456ghi
```

## Step 4: Push to GitHub!

```bash
git add .
git commit -m "Add GitHub Actions CI/CD"
git push origin main
```

Then watch your first automated deployment at:
**https://github.com/your-username/win-email_client/actions**

---

## ✅ What the Script Does

- Reads all secrets from your `.env.local`
- Adds Vercel token and IDs
- Uploads all 12 secrets to GitHub automatically
- Shows you which ones succeeded

**Total time: 2 minutes instead of 15!** ⚡

---

## 🆘 If You Get Stuck

Run each step separately:

1. `gh auth login` first
2. Get token and project ID
3. Run `node upload-secrets.js <token> <id>`

The script will tell you if anything is missing!
