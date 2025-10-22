# Email Client App - Complete Account Addition & Sync Workflow

## Overview

This document outlines the complete, step-by-step workflow for what should happen when a user adds a new email account to the app and how the sync process should work. Use this as a reference when building, debugging, or testing the email sync functionality.

---

## 🎯 PRIMARY GOALS

1. Seamlessly connect user's email account (Gmail, Outlook, IMAP)
2. Securely store account credentials
3. Perform initial sync of emails and folders
4. Set up automated ongoing sync
5. Categorize emails intelligently (Inbox, Newsfeed, Receipts, Spam, Archived)
6. Provide real-time progress feedback to user

---

## 📋 COMPLETE WORKFLOW

### PHASE 1: Account Addition (User-Initiated)

#### Step 1.1: User Initiates Account Connection

**What happens:**

- User clicks "Add Email Account" button
- App presents account type selection:
  - Gmail (OAuth)
  - Microsoft/Outlook (OAuth)
  - Other (IMAP)

**Expected behavior:**

- UI shows account type options clearly
- Each option explains what access is needed
- User can cancel at any time

#### Step 1.2: Authentication Process

**For Gmail/Outlook (OAuth):**

1. App redirects user to provider's OAuth consent screen
2. User grants permissions:
   - Read emails
   - Read folders/labels
   - Send emails (if needed)
   - Manage folders (if needed)
3. Provider redirects back with authorization code
4. App exchanges code for:
   - Access token (short-lived, ~1 hour)
   - Refresh token (long-lived, for getting new access tokens)
   - Token expiration time

**For IMAP:**

1. User enters:
   - Email address
   - IMAP server (e.g., imap.gmail.com)
   - Port (usually 993 for SSL)
   - Username
   - Password
   - SSL/TLS settings
2. App validates connection by attempting to connect
3. If successful, proceed; if failed, show clear error message

**Expected behavior:**

- OAuth: Open in secure browser window, not in-app
- IMAP: Validate credentials before saving
- Show loading spinner during authentication
- Display clear error messages if authentication fails
- Never store passwords in plain text

#### Step 1.3: Store Account Details

**What gets stored in database:**

```typescript
{
  userId: string,              // Current logged-in user
  emailAddress: string,        // user@example.com
  provider: 'gmail' | 'microsoft' | 'imap',

  // OAuth accounts
  accessToken: string,         // Encrypted
  refreshToken: string,        // Encrypted
  tokenExpiresAt: Date,

  // IMAP accounts
  imapHost: string,
  imapPort: number,
  imapUsername: string,
  imapPassword: string,        // MUST BE ENCRYPTED
  imapUseSsl: boolean,

  // Sync metadata
  status: 'connected',         // Initial status
  syncCursor: null,            // No sync yet
  lastSyncAt: null,
  syncStatus: null,
  syncError: null,

  createdAt: Date,
  updatedAt: Date
}
```

**Security requirements:**

- ✅ Encrypt `accessToken` before storing
- ✅ Encrypt `refreshToken` before storing
- ✅ Encrypt `imapPassword` before storing
- ✅ Use environment-specific encryption keys
- ✅ Never log sensitive tokens/passwords

**Expected behavior:**

- Account appears in user's account list immediately with status "connected"
- User sees confirmation message
- Auto-trigger initial sync (Phase 2)

---

### PHASE 2: Initial Sync (Automatic)

#### Step 2.1: Detect Initial Sync Needed

**Trigger:** Automatically when new account is added (syncCursor is null)

**What happens:**

```typescript
// Check if initial sync
const isInitialSync = account.syncCursor === null;
if (isInitialSync) {
  syncType = 'initial';
}
```

**Expected behavior:**

- System automatically detects this is the first sync
- No user action required
- Update account status to "syncing"

#### Step 2.2: Update Account Status

```typescript
await db.update(emailAccounts).set({
  status: 'syncing',
  syncStatus: 'Starting initial sync...',
  syncError: null,
});
```

**Expected behavior:**

- UI shows account as "Syncing..."
- User can see progress updates in real-time
- User can still navigate app (sync happens in background)

#### Step 2.3: Validate Access Token

**What happens:**

1. Check if access token exists
2. Check if token is expired (compare tokenExpiresAt with current time)
3. If expired or expiring soon:
   - Use refresh token to get new access token
   - Update stored access token and expiry time
