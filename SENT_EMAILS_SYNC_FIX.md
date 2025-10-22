# Sent Emails Not Syncing - Fix Documentation

## Problem Identified

**Sent emails are not syncing because all providers only sync from the INBOX folder.**

### Current Issues

#### 1. Microsoft Graph (Line 467)

```typescript
currentUrl =
  'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta...';
```

❌ **Only syncing from `inbox` folder**

#### 2. IMAP (Line 1155)

```typescript
const messages = await imap.fetchMessages('INBOX', 50);
```

❌ **Only syncing from `INBOX`**

#### 3. Gmail

Similar issue - needs verification and fix

## Solution

### Option 1: Sync All Folders (Recommended)

Modify each provider to sync from multiple folders:

- Inbox
- Sent Items / Sent
- Drafts
- Archive
- Trash

### Option 2: Sync Specific Folders

Only sync important folders:

- Inbox
- Sent Items / Sent

## Implementation Plan

### For Microsoft Graph

**Current Code:**

```typescript:src/lib/sync/email-sync-service.ts:467
currentUrl =
  'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$top=100...';
```

**Fix: Sync from all folders or use messages endpoint**

**Option A: Sync all folders individually**

```typescript
// Get all folders
const foldersResponse = await fetch(
  'https://graph.microsoft.com/v1.0/me/mailFolders',
  { headers: { Authorization: `Bearer ${accessToken}` } }
);
const folders = await foldersResponse.json();

// Sync each folder
for (const folder of folders.value) {
  await syncFolderMessages(folder.id, folderName);
}
```

**Option B: Use root messages endpoint (Better)**

```typescript
// This gets ALL messages across ALL folders
currentUrl =
  'https://graph.microsoft.com/v1.0/me/messages/delta?$top=100&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,hasAttachments,parentFolderId';
```

### For IMAP

**Current Code:**

```typescript:src/lib/sync/email-sync-service.ts:1153-1155
// Step 2: Sync messages from INBOX
console.log('📧 Step 2: Syncing IMAP messages from INBOX...');
const messages = await imap.fetchMessages('INBOX', 50);
```

**Fix: Sync from multiple folders**

```typescript
// Step 2: Sync messages from all folders
const foldersToSync = ['INBOX', 'Sent', 'Drafts'];

for (const folderName of foldersToSync) {
  console.log(`📧 Syncing IMAP messages from ${folderName}...`);
  try {
    const messages = await imap.fetchMessages(folderName, 50);
    // Process messages...
  } catch (error) {
    console.error(`Failed to sync ${folderName}:`, error);
    // Continue with next folder
  }
}
```

### For Gmail

**Current Code:** Need to check Gmail sync implementation

**Fix: Include all labels**

```typescript
// Sync messages from all labels, not just INBOX
const labelsToSync = ['INBOX', 'SENT', 'DRAFT', 'TRASH', 'SPAM'];

for (const label of labelsToSync) {
  await syncGmailLabel(label);
}
```

## Recommended Implementation

### 1. Microsoft Graph - Use Root Messages Endpoint

**Change line 467 from:**

```typescript
'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages/delta?$top=100...';
```

**To:**

```typescript
'https://graph.microsoft.com/v1.0/me/messages/delta?$top=100&$select=id,subject,from,receivedDateTime,isRead,bodyPreview,hasAttachments,parentFolderId';
```

**Why?** This endpoint returns ALL messages from ALL folders in a single delta query. Much more efficient!

### 2. IMAP - Loop Through Important Folders

**Replace lines 1153-1255 with:**

```typescript
// Step 2: Sync messages from multiple folders
const foldersToSync = ['INBOX', 'Sent', 'Drafts'];
let totalSyncedCount = 0;

for (const folderName of foldersToSync) {
  console.log(
    `📧 Step 2.${foldersToSync.indexOf(folderName) + 1}: Syncing IMAP messages from ${folderName}...`
  );

  try {
    const messages = await imap.fetchMessages(folderName, 50);

    for (const message of messages) {
      // ... existing message processing code
      totalSyncedCount++;
    }

    console.log(`✅ Synced ${messages.length} messages from ${folderName}`);
  } catch (error) {
    console.error(`❌ Failed to sync ${folderName}:`, error);
    // Continue with next folder
  }
}

console.log(`✅ Total IMAP messages synced: ${totalSyncedCount}`);
```

### 3. Gmail - Sync All Labels

Update Gmail sync to fetch from multiple labels, not just INBOX.

## Benefits

✅ **Sent emails will sync**
✅ **Drafts will sync**
✅ **All folders accessible**
✅ **Better user experience**
✅ **Complete email history**

## Performance Considerations

- **Microsoft**: Using `/me/messages/delta` is actually MORE efficient than multiple folder queries
- **IMAP**: Slight increase in sync time, but necessary for completeness
- **Gmail**: Already efficient with label-based system

## Testing Plan

1. Connect a Microsoft account → Verify sent emails appear
2. Connect an IMAP account → Verify sent emails appear
3. Connect a Gmail account → Verify sent emails appear
4. Check sync performance
5. Verify folder categorization works correctly

## Migration Notes

- Existing synced emails won't be affected
- Next sync will fetch sent emails
- Users may see a one-time spike in synced email count
- Folder mapping should handle sent items correctly

---

**Status**: 🔧 Ready to implement

**Priority**: High - Users expect to see their sent emails

**Estimated Time**: 30-60 minutes


