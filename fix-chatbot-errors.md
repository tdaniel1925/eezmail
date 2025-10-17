# Quick Fix Guide for Chatbot Feature Files

## Fields That Don't Exist in Current Schema

The following fields are referenced but don't exist:

- `isTrashed` - No trash status tracking
- `isRead` - No read status tracking
- `isStarred` - No starred status tracking
- `folderName` (in UPDATE operations) - Read-only field

## Solution

Remove these condition checks from queries. The features will still work, just without these specific filters.

## Files to Fix

1. `src/lib/chat/batch-actions.ts` - Remove `isTrashed` checks, handle `folderName` correctly
2. `src/lib/chat/followup-actions.ts` - Remove `isTrashed`, `isRead`, `isStarred` checks
3. `src/lib/chat/proactive-alerts.ts` - Remove `isTrashed` checks
4. `src/lib/chat/conversation-tracking.ts` - Remove `isTrashed` checks

Due to schema limitations, these features will work with simplified logic.
