# Automatic Sync & Server-Side Changes - Status & Implementation Plan

## Current Status

### 1. Automatic Sync - ✅ IMPLEMENTED (But Not Fully Active)

**Good News:** Background sync IS implemented!

**How it works:**

- **Real-time sync**: Every 30 seconds for new emails
- **Historical sync**: Every 1 minute for older emails
- Located in: `src/lib/sync/sync-modes.ts`

**The Problem:** It's not being started automatically for all users.

**Current Implementation:**

```typescript
// src/components/sync/AutoSyncStarter.tsx
// This component SHOULD start sync automatically
export function AutoSyncStarter({ accounts }) {
  useEffect(() => {
    accounts.forEach(async (account) => {
      await startDualModeSync(account.id);
      // Starts 30-second real-time sync
      // Starts 1-minute historical sync
    });
  }, [accounts]);
}
```

**Issue:** This component might not be mounted in the main layout.

---

### 2. Server-Side Changes - ❌ NOT IMPLEMENTED

**Critical Missing Feature:**

When you delete/move/mark emails in the app, it only updates the **local database**. It does NOT sync back to the email server!

**Current Implementation:**

```typescript:src/lib/email/email-actions.ts:44-69
export async function deleteEmail(emailId: string, permanent = false) {
  // Only deletes from LOCAL database
  await bulkDeleteEmails({
    userId: user.id,
    emailIds: [emailId],
    permanent,
  });

  // ❌ MISSING: Delete from email server (Gmail/Microsoft/IMAP)
}
```

**What this means:**

- Delete email in app → ❌ Still on server (Gmail/Outlook)
- Move email in app → ❌ Server doesn't know
- Mark as read/unread → ❌ Server not updated
- Archive email → ❌ Server not updated

---

## Required Fixes

### Fix 1: Ensure Automatic Sync Starts

**Option A: Add to Dashboard Layout**

```typescript:src/app/dashboard/layout.tsx
import { AutoSyncStarter } from '@/components/sync/AutoSyncStarter';
import { getUserEmailAccounts } from '@/lib/settings/account-actions';

export default async function DashboardLayout({ children }) {
  const accountsResult = await getUserEmailAccounts();
  const accounts = accountsResult.success ? accountsResult.accounts : [];

  return (
    <>
      {/* Start automatic sync for all accounts */}
      <AutoSyncStarter accounts={accounts} />

      {/* Rest of layout */}
      {children}
    </>
  );
}
```

**Option B: Start in OAuth Callbacks**

```typescript:src/app/api/auth/google/callback/route.ts
// After successfully connecting account
await startDualModeSync(newAccount.id);
```

**Option C: Start on Login**

```typescript
// When user logs in, start sync for all their accounts
const accounts = await getUserEmailAccounts();
for (const account of accounts) {
  await startDualModeSync(account.id);
}
```

---

### Fix 2: Implement Server-Side Sync for Email Actions

This is the BIG one. We need to update the email server when users take actions in the app.

#### 2.1 Delete Email (Sync to Server)

**Current:**

```typescript
// Only deletes locally
await db.delete(emails).where(eq(emails.id, emailId));
```

**Fix Needed:**

```typescript
export async function deleteEmail(emailId: string, permanent = false) {
  // 1. Get email and account details
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });

  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.id, email.accountId),
  });

  // 2. Delete from local database
  await db.delete(emails).where(eq(emails.id, emailId));

  // 3. Delete from email server
  try {
    if (account.provider === 'microsoft') {
      await deleteMicrosoftEmail(account, email.messageId);
    } else if (account.provider === 'gmail') {
      await deleteGmailEmail(account, email.messageId);
    } else if (account.provider === 'imap') {
      await deleteImapEmail(account, email.messageId);
    }
  } catch (error) {
    console.error('Failed to delete from server:', error);
    // Email deleted locally but not on server
    // Could queue for retry or notify user
  }
}

// Helper functions
async function deleteMicrosoftEmail(account, messageId) {
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete from Microsoft');
  }
}

async function deleteGmailEmail(account, messageId) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to delete from Gmail');
  }
}

async function deleteImapEmail(account, messageId) {
  const imap = new ImapService({
    user: account.imapUsername,
    password: account.imapPassword,
    host: account.imapHost,
    port: account.imapPort,
    tls: account.imapUseSsl,
  });

  await imap.deleteMessage(messageId);
}
```

#### 2.2 Move Email (Sync to Server)

```typescript
export async function moveEmail(emailId: string, targetFolder: string) {
  // 1. Get email and account
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });

  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.id, email.accountId),
  });

  // 2. Update local database
  await db
    .update(emails)
    .set({ folderName: targetFolder })
    .where(eq(emails.id, emailId));

  // 3. Move on server
  try {
    if (account.provider === 'microsoft') {
      await moveMicrosoftEmail(account, email.messageId, targetFolder);
    } else if (account.provider === 'gmail') {
      await moveGmailEmail(account, email.messageId, targetFolder);
    } else if (account.provider === 'imap') {
      await moveImapEmail(account, email.messageId, targetFolder);
    }
  } catch (error) {
    console.error('Failed to move on server:', error);
  }
}
```

#### 2.3 Mark as Read/Unread (Sync to Server)

