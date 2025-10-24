# Quick Start Guide - Inngest Email Sync

## 🚀 Get Started in 3 Minutes

### 1. Run Database Migration

Open Supabase SQL Editor and run:

```sql
ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS initial_sync_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE email_accounts
ADD COLUMN IF NOT EXISTS gmail_history_id TEXT;
```

### 2. Start Inngest Dev Server (New Terminal)

```bash
npx inngest-cli@latest dev
```

Dashboard opens at: **http://localhost:8288**

### 3. Start Your App

```bash
npm run dev
```

### 4. Test It

Visit: http://localhost:3000/api/test-inngest

✅ Should see success message
✅ Check dashboard: http://localhost:8288 for test function

## 📧 Sync Your Emails

### Method 1: Connect New Account (Automatic)

1. Go to **Settings → Email Accounts**
2. Click **"Add Microsoft Account"**
3. Complete OAuth
4. ✅ Sync starts automatically!

### Method 2: Manual Sync (API)

```bash
curl -X POST http://localhost:3000/api/email/sync \
  -H "Content-Type: application/json" \
  -d '{"accountId":"YOUR_ID","syncType":"manual"}'
```

### Method 3: Check Sync Status

```bash
curl http://localhost:3000/api/email/sync?accountId=YOUR_ID
```

## 📊 Monitor Progress

Dashboard: **http://localhost:8288**

- **Runs Tab** - See all syncs
- **Click on a run** - View step-by-step progress
- **Real-time updates** - Watch folders sync

## ✅ Verify It Works

- [ ] Test function shows 3 steps in dashboard
- [ ] Connect Microsoft account → redirects to inbox
- [ ] Dashboard shows sync running
- [ ] All emails appear in inbox (not just 219)
- [ ] Folder counts match Outlook
- [ ] Database: `initial_sync_completed = true`

## 🐛 Troubleshooting

**Dashboard shows "No Functions"?**

1. Restart Inngest: `npx inngest-cli@latest dev`
2. Visit: http://localhost:3000/api/inngest
3. Refresh dashboard

**Sync not triggering?**

1. Check dashboard "Events" tab
2. Check "Runs" tab for errors
3. Check terminal logs

## 📖 Full Documentation

- **Setup Guide:** `INNGEST_SETUP_GUIDE.md`
- **Phase 1 Summary:** `INNGEST_PHASE_1_COMPLETE.md`
- **Implementation Details:** `PHASE_1_IMPLEMENTATION_COMPLETE.md`

## 🎯 What's Fixed

1. ✅ Delta sync pagination (syncs ALL emails now)
2. ✅ Completion tracking (prevents premature delta sync)
3. ✅ Folder counts (accurate from API)
4. ✅ Performance (duplicate detection optimized)
5. ✅ Auto-sync (triggers on connection)
6. ✅ Visibility (Inngest dashboard)
7. ✅ Error recovery (auto-retry)

## 🚀 Next Steps

**Phase 2:** Gmail sync with History API (2-3 hours)

---

**Questions?** Check `INNGEST_SETUP_GUIDE.md` for detailed documentation.
