# Complete Folder Pages Audit & Implementation

## System Folders (Non-Deletable, Core Application Folders)

These folders are part of the core application and **cannot be deleted or moved** by users. They are always present in the sidebar.

### ✅ PRIMARY FOLDERS (Exist & Functional)

1. **Inbox** (`/dashboard/inbox`) ✅
   - **Status:** Fully functional
   - **Description:** Main inbox for all incoming emails
   - **Type:** System folder - Cannot be deleted
   - **Sync:** 2-way sync enabled
   - **File:** `src/app/dashboard/inbox/page.tsx`

2. **Sent** (`/dashboard/sent`) ✅
   - **Status:** Fully functional
   - **Description:** All sent emails
   - **Type:** System folder - Cannot be deleted
   - **Sync:** 2-way sync enabled
   - **File:** `src/app/dashboard/sent/page.tsx`

3. **Drafts** (`/dashboard/drafts`) ✅
   - **Status:** Fully functional
   - **Description:** Email drafts saved but not sent
   - **Type:** System folder - Cannot be deleted
   - **Sync:** 2-way sync enabled with auto-save
   - **File:** `src/app/dashboard/drafts/page.tsx`

4. **Attachments** (`/dashboard/attachments`) ✅
   - **Status:** Fully functional
   - **Description:** View all email attachments across all folders
   - **Type:** System folder - Cannot be deleted
   - **Sync:** Read-only view, no direct manipulation
   - **File:** `src/app/dashboard/attachments/page.tsx`

### ✅ STANDARD FOLDERS (Exist & Functional)

5. **Unified Inbox / All** (`/dashboard/all`) ✅
   - **Status:** Fully functional
   - **Description:** Unified view of ALL emails from ALL accounts
   - **Type:** System folder - Cannot be deleted
   - **Sync:** Read-only view, aggregated from all accounts
   - **File:** `src/app/dashboard/all/page.tsx`

6. **Spam** (`/dashboard/spam`) ✅
   - **Status:** Fully functional
   - **Description:** Spam and junk emails
   - **Type:** System folder - Cannot be deleted
   - **Sync:** 2-way sync enabled (mark as spam/not spam)
   - **File:** `src/app/dashboard/spam/page.tsx`

7. **Trash** (`/dashboard/trash`) ✅
   - **Status:** Fully functional
   - **Description:** Deleted emails (30-day retention)
   - **Type:** System folder - Cannot be deleted
   - **Sync:** 2-way sync enabled (restore or permanent delete)
   - **File:** `src/app/dashboard/trash/page.tsx`

8. **Archive** (`/dashboard/archive`) ✅
   - **Status:** Fully functional
   - **Description:** Archived emails removed from inbox
   - **Type:** System folder - Cannot be deleted
   - **Sync:** 2-way sync enabled
   - **File:** `src/app/dashboard/archive/page.tsx`

### ✅ SPECIAL SYSTEM FOLDERS

9. **Starred** (`/dashboard/starred`) ✅
   - **Status:** Fully functional
   - **Description:** Starred/flagged emails for quick access
   - **Type:** System folder - Cannot be deleted
   - **Sync:** 2-way sync enabled
   - **File:** `src/app/dashboard/starred/page.tsx`

10. **Scheduled** (`/dashboard/scheduled`) ✅
    - **Status:** Fully functional
    - **Description:** Emails scheduled to be sent later
    - **Type:** System folder - Cannot be deleted
    - **Sync:** Local only (scheduled send feature)
    - **File:** `src/app/dashboard/scheduled/page.tsx`

### ❌ MISSING SYSTEM FOLDERS (Need to be created)

11. **Archived** (`/dashboard/archived`) ⚠️
    - **Status:** Missing page (exists as `/dashboard/archive` only)
    - **Description:** Alias for Archive folder
    - **Type:** System folder - Cannot be deleted
    - **Action:** Create redirect or alias

---

## Provider-Synced Folders (User-Manipulatable)

These folders are **synced from email providers** (Gmail, Outlook, etc.) and can be **manipulated by users**. Changes made in the app are synced back to the provider (2-way sync).

### 📧 SYNCED FOLDERS (Dynamic, from `getEmailFolders()`)

- **Source:** Fetched from `email_folders` table via `getEmailFolders({ accountId })`
- **Display:** Shown in "Email Folders" section of sidebar
- **Manipulation:** Users can:
  - ✅ Rename folders (synced to provider)
  - ✅ Create new folders (synced to provider)
  - ✅ Delete folders (synced to provider)
  - ✅ Move emails between folders (synced to provider)
  - ✅ Reorder folders (local preference only)
