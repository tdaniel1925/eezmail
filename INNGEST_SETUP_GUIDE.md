# Inngest Integration - Setup Guide 🚀

## What is Inngest?

Inngest is a **durable workflow engine** that makes your email sync bulletproof by providing:

- ✅ **Automatic retries** with exponential backoff
- ✅ **Step-by-step checkpoints** - resume from ANY failure point
- ✅ **Visual debugging dashboard** - see exactly what's happening
- ✅ **No timeouts** - sync 10,000 emails without timing out
- ✅ **Event-driven** - trigger syncs from anywhere in your app

## Installation Complete ✅

Inngest has been installed and configured in your project.

### Files Created:

1. **`src/inngest/client.ts`** - Inngest client initialization
2. **`src/inngest/functions/test-sync.ts`** - Test function to verify setup
3. **`src/inngest/functions/sync-microsoft.ts`** - Microsoft sync workflow
4. **`src/app/api/inngest/route.ts`** - API endpoint for Inngest functions
5. **`src/app/api/test-inngest/route.ts`** - Test endpoint
6. **`src/app/api/email/sync/route.ts`** - Manual sync trigger endpoint

## Quick Start (First Time Setup)

### Step 1: Run the Database Migration

```bash
# Apply the migration to add new fields
psql -h [YOUR_SUPABASE_HOST] -U postgres -d postgres -f drizzle/0001_add_sync_tracking_fields.sql
```

Or run via Supabase dashboard:

1. Go to SQL Editor in Supabase
2. Paste contents of `drizzle/0001_add_sync_tracking_fields.sql`
3. Click "Run"

### Step 2: Start Inngest Dev Server

Open a **NEW terminal window** and run:

```bash
npx inngest-cli@latest dev
```

This will:

- Start the Inngest dev server
- Open dashboard at: **http://localhost:8288**
- Connect to your Next.js app at **http://localhost:3000**

**Keep this terminal open** while developing.

### Step 3: Start Your Next.js App

In your main terminal:

```bash
npm run dev
```

### Step 4: Verify Setup

Visit: **http://localhost:3000/api/test-inngest**

You should see:

```json
{
  "success": true,
  "message": "Inngest test function triggered!",
  "inngestEventId": "..."
}
```

Then check the Inngest dashboard at **http://localhost:8288** - you should see your test function running with 3 steps!

## How to Use Inngest Sync

### Method 1: Connect New Email Account (Automatic)

1. Go to **Settings → Email Accounts**
2. Click **"Add Microsoft Account"**
3. Complete OAuth flow
4. You'll be redirected to inbox
5. Inngest sync starts **automatically**!

**Watch it in action:**

- Open Inngest dashboard: http://localhost:8288
- See `sync-microsoft-account` function running
- Watch each folder sync in real-time

### Method 2: Manual Sync Button (Trigger Manually)

Use the API endpoint to manually trigger sync:

```bash
# Trigger manual sync
curl -X POST http://localhost:3000/api/email/sync \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "your-account-id-here",
    "syncType": "manual"
  }'
```

Or integrate into your UI:

```typescript
async function handleManualSync(accountId: string) {
  const response = await fetch('/api/email/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, syncType: 'manual' }),
  });

  const data = await response.json();
  console.log('Sync triggered:', data);
}
```

### Method 3: Check Sync Status

```bash
# Get sync status
curl http://localhost:3000/api/email/sync?accountId=your-account-id
```

Response:

```json
{
  "accountId": "...",
  "emailAddress": "user@example.com",
  "provider": "microsoft",
  "status": "syncing",
  "syncStatus": "syncing",
  "lastSyncAt": "2025-10-24T...",
  "initialSyncCompleted": false,
  "syncProgress": 150,
  "syncTotal": 5315
}
```

## Inngest Dashboard

### Accessing the Dashboard

**URL:** http://localhost:8288

### What You'll See:

1. **Functions Tab** - All registered Inngest functions
   - `test-sync` - Test function
   - `sync-microsoft-account` - Microsoft email sync

2. **Runs Tab** - All function executions
   - Click any run to see detailed step-by-step execution
   - See which steps completed, which are in progress
   - View errors and retry attempts

3. **Events Tab** - All events sent to Inngest
   - `test/sync` - Test events
   - `email/microsoft.sync` - Microsoft sync events
   - `email/gmail.sync` - Gmail sync events (Phase 2)

### Debugging a Sync

1. Open dashboard: http://localhost:8288
2. Click **"Runs"** tab
3. Find your sync run (look for `sync-microsoft-account`)
4. Click to expand
5. You'll see each step:
   - ✅ `validate-account` (completed)
   - ✅ `mark-syncing` (completed)
   - ✅ `get-access-token` (completed)
   - ✅ `sync-folders` (completed)
   - ⏳ `sync-folder-inbox` (in progress...)
   - ⏸️ `sync-folder-sent` (pending...)

6. Click any step to see:
   - Input data
   - Output/result
   - Errors (if any)
   - Retry attempts
   - Execution time

## Testing Checklist

### ✅ Phase 1: Basic Setup

- [ ] Inngest dev server starts without errors
- [ ] Dashboard opens at http://localhost:8288
- [ ] Test endpoint returns success
- [ ] Test function appears in dashboard with 3 completed steps

### ✅ Phase 2: Microsoft Account Connection

- [ ] Connect Microsoft account via OAuth
- [ ] Redirect to inbox (not settings)
- [ ] `sync-microsoft-account` function appears in Inngest dashboard
- [ ] See `validate-account` step complete
- [ ] See `sync-folders` step complete
- [ ] See multiple `sync-folder-*` steps running

### ✅ Phase 3: Email Sync Completion

