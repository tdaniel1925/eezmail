# 🚀 Email Sync System - Quick Start Guide

> **Get your email sync running in 5 minutes**

---

## Step 1: Database Setup

Push the new schema to your database:

```bash
npm run db:push
```

This creates:

- Enhanced `email_accounts` table with sync tracking fields
- New `sync_jobs` table for queue management

---

## Step 2: Add Sync Dashboard to Settings

Update `src/app/dashboard/settings/page.tsx`:

```tsx
import { SyncDashboard } from '@/components/sync/SyncDashboard';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's email accounts
  const accounts = await db
    .select()
    .from(emailAccounts)
    .where(eq(emailAccounts.userId, user.id));

  return (
    <div className="space-y-8">
      {/* ... existing settings ... */}

      <section>
        <h2 className="text-2xl font-bold mb-4">Email Sync</h2>
        <SyncDashboard userId={user.id} accounts={accounts} />
      </section>
    </div>
  );
}
```

---

## Step 3: Add Sync Status to Inbox

Update your inbox page to show sync status:

```tsx
import { SyncButton } from '@/components/sync/SyncButton';

export default function InboxPage() {
  return (
    <EmailLayout
      sidebar={<Sidebar />}
      emailList={
        <div>
          <div className="flex justify-between items-center p-4">
            <h1>Inbox</h1>
            <SyncButton accountId={accountId} variant="icon" />
          </div>
          <EmailList emails={emails} />
        </div>
      }
    />
  );
}
```

---

## Step 4: Set Up Cron Jobs

### Option A: Vercel Crons (Recommended for Vercel)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-sync-queue",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Create `src/app/api/cron/process-sync-queue/route.ts`:

```typescript
import { processQueue } from '@/lib/sync/job-queue';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await processQueue();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
```

### Option B: Manual Trigger (For Testing)

Call directly from your code:

```typescript
import { processQueue } from '@/lib/sync/job-queue';

// Process queue manually
const result = await processQueue();
console.log(result); // { processed: 5, succeeded: 4, failed: 1 }
```

---

## Step 5: Configure Webhooks (Optional but Recommended)

1. Go to [Nylas Dashboard](https://dashboard.nylas.com)
2. Navigate to **Webhooks**
3. Click **Add Webhook**
4. Enter URL: `https://yourdomain.com/api/webhooks/nylas`
5. Select events:
   - ✅ `message.created`
   - ✅ `message.updated`
   - ✅ `account.connected`
   - ✅ `account.disconnected`
6. Save

---

## Step 6: Test Your Setup

### Test Manual Sync:

```typescript
import { startSync } from '@/lib/sync/actions';

const result = await startSync(accountId, 'incremental');

if (result.success) {
  console.log('✅ Sync successful:', result.message);
} else {
  console.error('❌ Sync failed:', result.error);
}
```

### Test Queue System:

```typescript
import { queueSyncJob, processQueue } from '@/lib/sync/job-queue';

// Queue a job
await queueSyncJob(accountId, userId, {
  type: 'incremental',
  priority: 0,
});

// Process queue
const result = await processQueue();
console.log(result);
```

### Test Webhooks:

1. Send a test email to your connected account
2. Check webhook endpoint logs
3. Verify sync was triggered
4. Check new email in database

---

## Common Commands

```bash
# Start dev server
npm run dev

# Push database schema
npm run db:push

# Check TypeScript errors
npm run type-check

# Run linter
npm run lint
```

---

## Monitoring Your Syncs

### View Account Metrics:

```typescript
import { getAccountMetrics } from '@/lib/sync/monitoring';

const metrics = await getAccountMetrics(accountId, 30);

console.log('Total syncs:', metrics.totalSyncs);
console.log('Success rate:', 100 - metrics.errorRate + '%');
console.log('Emails synced:', metrics.totalEmailsSynced);
```

### Generate Health Report:

```typescript
import { generateHealthReport } from '@/lib/sync/monitoring';

const report = await generateHealthReport(accountId);

console.log('Status:', report.status); // 'healthy' | 'degraded' | 'critical'
console.log('Issues:', report.issues);
console.log('Recommendations:', report.recommendations);
```

---

## Troubleshooting

### Sync Not Starting:

1. **Check account status:**

   ```typescript
   const [account] = await db
     .select()
     .from(emailAccounts)
     .where(eq(emailAccounts.id, accountId))
     .limit(1);

   console.log('Status:', account.status);
   console.log('Sync status:', account.syncStatus);
   console.log('Error:', account.lastSyncError);
   ```

2. **Check Nylas grant ID:**

   ```typescript
   if (!account.nylasGrantId) {
     console.error('Missing Nylas grant ID - reconnect account');
   }
   ```

3. **Reset error count:**
   ```typescript
   import { resetErrorCount } from '@/lib/sync/actions';
   await resetErrorCount(accountId);
   ```

### High Error Rate:

1. **Check authentication:**
   - Go to settings → Connected Accounts
   - Reconnect the account
   - Verify credentials

2. **Review error logs:**

   ```typescript
   import { getSyncHistory } from '@/lib/sync/monitoring';
   const history = await getSyncHistory(accountId, 10);
   console.log(history);
   ```

3. **Check provider status:**
   - Gmail: https://status.cloud.google.com
   - Outlook: https://status.office.com

### Duplicates:

Run deduplication:

```typescript
import { deduplicateEmails } from '@/lib/sync/deduplication';

const result = await deduplicateEmails(accountId);

console.log('Duplicates found:', result.duplicatesFound);
console.log('Duplicates removed:', result.duplicatesRemoved);
```

---

## Performance Tips

1. **Use incremental sync** (default):

   ```typescript
   await startSync(accountId, 'incremental'); // ✅ Fast
   ```

2. **Enable webhooks** for real-time updates:
   - Reduces polling
   - Instant notifications
   - Lower API usage

3. **Schedule syncs during low-traffic hours:**

   ```typescript
   import { scheduleSync } from '@/lib/sync/actions';

   const tonight = new Date();
   tonight.setHours(2, 0, 0, 0); // 2 AM

   await scheduleSync(accountId, tonight);
   ```

4. **Run deduplication weekly:**
   - Set up cron job
   - Reduces storage
   - Improves performance

---

## Next Steps

1. ✅ Test manual sync
2. ✅ Set up cron job
3. ✅ Configure webhooks
4. ✅ Add UI components
5. ✅ Monitor metrics
6. 🎉 You're ready for production!

---

## Need Help?

- 📚 Full documentation: `EMAIL_SYNC_SYSTEM.md`
- 🐛 Check TypeScript errors: `npm run type-check`
- 🔍 View logs: Check Vercel/console logs
- 📊 View metrics: Go to Settings → Email Sync

---

**Happy syncing! 🚀**
