# 🚀 Aurinko Integration Setup Guide

## Overview

This guide will help you set up Aurinko for IMAP email accounts. We're using a **hybrid approach**:

- ✅ Gmail & Microsoft: Use existing direct integrations (they work great!)
- 🆕 IMAP/Other: Use Aurinko (easier, more reliable)

---

## Step 1: Create Aurinko Account

1. Go to [https://aurinko.io](https://aurinko.io)
2. Click "Sign Up" or "Get Started"
3. Create an account (use your work email)
4. Verify your email

---

## Step 2: Create an Application

1. Log into Aurinko Dashboard
2. Go to **"Applications"** or **"Apps"**
3. Click **"Create New Application"**
4. Fill in details:
   - **Name:** "Imbox AI Email Client"
   - **Description:** "AI-powered email management"
   - **Redirect URIs:**
     - `http://localhost:3000/api/auth/aurinko/callback` (development)
     - `https://yourdomain.com/api/auth/aurinko/callback` (production)

5. **Enable these providers:**
   - ✅ IMAP/SMTP (primary use case)
   - ✅ Gmail (backup/testing)
   - ✅ Microsoft 365 (backup/testing)
   - ✅ Yahoo Mail (optional)
   - ✅ iCloud (optional)

6. **Enable these scopes:**
   - ✅ `Mail.Read` - Read emails
   - ✅ `Mail.ReadWrite` - Modify emails (mark as read, move, etc.)
   - ✅ `Mail.Send` - Send emails
   - ✅ `Mail.Folders` - Access folders

7. Click **"Create"** or **"Save"**

---

## Step 3: Get API Credentials

After creating your app, you'll see:

```
Client ID: app_xxxxxxxxxxxxxxxxx
Client Secret: sec_xxxxxxxxxxxxxxxxxxxxxxxxxx
App ID: xxxxxxxxxx
```

**Save these securely!** You'll need them for `.env.local`

---

## Step 4: Configure Environment Variables

1. Open your `.env.local` file (create if doesn't exist)
2. Add these variables:

```bash
# Aurinko API Credentials
AURINKO_CLIENT_ID=app_your_client_id_here
AURINKO_CLIENT_SECRET=sec_your_secret_here
NEXT_PUBLIC_AURINKO_APP_ID=your_app_id_here

# Redirect URI (must match what you set in Aurinko dashboard)
AURINKO_REDIRECT_URI=http://localhost:3000/api/auth/aurinko/callback

# For production, also set:
# AURINKO_REDIRECT_URI=https://yourdomain.com/api/auth/aurinko/callback
```

3. Restart your development server:

```bash
npm run dev
```

---

## Step 5: Setup Webhooks (Optional but Recommended)

Webhooks enable real-time email sync when new emails arrive.

1. In Aurinko Dashboard, go to **"Webhooks"**
2. Click **"Add Webhook"**
3. Configure:
   - **URL:** `https://yourdomain.com/api/webhooks/aurinko`
   - **Events:**
     - ✅ `message.received`
     - ✅ `message.updated`
     - ✅ `message.deleted`
   - **Secret:** Generate a random secret (save it!)

4. Add to `.env.local`:

```bash
AURINKO_WEBHOOK_SECRET=your_webhook_secret_here
```

**Note:** For local development, use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
# Use the ngrok URL for webhook: https://xxxxx.ngrok.io/api/webhooks/aurinko
```

---

## Step 6: Database Migration

Run this SQL to add Aurinko fields to your database:

```sql
-- Add Aurinko fields to email_accounts table
ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS aurinko_account_id TEXT,
  ADD COLUMN IF NOT EXISTS aurinko_access_token TEXT,
  ADD COLUMN IF NOT EXISTS aurinko_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS aurinko_provider TEXT,
  ADD COLUMN IF NOT EXISTS use_aurinko BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aurinko_token_expires_at TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_accounts_aurinko_id
  ON email_accounts(aurinko_account_id);
```

**Using Drizzle?** Run:

```bash
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

---

## Step 7: Test the Integration

### **Option A: Use the UI**

1. Start your development server:

```bash
npm run dev
```

2. Open `http://localhost:3000/dashboard/settings`

3. Click **"Connect IMAP Account"** (or similar button we'll add)

4. You'll be redirected to Aurinko OAuth

5. Choose **"IMAP/SMTP"** provider

6. Enter your email credentials:
   - **Email:** your@email.com
   - **IMAP Server:** imap.yourdomain.com
   - **IMAP Port:** 993
   - **SMTP Server:** smtp.yourdomain.com
   - **SMTP Port:** 465 or 587
   - **Username:** your@email.com
   - **Password:** your_password_or_app_password

7. Click **"Connect"**

8. You should be redirected back to your app with the account connected!

---

### **Option B: Use the Test Endpoint**

```bash
# Test Aurinko API connection
curl http://localhost:3000/api/test-aurinko
```

Should return:

```json
{
  "success": true,
  "message": "Aurinko is configured correctly"
}
```

---

## Step 8: Verify Sync is Working

1. After connecting an IMAP account, check the console logs:

```
🔵 Syncing via Aurinko for account: acc_xxxxx
✅ Synced 47 emails from Aurinko
```

2. Check your inbox - emails should appear!

3. Check the database:

```sql
SELECT COUNT(*) FROM emails WHERE account_id IN (
  SELECT id FROM email_accounts WHERE use_aurinko = true
);
```

---

## Troubleshooting

### **Issue: "Invalid client_id"**

- Double-check `AURINKO_CLIENT_ID` in `.env.local`
- Make sure it starts with `app_`
- Restart your dev server after changing `.env.local`

### **Issue: "Redirect URI mismatch"**

- Verify `AURINKO_REDIRECT_URI` matches exactly what's in Aurinko dashboard
- Check for trailing slashes (shouldn't have one)
- Use `http://localhost:3000` not `http://127.0.0.1:3000`

### **Issue: "No emails syncing"**

- Check console for errors
- Visit `http://localhost:3000/api/test-aurinko/sync?accountId=xxx`
- Check IMAP credentials are correct
- Some email providers require "app passwords" (Gmail, Yahoo, etc.)

### **Issue: "Invalid IMAP credentials"**

- Gmail users: Enable "Less secure app access" or use App Password
- Microsoft users: May need to enable IMAP in settings
- Check username is the full email address
- Some servers need SSL/TLS settings adjusted

---

## Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` already
2. **Use App Passwords** - Don't use your actual email password
3. **Rotate secrets regularly** - Change Aurinko webhook secret periodically
4. **Monitor API usage** - Check Aurinko dashboard for suspicious activity
5. **Set up alerts** - Get notified if sync fails

---

## Cost Considerations

Aurinko pricing (as of 2024):

- **Free Tier:** 2 accounts, great for testing
- **Starter:** $29/month - 50 accounts
- **Growth:** $99/month - 500 accounts
- **Enterprise:** Custom pricing

**Recommendation:** Start with free tier for testing, upgrade based on IMAP user count.

---

## Next Steps

Once Aurinko is working for IMAP:

1. ✅ Test thoroughly with your IMAP account
2. ✅ Add more IMAP users gradually
3. ✅ Monitor performance and reliability
4. ✅ Compare to your existing Gmail/Microsoft sync
5. 🤔 Decide if you want to migrate Gmail/Microsoft to Aurinko too

---

## Support

- **Aurinko Docs:** [https://docs.aurinko.io](https://docs.aurinko.io)
- **Aurinko Support:** support@aurinko.io
- **Our Implementation:** See files in `src/lib/aurinko/`

---

## Quick Reference

**Key Files:**

- OAuth: `src/app/api/auth/aurinko/`
- Sync: `src/lib/aurinko/sync-service.ts`
- Webhooks: `src/app/api/webhooks/aurinko/route.ts`
- Sending: `src/lib/aurinko/send-email.ts`

**Useful Commands:**

```bash
# Test connection
curl http://localhost:3000/api/test-aurinko

# Trigger manual sync
curl -X POST http://localhost:3000/api/aurinko/sync \
  -H "Content-Type: application/json" \
  -d '{"accountId":"acc_xxxxx"}'

# Check account status
curl http://localhost:3000/api/aurinko/status?accountId=acc_xxxxx
```

---

_Setup guide created for Imbox AI Email Client - Aurinko IMAP Integration_
