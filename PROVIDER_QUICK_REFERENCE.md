# Provider Integration Quick Reference

## ✅ What's Working

### Gmail, Microsoft, and IMAP are **fully connected** to the sync system!

## How It Works

### 1. Provider Routing

When an email account syncs, the system automatically routes to the correct provider:

```typescript
// in src/lib/sync/email-sync-service.ts
if (account.provider === 'microsoft') {
  await syncWithMicrosoftGraph(...);
} else if (account.provider === 'gmail') {
  await syncWithGmail(...);
} else if (account.provider === 'imap') {
  await syncWithImap(...);
}
```

### 2. Provider Services

**Gmail** → `src/lib/email/gmail-api.ts`

- OAuth 2.0
- Gmail API v1
- Syncs messages, labels, threads

**Microsoft** → `src/lib/email/microsoft-graph.ts`

- OAuth 2.0
- Microsoft Graph API v1.0
- Syncs messages, folders, delta queries

**IMAP** → `src/lib/email/imap-service.ts`

- Username/Password
- IMAP protocol
- Universal provider (Yahoo, ProtonMail, etc.)

### 3. Sync Entry Points

**Start sync**: `syncEmailAccount(accountId, syncType)`

- Routes to provider
- Starts background sync
- Returns immediately

**Get status**: `getSyncStatus(accountId)`

- Returns current sync state
- Email count, folder count
- Error messages if any

**Control sync**: See `src/lib/sync/sync-controls.ts`

- `pauseSync(accountId)`
- `resumeSync(accountId)`
- `triggerManualSync(accountId)`
- `cancelSync(accountId)`

## Testing

### Gmail

```bash
# Set in .env.local
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Microsoft

```bash
# Set in .env.local
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common
```

### IMAP

```bash
# No env vars needed
# Credentials stored per account
```

## Common Operations

### Add New Email Account

```typescript
// OAuth providers (Gmail/Microsoft)
1. User clicks "Connect Gmail/Outlook"
2. Redirects to OAuth consent
3. Callback saves tokens → database
4. Auto-triggers initial sync

// IMAP providers
1. User enters credentials
2. Test connection
3. Save to database
4. Trigger initial sync
```

### Trigger Manual Sync

```typescript
import { triggerManualSync } from '@/lib/sync/sync-controls';

const result = await triggerManualSync(accountId);
if (result.success) {
  console.log('Sync started!');
}
```

### Check Sync Status

```typescript
import { getSyncStatus } from '@/lib/sync/email-sync-service';

const status = await getSyncStatus(accountId);
console.log(`Status: ${status.data.status}`);
console.log(`Emails: ${status.data.emailCount}`);
```

## File Structure

```
src/lib/
├── email/
│   ├── gmail-api.ts              ← Gmail integration
│   ├── microsoft-graph.ts        ← Microsoft integration
│   ├── imap-service.ts           ← IMAP integration
│   └── token-manager.ts          ← OAuth token refresh
├── sync/
│   ├── email-sync-service.ts     ← Main sync orchestrator
│   ├── sync-controls.ts          ← Pause/resume/manual sync
│   ├── sync-modes.ts             ← Background sync intervals
│   └── job-queue.ts              ← Sync job scheduling
└── screener/
    └── email-categorizer.ts      ← AI categorization
```

## Key Functions

### Sync Service

```typescript
// Start sync (returns immediately, runs in background)
syncEmailAccount(accountId, syncType);

// Background sync process (private)
syncInBackground(accountId, account, userId, accessToken, syncType);

// Provider-specific sync
syncWithGmail(account, accountId, userId, accessToken, syncType);
syncWithMicrosoftGraph(account, accountId, userId, accessToken, syncType);
syncWithImap(account, accountId, userId, syncType);
```

### Sync Controls

```typescript
pauseSync(accountId);
resumeSync(accountId);
setSyncPriority(accountId, priority);
triggerManualSync(accountId);
cancelSync(accountId);
resetSyncProgress(accountId);
```

## Database Tables

### email_accounts

```sql
{
  id: UUID
  provider: 'gmail' | 'microsoft' | 'imap'
  access_token: TEXT        -- OAuth only
  refresh_token: TEXT       -- OAuth only
  imap_host: TEXT           -- IMAP only
  imap_username: TEXT       -- IMAP only
  imap_password: TEXT       -- IMAP only
  status: 'syncing' | 'active' | 'error' | 'idle'
  last_sync_at: TIMESTAMP
  sync_cursor: TEXT         -- For delta/pagination
}
```

### emails

```sql
{
  id: UUID
  account_id: UUID
  message_id: TEXT
  subject: TEXT
  from_address: JSONB
  received_at: TIMESTAMP
  email_category: TEXT      -- AI categorized
  screened_by: TEXT         -- 'ai_rule' | 'manual_sync'
}
```

## Error Handling

Errors are automatically classified and handled:

- **OAuth/Permission** → User must reconnect
- **Rate Limit** → Auto-retry (5s, 15s, 30s delays)
- **Network** → Auto-retry (up to 3 attempts)
- **Unknown** → Single retry

## AI Categorization

During sync, emails are categorized:

- **Initial/Manual sync** → Use folder name
- **Auto sync** → AI categorization

Categories: `inbox`, `newsfeed`, `receipts`, `spam`, `archived`

## Next Implementation TODOs

1. **IMAP password encryption** (security)
2. **Webhook subscriptions** (real-time sync)
3. **Contact sync** (all providers)
4. **Server-side delete** (sync back to provider)
5. **Attachment download** (storage)

## Troubleshooting

**Sync not starting?**

- Check `last_sync_error` in database
- Verify access token validity
- Check provider API status

**OAuth errors?**

- Verify environment variables
- Check OAuth consent screen setup
- Ensure correct redirect URIs

**IMAP connection issues?**

- Verify host/port/SSL settings
- Check for app-specific password requirement
- Ensure IMAP is enabled on account

---

**Status**: ✅ All providers fully integrated and operational

See `PROVIDER_INTEGRATION_COMPLETE.md` for full documentation.