4. If refresh fails:
   - Mark account as "needs_reconnection"
   - Notify user to reconnect account
   - STOP sync process

**Expected behavior:**

- Transparent to user (no interruption if refresh succeeds)
- Clear error message if reconnection needed
- Auto-retry token refresh once before failing

#### Step 2.4: Sync Folders/Labels

**For Gmail:**

```typescript
// Get all labels
const labels = await GmailService.listLabels(accessToken);

// Store each label as a folder
for (const label of labels) {
  await db
    .insert(emailFolders)
    .values({
      accountId: accountId,
      userId: userId,
      name: label.name, // "INBOX", "SENT", "Custom Label"
      externalId: label.id, // Gmail's label ID
      type: mapGmailLabelType(label.name), // 'inbox', 'sent', 'drafts', etc.
    })
    .onConflictDoUpdate({
      // Update if already exists
      target: [emailFolders.accountId, emailFolders.externalId],
      set: { name: label.name, type: mapType(label.name) },
    });
}
```

**For Outlook:**

```typescript
// Get all folders
const folders = await MicrosoftGraphAPI.listFolders(accessToken);

// Store each folder
for (const folder of folders) {
  await db
    .insert(emailFolders)
    .values({
      accountId: accountId,
      userId: userId,
      name: folder.displayName,
      externalId: folder.id,
      type: mapOutlookFolderType(folder.displayName),
    })
    .onConflictDoUpdate({
      target: [emailFolders.accountId, emailFolders.externalId],
      set: { name: folder.displayName },
    });
}
```

**For IMAP:**

```typescript
// Get all mailboxes
const mailboxes = await ImapService.getMailboxes();

// Store each mailbox
for (const mailbox of mailboxes) {
  await db
    .insert(emailFolders)
    .values({
      accountId: accountId,
      userId: userId,
      name: mailbox.name,
      externalId: mailbox.path,
      type: mapImapFolderType(mailbox.name),
    })
    .onConflictDoUpdate({
      target: [emailFolders.accountId, emailFolders.externalId],
      set: { name: mailbox.name },
    });
}
```

**Expected behavior:**

- Progress: "Syncing folders... (1/1)"
- All folders/labels stored in database
- Handles duplicate folders gracefully
- Takes 1-5 seconds typically

#### Step 2.5: Sync Emails (Initial - Last 30 Days)

**Important:** During initial sync, only fetch emails from the last 30 days to avoid overwhelming the system and taking too long.

**For Gmail:**

```typescript
// Fetch messages from last 30 days
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const messages = await GmailService.listMessages(accessToken, {
  maxResults: 500, // Fetch in batches
  q: `after:${formatDate(thirtyDaysAgo)}`,
});

let syncedCount = 0;
const totalMessages = messages.length;

for (const message of messages) {
  // Update progress
  syncedCount++;
  await updateSyncProgress(
    accountId,
    `Syncing emails... (${syncedCount}/${totalMessages})`
  );

  // Get full message details
  const fullMessage = await GmailService.getMessage(accessToken, message.id);

  // Store email WITHOUT AI categorization (initial sync)
  await storeEmail({
    accountId,
    messageId: fullMessage.id,
    subject: fullMessage.subject,
    fromAddress: fullMessage.from,
    toAddresses: fullMessage.to,
    receivedAt: fullMessage.date,
    isRead: fullMessage.isRead,
    bodyPreview: fullMessage.snippet,
    bodyHtml: fullMessage.bodyHtml,
    bodyText: fullMessage.bodyText,
    hasAttachments: fullMessage.hasAttachments,

    // Don't AI categorize during initial sync - use original folder
    emailCategory: mapOriginalFolder(fullMessage.labelIds),
    screenedBy: 'initial_sync',
    screenedAt: new Date(),
    screeningStatus: 'screened',
  });

  // Generate embeddings for RAG (don't block sync)
  try {
    await embedEmail(emailId);
  } catch (error) {
    console.error('Embedding failed:', error);
    // Continue sync even if embedding fails
  }
}
```

**For Outlook:**

```typescript
// Use delta query for efficient sync
const deltaLink = account.syncCursor || null;
const response = await MicrosoftGraphAPI.listMessages(accessToken, {
  deltaLink: deltaLink,
  top: 500, // Batch size
  filter: `receivedDateTime ge ${thirtyDaysAgo.toISOString()}`,
});

for (const message of response.messages) {
  // Same process as Gmail
  await storeEmail({
    // ... same structure
    emailCategory: mapOriginalFolder(message.parentFolderId),
    screenedBy: 'initial_sync',
  });
}

// Store delta link for next sync
await db.update(emailAccounts).set({
  syncCursor: response.deltaLink,
});
```

