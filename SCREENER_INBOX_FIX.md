# Screener to Inbox Fix

## Issue Description

When an email was moved from the screener to inbox (or other categories), it was not appearing in the inbox email list.

## Root Cause

The issue was a mismatch between the database fields being updated and the fields being queried:

### What Was Happening:

1. **Screener Action** (`src/lib/screener/actions.ts`):
   - When screening an email, only the `folderName` field was being updated
   - Example: `folderName: 'inbox'`

2. **Inbox Query** (`src/lib/email/get-emails.ts`):
   - The inbox fetches emails using the `emailCategory` field
   - Query: `eq(emails.emailCategory, 'inbox')`

### The Problem:

- Screener was updating `folderName` ✅
- Inbox was querying `emailCategory` ❌
- **Result**: Emails never appeared in inbox!

## The Fix

Updated both `screenEmail` and `bulkScreenEmails` functions in `src/lib/screener/actions.ts` to update BOTH fields:

```typescript
await db
  .update(emails)
  .set({
    folderName: folderName, // ✅ Updated
    emailCategory: emailCategory, // ✅ NEW - Now updates this too!
    screeningStatus: 'screened', // ✅ Properly marks as screened
    screenedAt: new Date(),
    screenedBy: 'user',
  })
  .where(eq(emails.id, emailId));
```

## Database Schema

The `emails` table has two separate fields:

- **`folderName`** (text): The actual folder from the email provider (INBOX, Sent, etc.)
- **`emailCategory`** (enum): The app's categorization system:
  - `'unscreened'` - New emails pending screening
  - `'inbox'` - Primary emails
  - `'newsfeed'` - Newsletters and updates
  - `'receipts'` - Order confirmations and receipts
  - `'spam'` - Spam emails
  - `'archived'` - Archived emails

## Files Modified

- **`src/lib/screener/actions.ts`**:
  - Updated `screenEmail()` function
  - Updated `bulkScreenEmails()` function
  - Both now set `emailCategory` in addition to `folderName`
  - Added `screeningStatus: 'screened'` to properly mark emails

## Testing

To test the fix:

1. Go to `/dashboard/screener`
2. Select an email to move to inbox
3. Click "Move to Inbox" or similar action
4. Navigate to `/dashboard/inbox`
5. ✅ The email should now appear in the inbox list

## User Flow

```
Screener Page
    ↓ (User clicks "Move to Inbox")
screenEmail(emailId, 'inbox')
    ↓
Updates email:
  - folderName: 'inbox'
  - emailCategory: 'inbox'  ← Fixed!
  - screeningStatus: 'screened'
    ↓
Navigate to Inbox Page
    ↓
getInboxEmails()
  → Queries: emailCategory = 'inbox'
    ↓
✅ Email appears in inbox list!
```

## Additional Notes

- The fix maintains backward compatibility
- All existing emails in the database are unaffected
- The fix applies to all screening decisions (inbox, newsfeed, receipts, spam)
- Page revalidation ensures immediate UI updates

## Related Functions

- `getInboxEmails()` - `src/lib/email/get-emails.ts`
- `getEmailsByCategory()` - `src/lib/email/get-emails.ts`
- `AutoSyncScreener` - `src/components/email/AutoSyncScreener.tsx`
- `processScreenerDecision()` - `src/lib/screener/routing.ts` (separate Hey-style workflow)
