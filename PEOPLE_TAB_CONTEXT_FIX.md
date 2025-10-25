# People Tab - Previous Emails Fix

## Issue

The "People" tab was showing "0 Previous Emails" even though the search box correctly found multiple emails from the same sender (Zalman).

## Root Cause

**Data Source Mismatch**: `PeopleTab` was receiving `currentEmail` from the wrong source.

### The Problem:

1. `PeopleTab` was receiving `currentEmail` as a **prop** from `AIAssistantPanelNew`
2. `AIAssistantPanelNew` was getting `currentEmail` from **`useAIPanelStore()`**
3. The store's `Email` interface has a simplified structure:
   ```typescript
   interface Email {
     from: string; // ❌ Simple string
     fromName?: string;
   }
   ```
4. But `PeopleTab` expects the **database** `Email` type:
   ```typescript
   interface Email {
     fromAddress: JSONB; // ✅ { email: string, name?: string }
   }
   ```

### The Flow:

```
ExpandableEmailItem
  → useChatbotContext()
    → setCurrentEmail(databaseEmail)
      → stores FULL database email in context
      → ALSO syncs SIMPLIFIED email to AI Panel store
```

So:

- `ChatbotContext` has the **full database email** ✅
- `useAIPanelStore()` has a **simplified email** ❌

`PeopleTab` was using the simplified version, which doesn't have `fromAddress` as JSONB!

## Solution

Changed `PeopleTab` to use `useChatbotContext()` directly instead of receiving the email as a prop:

### Before:

```typescript
export function PeopleTab({ currentEmail }: PeopleTabProps): JSX.Element {
  // currentEmail came from props (from store's simplified interface)
  const senderEmail = currentEmail?.fromAddress?.email; // ❌ undefined!
}
```

### After:

```typescript
import { useChatbotContext } from '../ChatbotContext';

export function PeopleTab({}: PeopleTabProps): JSX.Element {
  // Get email directly from context (full database type)
  const { currentEmail } = useChatbotContext();

  const senderEmail = currentEmail?.fromAddress?.email; // ✅ Works!
}
```

## Files Changed

### 1. `src/components/ai/tabs/PeopleTab.tsx`

- Added `import { useChatbotContext } from '../ChatbotContext';`
- Removed `currentEmail` prop, now getting it from `useChatbotContext()`
- Now receives the **full database email** with proper `fromAddress` JSONB field

### 2. `src/components/ai/AIAssistantPanelNew.tsx`

- Removed `currentEmail={currentEmail}` prop from `<PeopleTab />` call
- Component now relies on context instead of props

## How It Works Now

1. User clicks/expands an email in `ExpandableEmailItem`
2. `ExpandableEmailItem` calls `setCurrentEmail(email)` from `useChatbotContext()`
3. `ChatbotContext` stores the **full database email** object
4. `PeopleTab` reads from `useChatbotContext()` and gets the **full email**
5. Extracts `senderEmail` from `fromAddress.email` (JSONB field)
6. Fetches previous emails using `/api/contacts/sender-emails?senderEmail={email}`
7. ✅ Previous emails now display correctly!

## Why This Architecture?

- **`ChatbotContext`**: Holds the **full database email** for components that need detailed data
- **`useAIPanelStore`**: Holds a **simplified email** for basic UI purposes (tabs, visibility, etc.)
- Separation of concerns: Context for data, Store for UI state

## Testing

1. Open the email client
2. Click on any email to expand it
3. Switch to the "People" tab in the AI sidebar
4. ✅ Should now show all previous emails from that sender
5. ✅ Pagination "Load More" button should work
6. ✅ Click on email to open it in main view

---

**Status**: ✅ Fixed! Previous emails now display correctly in the People tab.
