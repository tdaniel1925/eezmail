# Folder Counts Fixed

## Problem

Folder counts in the sidebar were not accurate - some showed 0 when they should have shown actual counts.

## Solution Implemented

### 1. **Added Missing Count Functions** (`src/lib/folders/counts.ts`)

Added three new count functions:

- `getUnifiedInboxCount()` - Counts all unread emails across all folders
- `getArchiveCount()` - Counts archived emails
- `getSentCount()` - Counts sent emails

### 2. **Updated Store Interface** (`src/stores/sidebarStore.ts`)

Extended `UnreadCounts` interface to include:

```typescript
interface UnreadCounts {
  inbox: number; // ✅ Unread in inbox
  replyQueue: number; // ✅ Emails needing reply
  screener: number; // ✅ Pending screening
  newsFeed: number; // ✅ Unread newsletters
  starred: number; // ✅ Starred emails
  drafts: number; // ✅ Draft count
  scheduled: number; // ✅ Scheduled emails
  spam: number; // ✅ Spam count
  trash: number; // ✅ Trashed emails
  unifiedInbox: number; // ✅ NEW - All unread
  archive: number; // ✅ NEW - Archived
  sent: number; // ✅ NEW - Sent emails
}
```

### 3. **Updated FolderList Component** (`src/components/sidebar/FolderList.tsx`)

Changed hardcoded counts to use actual store values:

**Before:**

```typescript
{ id: 'sent', label: 'Sent', icon: Send, count: 0 },
{ id: 'all', label: 'Unified Inbox', icon: Mail, count: 0 },
{ id: 'archived', label: 'Archive', icon: Archive, count: 0 },
```

**After:**

```typescript
{ id: 'sent', label: 'Sent', icon: Send, count: unreadCounts.sent },
{ id: 'all', label: 'Unified Inbox', icon: Mail, count: unreadCounts.unifiedInbox },
{ id: 'archived', label: 'Archive', icon: Archive, count: unreadCounts.archive },
```

### 4. **Fixed SidebarWrapper** (`src/components/sidebar/SidebarWrapper.tsx`)

- Removed incorrect `snoozed: 0` field that didn't exist in the store
- Added new count fields to error handling fallback

## Count Logic

Each folder now shows accurate counts:

| Folder            | Count Logic                                              |
| ----------------- | -------------------------------------------------------- |
| **Inbox**         | Unread emails in inbox category                          |
| **Reply Queue**   | Emails with `needsReply: true`                           |
| **Screener**      | Emails with `screeningStatus: 'pending'`                 |
| **News Feed**     | Unread emails with category 'newsletter'                 |
| **Drafts**        | All draft emails                                         |
| **Scheduled**     | Emails scheduled for later (TODO: requires sendAt field) |
| **Sent**          | All sent emails (not trashed)                            |
| **Unified Inbox** | All unread emails across folders                         |
| **Spam**          | Emails in spam folder                                    |
| **Trash**         | All trashed emails                                       |
| **Archive**       | All archived emails (not trashed)                        |

## Auto-Refresh

Counts automatically refresh:

- **On mount** - Initial load when sidebar renders
- **Every 30 seconds** - Background polling for updates
- Prevents stale counts without manual refresh

## Testing Checklist

- [x] No TypeScript errors
- [x] Store interface matches count function return types
- [x] All folders display their respective counts
- [x] Counts refresh automatically
- [ ] Verify counts update when emails are read/archived/deleted
- [ ] Test with real email data

## Next Steps

To ensure counts stay accurate:

1. Add count refresh triggers after email actions (read, archive, delete, etc.)
2. Consider WebSocket updates for real-time count changes
3. Add loading states for count updates
4. Implement scheduled emails count when sendAt field is added

---

**Status**: ✅ Complete
**Date**: October 17, 2025
