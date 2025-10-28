# Email Sync System Architecture

## Overview

The email sync system is a complete overhaul designed for 100% reliability. It handles Microsoft, Gmail, and IMAP accounts with:

- **Single Source of Truth**: One unified orchestrator for all sync operations
- **Durable Workflows**: Inngest ensures syncs complete even if the server restarts
- **Provider Abstraction**: Clean interfaces for each email provider
- **Error Recovery**: Automatic retry logic, stuck sync detection, and health checks
- **Token Management**: Automatic OAuth token refresh before expiration

---

## Architecture Components

### 1. Sync Orchestrator (`src/lib/sync/sync-orchestrator.ts`)

**THE ONLY** entry point for triggering email syncs.

```typescript
import { syncAccount } from '@/lib/sync/sync-orchestrator';

// Trigger a sync
const result = await syncAccount({
  accountId: 'account-uuid',
  syncMode: 'initial' | 'incremental',
  trigger: 'oauth' | 'manual' | 'scheduled' | 'webhook',
});

// Returns: { success: boolean, runId?: string, error?: string }
```

**Key Functions**:
- `syncAccount(request)`: Triggers an Inngest durable workflow
- `resetStuckSyncs()`: Resets accounts stuck in "syncing" for >10 minutes
- `getSyncStatus(accountId)`: Returns current sync status

**Responsibilities**:
1. Validate account exists
2. Prevent duplicate syncs (check if already syncing)
3. Send event to Inngest
4. Update account status ONLY if Inngest confirms

---

### 2. Provider Abstraction Layer (`src/lib/sync/providers/`)

All providers implement the same interface, making it easy to add new providers.

#### Base Interface (`base.ts`)

```typescript
export interface SyncProvider {
  name: string;
  refreshToken(): Promise<string>;
  fetchFolders(): Promise<ProviderFolder[]>;
  fetchEmails(folderId: string, cursor?: string): Promise<{
    emails: ProviderEmail[];
    nextCursor?: string;
    hasMore: boolean;
  }>;
}
```

#### Microsoft Provider (`microsoft.ts`)

- Uses Microsoft Graph API
- Delta sync with `@odata.deltaLink`
- OAuth token refresh via `/oauth2/v2.0/token`
- Supports pagination via `@odata.nextLink`

#### Gmail Provider (`gmail.ts`)

- Uses Gmail API via googleapis
- OAuth token refresh
- Fetches labels as folders
- Message pagination with `pageToken`

#### IMAP Provider (`imap.ts`)

- Generic IMAP protocol
- Works with Yahoo, custom servers
- UID-based cursor for incremental sync
- No OAuth (uses username/password)

---

### 3. Inngest Orchestrator (`src/inngest/functions/sync-orchestrator.ts`)

**Durable workflow** that handles the actual sync process.

**Event**: `sync/account`

**Steps**:
1. **Get Account**: Fetch account from database
2. **Initialize Provider**: Route to Microsoft/Gmail/IMAP
3. **Refresh Token**: Check expiry, refresh if needed
4. **Sync Folders**: Upsert folders to database
5. **Sync Emails**: Loop through each folder, fetch emails
6. **Mark Complete**: Update account status to `idle`

**Error Handling**:
- Automatic retries (3 attempts)
- Error classification (auth, rate limit, network, etc.)
- Account status updated on failure
- Inngest handles exponential backoff

**Concurrency**:
- Max 5 accounts syncing simultaneously
- One sync per account at a time (prevents race conditions)

---

### 4. OAuth Callbacks

#### Microsoft (`src/app/api/auth/microsoft/callback/route.ts`)

After OAuth completes, triggers sync:

```typescript
const { syncAccount } = await import('@/lib/sync/sync-orchestrator');

await syncAccount({
  accountId: inserted[0].id,
  syncMode: 'initial',
  trigger: 'oauth',
});
```

#### Gmail (similar implementation in Gmail callback)

---

### 5. Health Check API (`src/app/api/sync/health/route.ts`)

Endpoint that runs periodically to ensure system health.

**Endpoint**: `GET /api/sync/health`

**Actions**:
- Resets stuck syncs (accounts in "syncing" > 10 minutes)
- Returns sync statistics

**Response**:
```json
{
  "healthy": true,
  "message": "All syncs healthy",
  "stats": {
    "total": 5,
    "syncing": 0,
    "idle": 5,
    "error": 0,
    "active": 5,
    "stuckReset": 0
  }
}
```

**Auto-run**: Called on every dashboard load via `src/app/dashboard/layout.tsx`

---

## Data Flow

### Initial Sync (New Account)

```
User → OAuth Provider → Callback Route
                            ↓
                     syncAccount()
                            ↓
                       Inngest Event
                            ↓
                    sync-orchestrator
                            ↓
                   Initialize Provider
                            ↓
                    Fetch Folders
                            ↓
                    Upsert to DB
                            ↓
         Loop: Fetch Emails (paginated)
                            ↓
                    Upsert to DB
                            ↓
                Save Delta Cursor
                            ↓
              Mark Account as Complete
```

### Incremental Sync (Existing Account)

```
Scheduled Trigger → syncAccount({ syncMode: 'incremental' })
                            ↓
                      Load Cursor from DB
                            ↓
                 Fetch Only New/Changed Emails
                            ↓
                        Upsert to DB
                            ↓
                    Update Cursor in DB
```