```typescript
export async function markEmailAsRead(emailId: string, isRead: boolean) {
  // 1. Update local database
  await db.update(emails).set({ isRead }).where(eq(emails.id, emailId));

  // 2. Update on server
  const email = await db.query.emails.findFirst({
    where: eq(emails.id, emailId),
  });

  const account = await db.query.emailAccounts.findFirst({
    where: eq(emailAccounts.id, email.accountId),
  });

  try {
    if (account.provider === 'microsoft') {
      await updateMicrosoftEmailReadStatus(account, email.messageId, isRead);
    } else if (account.provider === 'gmail') {
      await updateGmailEmailReadStatus(account, email.messageId, isRead);
    } else if (account.provider === 'imap') {
      await updateImapEmailReadStatus(account, email.messageId, isRead);
    }
  } catch (error) {
    console.error('Failed to update read status on server:', error);
  }
}
```

---

## Implementation Priority

### High Priority (Must Have)

1. **Auto-start sync on login** ✅ Easy fix
2. **Delete syncs to server** ⚠️ Critical for UX
3. **Mark read/unread syncs to server** ⚠️ Critical for UX

### Medium Priority (Should Have)

4. **Move/archive syncs to server**
5. **Star/flag syncs to server**

### Low Priority (Nice to Have)

6. **Retry queue for failed server operations**
7. **Offline mode with sync when online**

---

## Recommended Implementation Order

### Phase 1: Auto-Sync (30 minutes)

1. Add `AutoSyncStarter` to dashboard layout
2. Test that sync starts automatically
3. Verify 30-second real-time sync works
4. Verify 1-minute historical sync works

### Phase 2: Server-Side Delete (2 hours)

1. Implement `deleteMicrosoftEmail()`
2. Implement `deleteGmailEmail()`
3. Implement `deleteImapEmail()`
4. Update `deleteEmail()` action to call server delete
5. Test with all three providers

### Phase 3: Server-Side Read/Unread (1 hour)

1. Implement `updateMicrosoftEmailReadStatus()`
2. Implement `updateGmailEmailReadStatus()`
3. Implement `updateImapEmailReadStatus()`
4. Update `markAsRead()` action
5. Test with all three providers

### Phase 4: Server-Side Move (1.5 hours)

1. Implement `moveMicrosoftEmail()`
2. Implement `moveGmailEmail()`
3. Implement `moveImapEmail()`
4. Update `moveEmail()` action
5. Test with all three providers

---

## Testing Checklist

### Auto-Sync

- [ ] Log in → Verify sync starts automatically
- [ ] Wait 30 seconds → Verify new emails appear
- [ ] Check console logs → Verify "Real-time sync" and "Historical sync" messages

### Server-Side Delete

- [ ] Delete email in app → Check Gmail/Outlook web → Email deleted ✅
- [ ] Delete email in app → Next sync → Email stays deleted ✅
- [ ] Delete from web → Next sync → Email removed from app ✅

### Server-Side Read/Unread

- [ ] Mark as read in app → Check web → Marked as read ✅
- [ ] Mark as unread in app → Check web → Marked as unread ✅
- [ ] Mark as read on web → Next sync → Marked as read in app ✅

### Server-Side Move

- [ ] Move to folder in app → Check web → Email moved ✅
- [ ] Move to folder on web → Next sync → Email moved in app ✅

---

## API Documentation

### Microsoft Graph API

**Delete:**

```
DELETE https://graph.microsoft.com/v1.0/me/messages/{messageId}
```

**Update (Read/Unread):**

```
PATCH https://graph.microsoft.com/v1.0/me/messages/{messageId}
{
  "isRead": true
}
```

**Move:**

```
POST https://graph.microsoft.com/v1.0/me/messages/{messageId}/move
{
  "destinationId": "folderId"
}
```

### Gmail API

**Delete (Trash):**

```
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}/trash
```

**Delete (Permanent):**

```
DELETE https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}
```

**Modify Labels:**

```
POST https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}/modify
{
  "addLabelIds": ["UNREAD"],
  "removeLabelIds": []
}
```

### IMAP

**Delete:**

```typescript
imap.addFlags(messageId, '\\Deleted');
imap.expunge();
```

**Mark Read:**

```typescript
imap.addFlags(messageId, '\\Seen');
```

**Mark Unread:**

```typescript
imap.delFlags(messageId, '\\Seen');
```

**Move:**

```typescript
imap.move(messageId, targetFolder);
```

---

## File Structure for Implementation

```
src/lib/email/
├── server-sync/
│   ├── microsoft-sync.ts    ← Microsoft Graph server operations
│   ├── gmail-sync.ts         ← Gmail API server operations
│   ├── imap-sync.ts          ← IMAP server operations
│   └── index.ts              ← Unified interface
└── email-actions.ts          ← Updated to use server-sync

```

---

## Summary

**Your Expectations:**

1. ✅ Never need to manually sync → **Partially working, needs activation**
2. ❌ Delete/move in app = delete/move on server → **NOT implemented yet**

**Current Reality:**

1. ⚠️ Manual sync often required (auto-sync not starting)
2. ❌ Actions only affect local database, not email server

**Fixes Needed:**

1. 🟢 **Easy**: Enable auto-sync (30 minutes)
2. 🔴 **Critical**: Implement server-side operations (4-5 hours)

**Estimated Total Time:** 5-6 hours of development work

Would you like me to implement these fixes?


