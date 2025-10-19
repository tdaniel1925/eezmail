# Quick Setup - Instant Email Webhooks

## 🚀 3-Step Setup (5 minutes)

### Step 1: Add Environment Variables

Add to `.env.local`:

```bash
WEBHOOK_URL=https://your-app.vercel.app/api/webhooks/microsoft
WEBHOOK_CLIENT_STATE=ImboxWebhookSecret2024
CRON_SECRET=your-secure-cron-secret-here
```

### Step 2: Deploy to Vercel

```bash
vercel --prod
```

Add same environment variables in Vercel Dashboard → Settings → Environment Variables

### Step 3: Set Up Cron (Optional)

Create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/renew-webhooks",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Deploy again:

```bash
vercel --prod
```

---

## ✅ That's It!

Now when users connect their Microsoft accounts:

- ✅ Webhooks automatically subscribe
- ⚡ New emails appear instantly (< 1 second)
- 🔄 Subscriptions auto-renew every 3 days

---

## 🧪 Quick Test

1. Connect a Microsoft email account
2. Send yourself a test email
3. Watch it appear in < 1 second! ⚡

---

**Need Help?** See full documentation in `WEBHOOKS_IMPLEMENTATION.md`