- [ ] All folder steps complete successfully
- [ ] `mark-complete` step runs
- [ ] `recalculate-counts` step runs
- [ ] Inbox shows all emails (not just 100-200)
- [ ] Folder counts match Outlook exactly
- [ ] Database: `initial_sync_completed` is `true`

### ✅ Phase 4: Incremental Sync (Delta)

- [ ] Send a new test email to your account
- [ ] Trigger manual sync via API or UI
- [ ] Inngest shows new sync run
- [ ] Sync completes quickly (< 10 seconds)
- [ ] Only the NEW email appears in inbox
- [ ] Delta link was used (check logs)

### ✅ Phase 5: Error Recovery

- [ ] Disconnect internet mid-sync
- [ ] Inngest shows step failing
- [ ] Reconnect internet
- [ ] Inngest auto-retries failed step
- [ ] Sync resumes from failed step (not start)
- [ ] All emails eventually sync

## Common Issues & Solutions

### Issue: Inngest Dashboard Shows "No Functions"

**Solution:**

1. Make sure Next.js dev server is running
2. Restart Inngest dev server: `npx inngest-cli@latest dev`
3. Visit: http://localhost:3000/api/inngest
4. Refresh Inngest dashboard

### Issue: Sync Triggering But Not Running

**Solution:**

1. Check Inngest dashboard "Events" tab - is event being sent?
2. Check "Runs" tab - is function being triggered?
3. Click on the run - check for errors in steps
4. Check browser console and terminal for errors

### Issue: "initialSyncCompleted" Not Set to True

**Solution:**

1. Check Inngest dashboard - did `mark-complete` step run?
2. If not, sync may have failed before completion
3. Check for errors in earlier steps
4. Trigger sync again manually

### Issue: Sync Taking Too Long

**Solution:**
This is normal for large mailboxes!

- 1000 emails = ~2-3 minutes
- 5000 emails = ~10-15 minutes
- 10000+ emails = ~30+ minutes

**Watch progress in Inngest dashboard:**

- See which folder is currently syncing
- See how many folders completed
- Sync won't timeout (unlike regular HTTP requests)

### Issue: Duplicate Emails After Sync

**Solution:**
This shouldn't happen with Inngest, but if it does:

1. Check database - are there duplicates with same `message_id`?
2. Check `sync-microsoft.ts` - is `onConflictDoNothing()` present?
3. Run: `SELECT message_id, COUNT(*) FROM emails GROUP BY message_id HAVING COUNT(*) > 1`

## Architecture Overview

### How Inngest Sync Works

```
User Action → Trigger Event → Inngest Function → Steps → Database
```

**Example Flow:**

1. **User connects Microsoft account**

   ```typescript
   // src/app/api/auth/microsoft/callback/route.ts
   await inngest.send({
     name: 'email/microsoft.sync',
     data: { accountId, userId, syncType: 'initial' },
   });
   ```

2. **Inngest picks up event**
   - Routes to `sync-microsoft-account` function
   - Starts executing steps

3. **Each step executes independently**

   ```typescript
   // Step 1: Validate
   await step.run('validate-account', async () => {
     return await db.query.emailAccounts.findFirst(...);
   });

   // Step 2: Sync folders
   await step.run('sync-folders', async () => {
     return await syncFolders(...);
   });

   // Step 3-N: Sync each folder
   for (const folder of folders) {
     await step.run(`sync-folder-${folder.id}`, async () => {
       return await syncFolderEmails(...);
     });
   }
   ```

4. **If any step fails:**
   - Inngest auto-retries (up to 3 times)
   - Exponential backoff (5s, 10s, 30s)
   - If all retries fail, function marked as failed

5. **Resume from failure:**
   - Completed steps DON'T re-run
   - Only failed step retries
   - Subsequent steps run after success

## Production Deployment

### Environment Variables

Add to your production environment:

```bash
# Inngest (Production)
INNGEST_EVENT_KEY=your-production-event-key
INNGEST_SIGNING_KEY=your-production-signing-key
```

Get these from: https://app.inngest.com (sign up for free)

### Deploy Steps

1. Sign up at https://app.inngest.com
2. Create new app
3. Copy Event Key and Signing Key
4. Add to production environment variables
5. Deploy your app
6. Inngest will automatically connect to your production API

### No Code Changes Needed!

Inngest automatically detects:

- `NODE_ENV=production` → uses production keys
- `NODE_ENV=development` → uses local dev server

## Performance Impact

### Before Inngest:

- ❌ Syncs fail randomly (no retry)
- ❌ Timeouts on large mailboxes (>1000 emails)
- ❌ No visibility into what's failing
- ❌ Must restart entire sync if fails
- ❌ User has no idea if sync is working

### After Inngest:

- ✅ Automatic retry on failures
- ✅ No timeouts (can run for hours)
- ✅ Full visibility in dashboard
- ✅ Resumes from failure point
- ✅ Real-time progress tracking

### Cost:

- **Development:** FREE (local dev server)
- **Production:** FREE up to 50,000 steps/month
- **Scale:** $20/month for 1,000,000 steps/month

**Average sync usage:**

- Small mailbox (100 emails): ~5 steps
- Medium mailbox (1000 emails): ~15 steps
- Large mailbox (10000 emails): ~50 steps

**Monthly estimate:**

- 100 users × 10 syncs/month × 15 steps = 15,000 steps = **FREE**

## Next Steps

✅ **Phase 1 Complete** - Microsoft sync with Inngest

🚀 **Phase 2 Next** - Gmail sync with History API (2-3 hours)

📊 **Phase 3 Next** - IMAP sync with UID tracking (3-4 hours)

---

**Questions?** Check the Inngest documentation: https://www.inngest.com/docs

**Issues?** Open the dashboard and click on any failed run to see detailed error info.
