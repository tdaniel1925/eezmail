# Email Provider Integration Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                                │
│                     (Dashboard / Inbox View)                          │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             │ Trigger Sync / View Emails
                             │
                             v
┌──────────────────────────────────────────────────────────────────────┐
│                      SYNC CONTROL LAYER                               │
│                  src/lib/sync/sync-controls.ts                        │
│                                                                        │
│  • pauseSync()              • triggerManualSync()                     │
│  • resumeSync()             • cancelSync()                            │
│  • setSyncPriority()        • resetSyncProgress()                     │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             │ Calls syncEmailAccount()
                             │
                             v
┌──────────────────────────────────────────────────────────────────────┐
│                    SYNC ORCHESTRATION LAYER                           │
│               src/lib/sync/email-sync-service.ts                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────┐            │
│  │          syncEmailAccount(accountId, syncType)        │            │
│  │  • Authenticate user                                  │            │
│  │  • Get account details                                │            │
│  │  • Validate/refresh access token                      │            │
│  │  • Start background sync                              │            │
│  └────────────────────────┬─────────────────────────────┘            │
│                           │                                            │
│  ┌────────────────────────v─────────────────────────────┐            │
│  │       syncInBackground(accountId, ...)                │            │
│  │  • Route by provider type                             │            │
│  │  • Error handling & retry logic                       │            │
│  │  • Progress tracking                                  │            │
│  └────────────────────────┬─────────────────────────────┘            │
│                           │                                            │
│              ┌────────────┼────────────┐                              │
│              │            │            │                              │
└──────────────┼────────────┼────────────┼──────────────────────────────┘
               │            │            │
               v            v            v
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   GMAIL SYNC     │ │ MICROSOFT SYNC  │ │   IMAP SYNC      │
│                  │ │                 │ │                  │
│ syncWithGmail()  │ │syncWithMicrosoft│ │ syncWithImap()   │
│                  │ │    Graph()      │ │                  │
└────────┬─────────┘ └────────┬────────┘ └────────┬─────────┘
         │                    │                    │
         │                    │                    │
         v                    v                    v
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│  Gmail API       │ │Microsoft Graph  │ │  IMAP Protocol   │
│  Service         │ │  API Service    │ │  Service         │
│                  │ │                 │ │                  │
│src/lib/email/    │ │src/lib/email/   │ │src/lib/email/    │
│gmail-api.ts      │ │microsoft-       │ │imap-service.ts   │
│                  │ │graph.ts         │ │                  │
│                  │ │                 │ │                  │
│• OAuth 2.0       │ │• OAuth 2.0      │ │• Username/Pass   │
│• Get messages    │ │• Get messages   │ │• IMAP connection │
│• Get labels      │ │• Get folders    │ │• Fetch messages  │
│• Send email      │ │• Send email     │ │• Mark read       │
│• Refresh tokens  │ │• Delta queries  │ │• Move/Delete     │
└────────┬─────────┘ └────────┬────────┘ └────────┬─────────┘
         │                    │                    │
         │                    │                    │
         └────────────────────┴────────────────────┘
                             │
                             v
         ┌───────────────────────────────────────────┐
         │      TOKEN MANAGEMENT LAYER               │
         │   src/lib/email/token-manager.ts          │
         │                                            │
         │  • getValidAccessToken()                  │
         │  • Automatic token refresh                │
         │  • Expiration checking                    │
         │  • Reconnection detection                 │
         └───────────────────┬───────────────────────┘
                             │
                             v
         ┌───────────────────────────────────────────┐
         │       AI CATEGORIZATION LAYER             │
         │  src/lib/screener/email-categorizer.ts    │
         │                                            │
         │  • categorizeIncomingEmail()              │
         │  • AI-powered screening                   │
         │  • Categories: inbox, newsfeed, receipts, │
         │    spam, archived                         │
         └───────────────────┬───────────────────────┘
                             │
                             v
         ┌───────────────────────────────────────────┐
         │          DATABASE LAYER                    │
         │              PostgreSQL                    │
         │                                            │
         │  ┌─────────────────────────────────────┐  │
         │  │     email_accounts                  │  │
         │  │  • id, userId, provider             │  │
         │  │  • accessToken, refreshToken        │  │
         │  │  • imapHost, imapUsername, etc.     │  │
         │  │  • syncStatus, syncCursor           │  │
         │  │  • lastSyncAt, lastSyncError        │  │
         │  └─────────────────────────────────────┘  │
         │                                            │
         │  ┌─────────────────────────────────────┐  │
         │  │     emails                          │  │
         │  │  • id, accountId, messageId         │  │
         │  │  • subject, fromAddress, etc.       │  │
         │  │  • emailCategory, screenedBy        │  │
         │  │  • receivedAt, isRead               │  │
         │  └─────────────────────────────────────┘  │
         │                                            │
         │  ┌─────────────────────────────────────┐  │
         │  │     email_folders                   │  │
         │  │  • id, accountId, name              │  │
         │  │  • externalId, type                 │  │
         │  └─────────────────────────────────────┘  │
         └────────────────────────────────────────────┘