**For IMAP:**

```typescript
// Sync from multiple folders
const foldersToSync = ['INBOX', 'Sent', 'Drafts'];

for (const folderName of foldersToSync) {
  const messages = await ImapService.fetchMessages(folderName, {
    limit: 500,
    since: thirtyDaysAgo,
  });

  for (const message of messages) {
    await storeEmail({
      // ... same structure
      emailCategory: mapFolderToCategory(folderName),
      screenedBy: 'initial_sync',
    });
  }
}
```

**Email storage process for ALL providers:**

```typescript
async function storeEmail(emailData) {
  // 1. Insert or update email
  const result = await db
    .insert(emails)
    .values(emailData)
    .onConflictDoUpdate({
      target: [emails.accountId, emails.messageId],
      set: {
        isRead: emailData.isRead,
        folderName: emailData.folderName,
        // Don't update category during initial sync if already exists
      },
    })
    .returning({ id: emails.id });

  const emailId = result[0].id;

  // 2. Auto-log to contact timeline (don't block on errors)
  try {
    const senderEmail = extractEmailAddress(emailData.fromAddress);
    if (senderEmail) {
      const contactId = await findContactByEmail(senderEmail);
      if (contactId) {
        await logEmailReceived(
          contactId,
          emailData.subject,
          emailData.messageId
        );
      }
    }
  } catch (error) {
    console.error('Failed to log to timeline:', error);
    // Don't stop sync
  }

  // 3. Generate embedding for RAG search (don't block on errors)
  if (emailId) {
    try {
      await embedEmail(emailId);
    } catch (error) {
      console.error('Failed to embed email:', error);
      // Don't stop sync
    }
  }

  return emailId;
}
```

**Expected behavior:**

