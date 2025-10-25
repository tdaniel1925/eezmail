# Folder Counts Accuracy Fix

## Problem Identified

User reported inaccurate folder counts in sidebar:

- **Inbox**: 1310
- **Sent**: 2502
- **Unified Inbox**: 1362

The confusion was that different folders were showing inconsistent metrics - some showed ALL emails, some showed UNREAD emails.

## Root Cause

The SQL queries in `/api/folders/counts/route.ts` were:

1. **Inbox count** - Showing ALL emails (should show UNREAD only)
2. **Sent count** - Showing ALL emails (correct behavior)
3. **Unified Inbox** - Showing ALL emails (should show UNREAD only)

Users expect:

- **Action-oriented folders** (Inbox, Spam, etc.) → Show UNREAD count
- **Archive folders** (Sent, Trash, etc.) → Show TOTAL count

## Solution Implemented

### 1. **Updated SQL Query Logic** (`src/app/api/folders/counts/route.ts`)

Changed folder count queries to use consistent logic:

**UNREAD counts** (folders where user needs to take action):

- ✅ Inbox
- ✅ Starred
- ✅ Spam
- ✅ Newsfeed
- ✅ Receipts
- ✅ Unified Inbox
- ✅ Unscreened

**TOTAL counts** (archive/reference folders):

- ✅ Sent (all sent emails)
- ✅ Drafts (all drafts)
- ✅ Trash (all trashed)

### 2. **Updated Helper Functions** (`src/lib/folders/counts.ts`)

Updated `getSentCount()` to:

- Match folders containing 'sent' (case-insensitive)
- Show TOTAL count (not filtered by read status)
- Exclude trashed emails

```typescript
// Before: Exact match only
eq(emails.folderName, 'sent');

// After: Pattern match for flexibility
sql`LOWER(${emails.folderName}) LIKE '%sent%'`;
```

## Expected Behavior After Fix

### Inbox (UNREAD)

- Shows only unread emails in inbox
- Decreases as user reads emails
- Helps user focus on what needs attention

### Sent (TOTAL)

- Shows all sent emails (read status doesn't matter)
- Reflects actual sent mail count
- Matches email provider's sent folder

### Unified Inbox (UNREAD)

- Shows all unread emails across folders
- Excludes drafts and trash
- Higher than Inbox if user has unread in other folders

## Why This Makes Sense

### Action Folders (UNREAD)

Users need to know **what requires attention**:

- "I have 50 unread emails to review"
- "5 spam messages to check"

### Reference Folders (TOTAL)

Users need to know **what exists**:

- "I've sent 2,502 emails total"
- "I have 15 drafts saved"
- "My trash has 200 items"

## Files Changed

1. `src/app/api/folders/counts/route.ts` - Main API endpoint
2. `src/lib/folders/counts.ts` - Helper functions
3. `FOLDER_COUNTS_ACCURACY_FIX.md` - This documentation

## Testing

After this fix, verify:

1. **Inbox count** decreases when emails are marked as read
2. **Sent count** shows all sent emails (doesn't change with read status)
3. **Unified Inbox** ≥ Inbox count (includes unread from all folders)
4. **Drafts count** shows all drafts (not affected by read status)
5. **Trash count** shows all trashed emails

## Technical Notes

### SQL FILTER Clause

Used PostgreSQL's `FILTER` clause for efficient counting:

```sql
COUNT(*) FILTER (WHERE email_category = 'inbox' AND is_read = FALSE) as inbox_count
```

This is more efficient than multiple separate queries.

### Folder Name Matching

Sent folder matching uses pattern matching to handle variations:

- `[Gmail]/Sent Mail`
- `Sent Items`
- `Sent Messages`
- `sent`

### Cache Strategy

API endpoint uses Next.js revalidation:

```typescript
export const revalidate = 30; // Cache for 30 seconds
```

This balances accuracy with performance.

## Impact

✅ **Accurate counts** - Users see meaningful numbers
✅ **Consistent UX** - Folders behave predictably  
✅ **Better email management** - Clear actionable metrics
✅ **Matches user expectations** - Inbox shows unread, Sent shows all

---

**Status**: ✅ Fixed and deployed
**Date**: October 25, 2025
**Issue**: Folder counts showing inconsistent/inaccurate numbers