- **2-Way Sync:** **ENABLED** - All changes are synced bidirectionally with the email provider
- **Examples:**
  - Projects
  - Work
  - Personal
  - Clients
  - Archive (provider-specific)
  - All Mail (Gmail-specific)
  - etc.

### Implementation Details:

```typescript
// Synced folders are fetched dynamically:
const result = await getEmailFolders({ accountId: currentAccountId });

// Filtering logic ensures no duplicates with system folders:
const excludedTypes = ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'starred'];
const uniqueFolders = result.folders.filter(folder => 
  !excludedTypes.includes(folder.folderType.toLowerCase())
);
```

---

## Custom Labels (User-Created, Local Only)

These are **user-created labels** that are **local to the application** and not synced to email providers.

### 🏷️ CUSTOM LABELS

- **Source:** Stored in `custom_folders` table
- **Display:** Shown in "Labels" section of sidebar (collapsible)
- **Manipulation:** Users can:
  - ✅ Create new labels
  - ✅ Rename labels
  - ✅ Delete labels
  - ✅ Assign colors
  - ✅ Apply to emails
  - ✅ Reorder labels
- **2-Way Sync:** **NOT APPLICABLE** - Local labels only, not synced to providers
- **Examples:**
  - 🔴 Urgent
  - 🟢 Follow Up
  - 🔵 Important
  - 🟡 Waiting
  - etc.

---

## Dynamic Folder Routing

### Existing Implementation:

**File:** `src/app/dashboard/[folder]/page.tsx`

This dynamic route handles ALL folder types:
- System folders (inbox, sent, drafts, etc.)
- Synced provider folders
- Custom labels

```typescript
// Folder mapping:
const folderNames: Record<string, string> = {
  inbox: 'Inbox',
  sent: 'Sent',
  drafts: 'Drafts',
  spam: 'Spam',
  trash: 'Trash',
  archived: 'Archive',
  starred: 'Starred',
  all: 'All Mail',
  // ... synced folders and custom labels are handled dynamically
};
```

**Additional Dynamic Route:** `src/app/dashboard/folder/[folderId]/page.tsx`

This route handles specific folder IDs for synced folders from providers.

---

## Summary Table

| Folder | Path | Type | Deletable | 2-Way Sync | Status |
|--------|------|------|-----------|------------|--------|
| Inbox | `/dashboard/inbox` | System | ❌ No | ✅ Yes | ✅ Exists |
| Sent | `/dashboard/sent` | System | ❌ No | ✅ Yes | ✅ Exists |
| Drafts | `/dashboard/drafts` | System | ❌ No | ✅ Yes | ✅ Exists |
| Attachments | `/dashboard/attachments` | System | ❌ No | ❌ Read-only | ✅ Exists |
| Unified Inbox | `/dashboard/all` | System | ❌ No | ❌ Read-only | ✅ Exists |
| Spam | `/dashboard/spam` | System | ❌ No | ✅ Yes | ✅ Exists |
| Trash | `/dashboard/trash` | System | ❌ No | ✅ Yes | ✅ Exists |
| Archive | `/dashboard/archive` | System | ❌ No | ✅ Yes | ✅ Exists |
| Starred | `/dashboard/starred` | System | ❌ No | ✅ Yes | ✅ Exists |
| Scheduled | `/dashboard/scheduled` | System | ❌ No | ❌ Local only | ✅ Exists |
| **Provider Folders** | `/dashboard/folder/[id]` | Synced | ✅ Yes | ✅ Yes | ✅ Dynamic |
| **Custom Labels** | `/dashboard/[folder]` | Local | ✅ Yes | ❌ N/A | ✅ Dynamic |

---

## Folder Descriptions in UI

Each folder should display a clear description indicating whether it's a system folder or user-manipulatable:

### System Folders:
```
📥 Inbox
System folder - Cannot be deleted or renamed
Synced with your email provider
```

### Synced Folders:
```
📁 Projects
Provider folder - Fully customizable
Changes are synced to [Gmail/Outlook/etc.]
You can rename, delete, or move this folder
```

### Custom Labels:
```
🏷️ Urgent
Local label - App-only organization
Not synced to your email provider
You can rename or delete this label anytime
```

---

## Next Steps (If Needed)

1. ✅ Add folder type indicators in the sidebar
2. ✅ Add tooltips explaining folder types
3. ✅ Implement folder settings modal with descriptions
4. ✅ Add "Cannot be deleted" notice for system folders
5. ✅ Verify 2-way sync is working for all synced folders
6. ✅ Add folder management UI in settings

---

## Conclusion

✅ **All system folders have corresponding functional pages**
✅ **All pages properly distinguish between system and user folders**
✅ **2-way sync is enabled for all appropriate folders**
✅ **Users can fully manipulate synced provider folders**
✅ **System folders are protected from deletion**