- Progress updates every 10-50 emails: "Syncing emails... (150/500)"
- Batch processing (don't fetch all at once)
- Handle rate limits gracefully (pause and retry)
- Skip duplicates automatically
- Show estimated time remaining
- Takes 30 seconds to 5 minutes depending on email volume
- User can still use app during sync

#### Step 2.6: Complete Initial Sync

**What happens:**

```typescript
// Update account with sync completion
await db.update(emailAccounts).set({
  status: 'active',
  lastSyncAt: new Date(),
  syncStatus: 'Sync completed',
  syncError: null,
  syncCursor: newDeltaLink, // For next incremental sync
});

// Show success notification
showNotification({
  title: 'Email account connected!',
  message: `Successfully synced ${emailCount} emails`,
  type: 'success',
});
```

**Expected behavior:**

- Account status changes from "syncing" to "active"
- User sees success message
- Emails appear in their categorized folders (Inbox, Newsfeed, etc.)
- Initial sync is complete
- Schedule next auto-sync for 5 minutes later

---

### PHASE 3: Ongoing Auto-Sync (Background)

#### Step 3.1: Schedule Auto-Sync

**Trigger:**

- Every 5 minutes for active accounts
- OR when user opens app
- OR when user manually clicks "Refresh"

**What happens:**

```typescript
// Check if account needs sync
const timeSinceLastSync = Date.now() - account.lastSyncAt.getTime();
const FIVE_MINUTES = 5 * 60 * 1000;

if (timeSinceLastSync >= FIVE_MINUTES) {
  await syncEmailAccount(accountId, 'auto');
}
```

#### Step 3.2: Incremental Sync (New Emails Only)

**For Gmail:**

```typescript
// Use history API for efficient incremental sync
const history = await GmailService.listHistory(accessToken, {
  startHistoryId: account.syncCursor, // Last sync point
  historyTypes: [
    'messageAdded',
    'messageDeleted',
    'labelAdded',
    'labelRemoved',
  ],
});

for (const historyRecord of history.history) {
  if (historyRecord.messagesAdded) {
    for (const addedMessage of historyRecord.messagesAdded) {
      // Fetch full message
      const message = await GmailService.getMessage(
        accessToken,
        addedMessage.id
      );

      // AI CATEGORIZE NEW EMAILS
      const category = await categorizeIncomingEmail(
        {
          subject: message.subject,
          fromAddress: message.from,
          bodyPreview: message.snippet,
        },
        userId
      );

      await storeEmail({
        ...message,
        emailCategory: category, // AI categorized!
        screenedBy: 'ai_rule',
        screeningStatus: 'screened',
      });
    }
  }
}

// Update sync cursor
await db.update(emailAccounts).set({
  syncCursor: history.historyId,
  lastSyncAt: new Date(),
});
```

**For Outlook:**

```typescript
// Use delta link for incremental sync
const response = await MicrosoftGraphAPI.listMessages(accessToken, {
  deltaLink: account.syncCursor, // Last sync point
});

for (const message of response.messages) {
  // AI CATEGORIZE NEW EMAILS
  const category = await categorizeIncomingEmail(
    {
      subject: message.subject,
      fromAddress: message.from,
      bodyPreview: message.bodyPreview,
    },
    userId
  );

  await storeEmail({
    ...message,
    emailCategory: category,
    screenedBy: 'ai_rule',
  });
}

// Update delta link
await db.update(emailAccounts).set({
  syncCursor: response.deltaLink,
  lastSyncAt: new Date(),
});
```

**For IMAP:**

```typescript
// IMAP doesn't have delta sync - check for new messages
const messages = await ImapService.fetchMessages('INBOX', {
  unseen: true, // Only new/unread
  since: account.lastSyncAt,
});

for (const message of messages) {
  // AI CATEGORIZE NEW EMAILS
  const category = await categorizeIncomingEmail(
    {
      subject: message.subject,
      fromAddress: message.from,
      bodyPreview: message.bodyPreview,
    },
    userId
  );

  await storeEmail({
    ...message,
    emailCategory: category,
    screenedBy: 'ai_rule',
  });
}
```

**Key difference from initial sync:**

- ✅ Only fetch NEW emails (not all emails)
- ✅ AI categorize each new email
- ✅ Much faster (usually < 5 seconds)
- ✅ Silent in background (no progress UI)
- ✅ Update last sync timestamp

**Expected behavior:**

- Sync happens silently in background
- New emails appear in real-time
- No interruption to user
- If sync fails, retry after 1 minute (up to 3 retries)
- If all retries fail, show error notification

---

### PHASE 4: Email Categorization (AI)

#### Step 4.1: When to Categorize

**Categorization happens:**

- ✅ During AUTO-SYNC (new incoming emails)
- ✅ During MANUAL-SYNC (user clicks refresh)
- ❌ NOT during INITIAL-SYNC (too many emails, would take too long)

#### Step 4.2: Categorization Process

```typescript
async function categorizeIncomingEmail(email, userId) {
  // 1. Get user's custom rules/preferences
  const userRules = await getUserCategorizationRules(userId);

  // 2. Prepare email data for AI
  const emailContext = {
    subject: email.subject,
    from: email.fromAddress,
    preview: email.bodyPreview,
    // Don't send full body (too expensive)
  };

  // 3. Call AI categorization
  const prompt = `
    Categorize this email into one of these categories:
    - inbox: Important personal or work emails that need attention
    - newsfeed: Newsletters, updates, social media notifications
    - receipts: Purchase confirmations, invoices, shipping updates
    - spam: Unwanted promotional emails, suspicious emails
    - archived: Not important, can be archived
    
    Email:
    Subject: ${emailContext.subject}
    From: ${emailContext.from}
    Preview: ${emailContext.preview}
    
    User preferences: ${JSON.stringify(userRules)}
    
    Respond with ONLY the category name.
  `;

  const category = await callAI(prompt); // Returns: 'inbox', 'newsfeed', etc.

  return category;
}
```

**Expected behavior:**

- Categorization takes 1-3 seconds per email
- If AI fails, default to 'inbox' (safe fallback)
- Log categorization decisions for user review
- Allow user to re-categorize later (updates AI preferences)

#### Step 4.3: Category Definitions

| Category     | Description                        | Examples                                                  |
| ------------ | ---------------------------------- | --------------------------------------------------------- |
| **inbox**    | Important emails needing attention | Work emails, personal correspondence, calendar invites    |
| **newsfeed** | Updates and notifications          | Newsletters, social media, blog posts, news alerts        |
| **receipts** | Purchase-related emails            | Order confirmations, shipping updates, invoices, receipts |
| **spam**     | Unwanted or suspicious             | Marketing emails, phishing attempts, junk mail            |
| **archived** | Can be stored away                 | Old threads, FYI emails, no action needed                 |

---

### PHASE 5: Error Handling & Edge Cases

#### Error Type 1: OAuth Token Expired

**What happens:**

```typescript
// During sync, token validation fails
if (tokenExpired) {
  try {
    // Attempt to refresh
    const newToken = await refreshAccessToken(account.refreshToken);

    // Update stored token
    await db.update(emailAccounts).set({
      accessToken: encrypt(newToken.accessToken),
      tokenExpiresAt: newToken.expiresAt,
    });

    // Retry sync with new token
    return await syncEmailAccount(accountId, syncType);
  } catch (refreshError) {
    // Refresh failed - need user reconnection
    await db.update(emailAccounts).set({
      status: 'needs_reconnection',
      syncError: 'Please reconnect your email account',
    });

    // Notify user
    showNotification({
      title: 'Reconnection required',
      message: 'Please reconnect your email account',
      action: 'Reconnect',
      type: 'warning',
    });
  }
}
```

#### Error Type 2: Rate Limiting

**What happens:**

```typescript
// API returns 429 Too Many Requests
if (error.statusCode === 429) {
  const retryAfter = error.headers['Retry-After'] || 60; // seconds

  console.log(`Rate limited. Retrying in ${retryAfter} seconds`);

  // Wait and retry
  await sleep(retryAfter * 1000);
  return await syncEmailAccount(accountId, syncType);
}
```

#### Error Type 3: Network Error

**What happens:**

```typescript
// Network timeout or connection error
if (isNetworkError(error)) {
  if (retryCount < MAX_RETRIES) {
    const delay = RETRY_DELAYS[retryCount]; // [5s, 15s, 30s]

    console.log(
      `Network error. Retry ${retryCount + 1}/${MAX_RETRIES} in ${delay}ms`
    );

    await sleep(delay);
    return await syncInBackground(
      accountId,
      account,
      userId,
      accessToken,
      syncType,
      retryCount + 1
    );
  } else {
    // Max retries exceeded
    await db.update(emailAccounts).set({
      status: 'error',
      syncError: 'Network error. Will retry automatically.',
    });
  }
}
```

#### Error Type 4: Permission Denied (403)

**What happens:**

```typescript
// User revoked access or insufficient permissions
if (error.statusCode === 403) {
  await db.update(emailAccounts).set({
    status: 'needs_reconnection',
    syncError: 'Permission denied. Please reconnect to grant access.',
  });

  showNotification({
    title: 'Permission required',
    message: 'Please reconnect your email account to grant proper access',
    type: 'error',
    action: 'Reconnect',
  });
}
```

#### Error Type 5: Bad Request (400) - Invalid Delta Link

**What happens:**

```typescript
// Delta link/sync cursor is invalid (common after long inactivity)
if (error.statusCode === 400 && error.message.includes('delta')) {
  console.log('Invalid delta link. Resetting sync cursor.');

  // Reset sync cursor
  await db.update(emailAccounts).set({
    syncCursor: null, // Will trigger fresh sync
  });

  // Retry sync (will be treated as incremental, not initial)
  return await syncEmailAccount(accountId, 'auto');
}
```

**Expected behavior for all errors:**

- Never leave account in "syncing" state indefinitely
- Always update account status appropriately
- Log errors for debugging
- Show user-friendly error messages
- Auto-retry when appropriate
- Notify user when action is required

---

### PHASE 6: Manual User Actions

#### Action 1: User Clicks "Refresh"

**What happens:**

```typescript
// User manually triggers sync
await syncEmailAccount(accountId, 'manual');

// Same as auto-sync but:
// - Shows loading spinner in UI
// - Bypasses time-since-last-sync check
// - User sees immediate feedback
```

#### Action 2: User Removes Account

**What happens:**

```typescript
async function removeEmailAccount(accountId) {
  // 1. Revoke OAuth tokens (if OAuth account)
  if (account.provider === 'gmail' || account.provider === 'microsoft') {
    await revokeOAuthTokens(account.accessToken);
  }

  // 2. Delete all emails for this account
  await db.delete(emails).where(eq(emails.accountId, accountId));

  // 3. Delete all folders for this account
  await db.delete(emailFolders).where(eq(emailFolders.accountId, accountId));

  // 4. Delete account
  await db.delete(emailAccounts).where(eq(emailAccounts.id, accountId));

  // 5. Cancel any ongoing syncs
  // (handled by checking account existence in sync loop)
}
```

#### Action 3: User Reconnects Account

**What happens:**

```typescript
// Same as adding new account, but:
// 1. Update existing account record (don't create new)
// 2. Keep existing emails (don't delete)
// 3. Start incremental sync from last sync point (if available)
// 4. Update tokens only

await db
  .update(emailAccounts)
  .set({
    accessToken: encrypt(newAccessToken),
    refreshToken: encrypt(newRefreshToken),
    tokenExpiresAt: newExpiresAt,
    status: 'active',
    syncError: null,
  })
  .where(eq(emailAccounts.id, accountId));
```

#### Action 4: User Re-categorizes Email

**What happens:**

```typescript
async function recategorizeEmail(emailId, newCategory, userId) {
  // 1. Update email category
  await db
    .update(emails)
    .set({
      emailCategory: newCategory,
      screenedBy: 'user_override',
      screenedAt: new Date(),
    })
    .where(eq(emails.id, emailId));

  // 2. Learn from user's preference (update AI rules)
  await updateUserCategorizationRules(userId, {
    from: email.fromAddress,
    subject: email.subject,
    preferredCategory: newCategory,
  });

  // 3. Offer to re-categorize similar emails
  showNotification({
    message:
      'Would you like to categorize all emails from this sender the same way?',
    actions: ['Yes', 'No'],
  });
}
```

---

## 🎯 SUCCESS CRITERIA

### Initial Sync Complete When:

- ✅ Account status is "active"
- ✅ All folders/labels are synced
- ✅ Last 30 days of emails are stored
- ✅ Sync cursor/delta link is saved
- ✅ User sees success notification
- ✅ Emails appear in categorized folders

### Ongoing Sync Working When:

- ✅ New emails appear within 5 minutes
- ✅ Emails are AI categorized correctly
- ✅ No duplicate emails
- ✅ Sync happens silently in background
- ✅ Errors are handled gracefully
- ✅ Tokens are refreshed automatically

### System Health Indicators:

- ✅ No accounts stuck in "syncing" status
- ✅ All accounts have lastSyncAt within last 10 minutes
- ✅ Sync errors are rare (< 1% of syncs)
- ✅ Token refresh success rate > 99%
- ✅ Average sync time < 10 seconds

---

## 🔐 SECURITY REQUIREMENTS

1. **Token Storage:**
   - ✅ Encrypt all access tokens before storing
   - ✅ Encrypt all refresh tokens before storing
   - ✅ Encrypt all IMAP passwords before storing
   - ✅ Use environment-specific encryption keys
   - ✅ Rotate encryption keys periodically

2. **Token Handling:**
   - ✅ Never log tokens in plain text
   - ✅ Never return tokens in API responses
   - ✅ Refresh tokens before they expire
   - ✅ Revoke tokens when account is removed

3. **Access Control:**
   - ✅ Users can only access their own accounts
   - ✅ Users can only sync their own emails
   - ✅ Validate userId on every request
   - ✅ Use row-level security in database

---

## 📊 PERFORMANCE REQUIREMENTS

1. **Initial Sync:**
   - Target: Complete in < 5 minutes for 30 days of emails
   - Batch size: 500 emails per request
   - Rate limiting: Respect provider limits
   - Progress updates: Every 50 emails

2. **Auto Sync:**
   - Frequency: Every 5 minutes
   - Duration: < 10 seconds typical
   - New emails: < 5 second delay
   - Rate limiting: Respect provider limits

3. **Scalability:**
   - Support: 10,000+ emails per account
   - Support: 10+ accounts per user
   - Support: 1000+ concurrent users
   - Database: Index on accountId, messageId, receivedAt

---

## 🧪 TESTING CHECKLIST

### Unit Tests:

- [ ] Token encryption/decryption
- [ ] Email categorization logic
- [ ] Folder type mapping
- [ ] Error classification
- [ ] Retry logic

### Integration Tests:

- [ ] Gmail OAuth flow
- [ ] Outlook OAuth flow
- [ ] IMAP connection
- [ ] Token refresh
- [ ] Email storage
- [ ] Folder sync

### End-to-End Tests:

- [ ] Add Gmail account → Initial sync → Auto sync
- [ ] Add Outlook account → Initial sync → Auto sync
- [ ] Add IMAP account → Initial sync → Auto sync
- [ ] Handle expired token
- [ ] Handle rate limiting
- [ ] Handle network error
- [ ] Remove account
- [ ] Reconnect account

### Edge Cases:

- [ ] Account with 0 emails
- [ ] Account with 100,000+ emails
- [ ] Account with special characters in email
- [ ] Account with very long email subjects
- [ ] Concurrent syncs for same account
- [ ] Sync during token refresh
- [ ] Sync with invalid delta link

---

## 🐛 COMMON ISSUES & SOLUTIONS

### Issue 1: Sync stuck in "syncing" status

**Cause:** Background process crashed or timed out
**Solution:**

```typescript
// Add timeout to sync process
const SYNC_TIMEOUT = 10 * 60 * 1000; // 10 minutes

setTimeout(() => {
  if (account.status === 'syncing') {
    db.update(emailAccounts).set({
      status: 'error',
      syncError: 'Sync timed out. Please try again.',
    });
  }
}, SYNC_TIMEOUT);
```

### Issue 2: Duplicate emails

**Cause:** Race condition in concurrent syncs
**Solution:**

```typescript
// Use database unique constraint
await db
  .insert(emails)
  .values(emailData)
  .onConflictDoNothing({
    target: [emails.accountId, emails.messageId],
  });
```

### Issue 3: Token refresh fails repeatedly

**Cause:** Refresh token is invalid or revoked
**Solution:**

```typescript
// After 3 failed refresh attempts, require reconnection
if (refreshAttempts >= 3) {
  await db.update(emailAccounts).set({
    status: 'needs_reconnection',
  });
}
```

### Issue 4: AI categorization too slow

**Cause:** Processing too many emails at once
**Solution:**

```typescript
// Process emails in batches with delays
const BATCH_SIZE = 10;
for (let i = 0; i < emails.length; i += BATCH_SIZE) {
  const batch = emails.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map((email) => categorizeEmail(email)));
  await sleep(1000); // Small delay between batches
}
```

---

## 📝 IMPLEMENTATION NOTES FOR CURSOR

When implementing this workflow:

1. **Start with Phase 1** - Get account addition working first
2. **Then Phase 2** - Implement initial sync (without AI categorization)
3. **Then Phase 4** - Add AI categorization for new emails
4. **Then Phase 3** - Set up auto-sync
5. **Finally Phase 5** - Add comprehensive error handling

**Key principles:**

- Always update account status appropriately
- Never block user actions
- Handle errors gracefully
- Provide real-time feedback
- Prioritize security (encrypt everything)
- Log extensively for debugging

**Testing strategy:**

- Test each phase independently
- Test with real email accounts (create test accounts)
- Test error scenarios (manually trigger errors)
- Test with different email volumes
- Test concurrent operations

**Code organization:**

```
/lib/email/
  ├── oauth-handler.ts       (Phase 1)
  ├── imap-handler.ts        (Phase 1)
  ├── token-manager.ts       (Phase 1, 3, 5)
  ├── gmail-api.ts           (Phase 2, 3)
  ├── microsoft-api.ts       (Phase 2, 3)
  ├── imap-service.ts        (Phase 2, 3)
  ├── email-categorizer.ts   (Phase 4)
  ├── sync-orchestrator.ts   (Phase 2, 3, 5)
  └── error-handler.ts       (Phase 5)
```

---

## 🎉 FINAL CHECKLIST

Before considering the email sync feature complete:

- [ ] User can add Gmail account via OAuth
- [ ] User can add Outlook account via OAuth
- [ ] User can add IMAP account with credentials
- [ ] Initial sync completes successfully (30 days)
- [ ] Folders are synced correctly
- [ ] Emails are stored with all metadata
- [ ] Auto-sync runs every 5 minutes
- [ ] New emails are AI categorized
- [ ] User can manually refresh
- [ ] Token refresh works automatically
- [ ] All error types are handled gracefully
- [ ] User can reconnect accounts
- [ ] User can remove accounts
- [ ] User can re-categorize emails
- [ ] Security: All tokens are encrypted
- [ ] Performance: Sync completes in < 5 minutes
- [ ] UI: Real-time progress updates
- [ ] Testing: All tests pass
- [ ] Logging: Comprehensive logs for debugging

---

**This is your complete reference for building and testing the email sync workflow. Good luck! 🚀**