---

## Key Features

### 1. **Stuck Sync Recovery**

Accounts can get stuck in "syncing" if:
- Server crashes during sync
- Inngest restarts
- Network timeout

**Solution**: Health check runs every dashboard load, resets syncs older than 10 minutes.

### 2. **Token Refresh**

OAuth tokens expire (typically 1 hour). The system automatically refreshes tokens:

```typescript
if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
  await syncProvider.refreshToken();
}
```

### 3. **Error Classification**

Errors are classified into categories:

- **auth**: User must reconnect (401, 403)
- **rate_limit**: Automatic retry with backoff (429)
- **network**: Temporary, retry (ECONNREFUSED, ETIMEDOUT)
- **provider**: Server error, retry (5xx)
- **unknown**: Retry once

### 4. **Duplicate Prevention**

Before starting a sync, check if account is already syncing:

```typescript
if (account.syncStatus === 'syncing') {
  return { success: false, error: 'Sync already in progress' };
}
```

### 5. **Delta Sync**

For incremental syncs, use delta links/cursors:

- **Microsoft**: `@odata.deltaLink`
- **Gmail**: `pageToken`
- **IMAP**: UID ranges

---

## Database Schema

### `email_accounts`

Key columns for sync:
- `sync_status`: `'idle' | 'syncing'`
- `sync_progress`: 0-100 (percentage)
- `initial_sync_completed`: boolean
- `sync_cursor`: Delta link for incremental sync
- `last_sync_at`: Timestamp of last sync attempt
- `last_successful_sync_at`: Timestamp of last successful sync
- `last_sync_error`: Error message if failed
- `token_expires_at`: OAuth token expiry

### `email_folders`

Key columns for sync:
- `sync_cursor`: Folder-specific delta link
- `last_sync_at`: Folder-specific sync timestamp
- `enabled`: Whether to sync this folder

### `emails`

All synced emails with:
- `message_id`: Unique identifier
- `provider_id`: Provider-specific ID
- `folder_id`: Reference to `email_folders`
- `account_id`: Reference to `email_accounts`

---

## Monitoring

### Inngest Dashboard

**URL**: http://localhost:8288 (dev) or Inngest Cloud (production)

**What to Monitor**:
- Active sync runs
- Failed syncs (red)
- Retry attempts
- Execution time

### Console Logs

Key log messages:
- `✅ Sync triggered successfully! Run ID: <id>`
- `🔍 Checking for stuck syncs older than <timestamp>`
- `✅ Token refreshed successfully`
- `❌ Failed to trigger sync: <error>`

---

## Deployment

### Environment Variables

**Required**:
- `NEXT_PUBLIC_APP_URL`: https://easemail.app
- `MICROSOFT_CLIENT_ID`: Azure App ID
- `MICROSOFT_CLIENT_SECRET`: Azure App Secret
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Secret
- `INNGEST_EVENT_KEY`: Production Inngest key
- `INNGEST_SIGNING_KEY`: Production Inngest signing key

### Vercel Configuration

1. Set environment variables in Vercel dashboard
2. Enable for **Production** environment
3. Redeploy after changes

### Azure/Google OAuth

Ensure redirect URIs match:
- Microsoft: `https://easemail.app/api/auth/microsoft/callback`
- Google: `https://easemail.app/api/auth/google/callback`

---

## Troubleshooting

### Issue: Accounts stuck in "syncing"

**Solution**: Health check runs automatically on dashboard load. Manually trigger via:

```typescript
import { resetStuckSyncs } from '@/lib/sync/sync-orchestrator';
await resetStuckSyncs();
```

### Issue: No emails syncing

**Checklist**:
1. Check Inngest is running: http://localhost:8288
2. Verify `sync/account` event triggered (console logs)
3. Check Inngest dashboard for errors
4. Verify OAuth tokens valid
5. Check database: `sync_status` should change from `syncing` to `idle`

### Issue: "Token refresh failed"

**Solution**: User must reconnect account:
1. Set account status to `error`
2. Show "Reconnect Account" button in settings
3. User goes through OAuth flow again

### Issue: Duplicate emails

**Cause**: Cursor not saved or conflict on unique constraint

**Solution**:
- Ensure `onConflictDoUpdate` in email insert
- Check `messageId` is unique per account

---

## Future Enhancements

1. **Webhook Support**: Real-time sync via Microsoft/Gmail webhooks
2. **Selective Folder Sync**: Allow users to choose which folders to sync
3. **Attachment Download**: Automatically download and store attachments
4. **Push Notifications**: Notify users of new important emails
5. **AI Classification**: Automatic email categorization (Imbox/Feed/Paper Trail)

---

## Maintenance

### Weekly

- Review Inngest dashboard for failed syncs
- Check error logs for patterns
- Monitor database growth

### Monthly

- Review sync performance metrics
- Optimize slow queries
- Update provider SDKs

### Quarterly

- Review and update error handling
- Test token refresh edge cases
- Audit security (token storage, encryption)

---

## Support

For issues:
1. Check console logs
2. Review Inngest dashboard
3. Run health check endpoint
4. Check database sync status

For questions:
- Review this documentation
- Check provider API documentation (Microsoft Graph, Gmail API)

---

*Last Updated: 2025*

