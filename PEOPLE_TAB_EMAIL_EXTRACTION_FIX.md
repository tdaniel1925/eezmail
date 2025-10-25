# People Tab Email Extraction Fix - COMPLETE

## Problem Identified

**Root Cause**: The `PeopleTab` component was using the wrong `Email` type.

### The Issue:

```typescript
// WRONG - Was importing from store
import { Email } from '@/stores/aiPanelStore';

// Store's Email interface (simplified):
interface Email {
  id: string;
  from: string; // Simple string
  fromName?: string;
  // ...
}
```

But the actual email objects being passed were from the **database schema**, which has:

```typescript
// Database Email type (from @/db/schema):
fromAddress: jsonb('from_address').$type<EmailAddress>().notNull();

// Where EmailAddress is:
type EmailAddress = {
  email: string;
  name?: string;
};
```

## The Fix

### 1. Changed Email Type Import ✅

```typescript
// BEFORE
import { Email } from '@/stores/aiPanelStore';

// AFTER
import type { Email } from '@/db/schema';
```

### 2. Updated Email Field Extraction ✅

```typescript
// BEFORE (looking for wrong field)
const senderEmail = currentEmail?.from || '';
const senderName = currentEmail?.fromName || '';

// AFTER (correctly accessing JSONB field)
const senderEmail =
  typeof currentEmail?.fromAddress === 'object' && currentEmail?.fromAddress
    ? (currentEmail.fromAddress as any).email || ''
    : '';

const senderName =
  typeof currentEmail?.fromAddress === 'object' && currentEmail?.fromAddress
    ? (currentEmail.fromAddress as any).name || senderEmail
    : senderEmail;
```

## Why This Happened

1. **Two Different Email Types**: The codebase has two `Email` interfaces:
   - `Email` from `@/stores/aiPanelStore` - simplified version for UI state
   - `Email` from `@/db/schema` - full database type with JSONB fields

2. **Component Used Wrong Type**: `PeopleTab` was using the store's simplified `Email`, but receiving the database `Email` from `ExpandableEmailItem`

3. **Data Flow**:
   ```
   Database → ExpandableEmailItem → setCurrentEmail() → PeopleTab
   (DB Email type)                                        (Was expecting Store Email type)
   ```

## Database Email Structure

The `fromAddress` field in the database is JSONB with this structure:

```json
{
  "email": "sender@example.com",
  "name": "Sender Name"
}
```

## How Previous Emails Query Works

The API route correctly queries this JSONB field:

```typescript
sql`LOWER(${emails.fromAddress}->>'email') = LOWER(${senderEmail})`;
```

This extracts the `email` property from the JSONB object and compares it case-insensitively.

## Expected Behavior Now

With the fix, the logs should now show:

```
[PeopleTab] Current email fromAddress: { email: "sender@example.com", name: "Sender Name" }
[PeopleTab] Extracted senderEmail: sender@example.com
[PeopleTab] Extracted senderName: Sender Name
[PeopleTab] Fetching emails for sender: sender@example.com, offset: 0
```

And the API should find emails:

```
[Sender Emails API] Fetching emails for: sender@example.com, offset: 0
[Sender Emails API] Found 1 user account(s)
[Sender Emails API] Found X email(s) from sender@example.com
```

## Files Modified

- `src/components/ai/tabs/PeopleTab.tsx`
  - Changed import from `@/stores/aiPanelStore` to `@/db/schema`
  - Updated `senderEmail` and `senderName` extraction to use `fromAddress` JSONB field
  - Updated console logs to show correct field

## Testing

1. Select any email in the inbox
2. Open the People tab
3. Check browser console - should now show:
   - `fromAddress` object with email and name
   - Extracted email address
   - Extracted sender name
4. Previous emails should load from that sender

## Status

✅ **FIX COMPLETE**  
✅ **NO LINTING ERRORS**  
✅ **READY TO TEST**

The People tab should now correctly identify the sender's email address and fetch all previous emails from that sender!