```

## Data Flow Sequence

### 1. Initial Account Connection

```
User → OAuth Provider → Callback Handler → Database
                                         ↓
                               Store tokens & metadata
                                         ↓
                            Trigger initial sync
```

### 2. Email Sync Flow

```
syncEmailAccount()
    ↓
Authenticate user
    ↓
Get account from database
    ↓
Check token validity → Token Manager → Refresh if needed
    ↓
Start background sync → syncInBackground()
    ↓
Route by provider:
    ├─→ Gmail → syncWithGmail()
    │       ↓
    │   Get labels → Store in email_folders
    │       ↓
    │   Get messages → Process each message
    │       ↓
    │   Categorize (AI or folder-based)
    │       ↓
    │   Store in emails table
    │
    ├─→ Microsoft → syncWithMicrosoftGraph()
    │       ↓
    │   Get folders → Store in email_folders
    │       ↓
    │   Get messages (delta query)
    │       ↓
    │   Categorize (AI or folder-based)
    │       ↓
    │   Store in emails table
    │       ↓
    │   Save deltaLink for next sync
    │
    └─→ IMAP → syncWithImap()
            ↓
        Get mailboxes → Store in email_folders
            ↓
        Fetch messages from INBOX
            ↓
        Categorize (AI or folder-based)
            ↓
        Store in emails table
```

### 3. Background Sync Loop

```
Sync Modes (src/lib/sync/sync-modes.ts)
    ↓
┌─────────────────────────────────────┐
│  startDualModeSync(accountId)       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Continuous Sync             │  │
│  │  Every 2 minutes             │  │
│  │  → Quick checks for new mail │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Historical Sync             │  │
│  │  Every 1 minute              │  │
│  │  → Fetch older emails        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 4. Error Handling Flow

```
Sync encounters error
    ↓
classifyError()
    ↓
Determine error type:
    ├─→ OAuth/Permission → Mark account as "needs reconnection"
    │                    → User must reconnect
    │
    ├─→ Rate Limit → Schedule retry (5s, 15s, 30s)
    │              → Auto-resume when limit clears
    │
    ├─→ Network → Retry up to 3 times
    │           → Exponential backoff
    │
    └─→ Unknown → Single retry attempt
                → Log error for debugging
```

## Key Features

### ✅ Multi-Provider Support

- Gmail (OAuth 2.0)
- Microsoft/Outlook (OAuth 2.0)
- IMAP (Username/Password)

### ✅ Intelligent Sync

- Delta queries for incremental sync
- Background sync with intervals
- Progress tracking
- Error recovery

### ✅ AI Categorization

- Auto-categorize new emails
- Manual sync respects folders
- Categories: inbox, newsfeed, receipts, spam, archived

### ✅ Token Management

- Automatic token refresh
- Expiration detection
- Reconnection prompts

### ✅ Error Handling

- Classified error types
- Automatic retries
- User notifications

### ✅ Control Functions

- Pause/Resume sync
- Manual sync triggers
- Priority settings
- Status tracking

## Integration Points

### Frontend Components

```typescript
// Dashboard sync button
<AutoSyncInbox accountId={accountId} />

// Manual sync trigger
<SyncButton onClick={() => triggerManualSync(accountId)} />

// Sync status display
<SyncStatus accountId={accountId} />
```

### API Routes

```typescript
// Trigger sync
POST / api / email / sync;

// Check status
GET / api / email / sync / status;

// OAuth callbacks
GET / api / auth / google / callback;
GET / api / auth / microsoft / callback;
```

### Server Actions

```typescript
// Direct imports in server components
import { syncEmailAccount } from '@/lib/sync/email-sync-service';
import { pauseSync, resumeSync } from '@/lib/sync/sync-controls';
```

## Configuration

### Environment Variables

```bash
# Gmail
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Microsoft
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Migration

```sql
-- All necessary tables exist:
-- email_accounts, emails, email_folders
-- See migrations/ directory for details
```

## Performance Characteristics

### Gmail Sync

- **Batch Size**: 100 messages per request
- **Rate Limit**: ~250 requests/second
- **Pagination**: pageToken-based
- **Delta Sync**: Not available (full pagination)

### Microsoft Sync

- **Batch Size**: 100 messages per request
- **Rate Limit**: Varies by tenant
- **Pagination**: @odata.nextLink
- **Delta Sync**: ✅ Yes (deltaLink)

### IMAP Sync

- **Batch Size**: 50 messages (configurable)
- **Rate Limit**: Provider-dependent
- **Pagination**: UID-based ranges
- **Delta Sync**: UID-based incremental

---

**Status**: ✅ Fully Operational

**Last Updated**: October 20, 2025


