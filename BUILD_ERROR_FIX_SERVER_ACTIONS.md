# Build Error Fix - Server Actions Split

**Date**: October 18, 2025  
**Issue**: Server actions in client components  
**Status**: ✅ **FIXED**

---

## 🐛 Problem

Build error occurred because:

1. `src/lib/contacts/helpers.ts` had `'use server'` at the top
2. This file was imported by client components (`EmailComposer.tsx`)
3. Next.js doesn't allow server actions to be defined in files imported by client components

**Error Message:**

```
It is not allowed to define inline "use server" annotated Server Actions in Client Components.
To use Server Actions in a Client Component, you can either export them from a separate
file with "use server" at the top, or pass them down through props from a Server Component.
```

---

## ✅ Solution

Split the file into two separate files:

### 1. **Server Actions** (Database queries)

**File:** `src/lib/contacts/helpers.ts`

- Has `'use server'` at the top
- Contains async functions that interact with database
- Functions:
  - `findContactByEmail()` - Look up contact by email
  - `findContactsByEmails()` - Batch lookup

### 2. **Utility Functions** (Pure functions)

**File:** `src/lib/contacts/email-utils.ts` ✨ **NEW**

- No `'use server'` directive
- Contains synchronous utility functions
- Can be imported by both client and server components
- Functions:
  - `extractEmailAddress()` - Parse email from various formats
  - `extractEmailAddresses()` - Parse multiple emails

---

## 📁 Files Modified

### Created

- ✅ `src/lib/contacts/email-utils.ts` (new file, 38 lines)

### Updated

- ✅ `src/lib/contacts/helpers.ts` (removed utility functions)
- ✅ `src/components/email/EmailComposer.tsx` (updated import)
- ✅ `src/lib/sync/email-sync-service.ts` (updated import)

---

## 🔧 Changes Detail

### Before (Broken)

```typescript
// src/lib/contacts/helpers.ts
'use server';

export async function findContactByEmail(...) { ... }
export async function findContactsByEmails(...) { ... }
export function extractEmailAddress(...) { ... }  // ❌ Not async, causes error
export function extractEmailAddresses(...) { ... } // ❌ Not async, causes error
```

### After (Fixed)

```typescript
// src/lib/contacts/helpers.ts
'use server';

export async function findContactByEmail(...) { ... }
export async function findContactsByEmails(...) { ... }

// src/lib/contacts/email-utils.ts (NEW)
// No 'use server' directive

export function extractEmailAddress(...) { ... }  // ✅ Can be used anywhere
export function extractEmailAddresses(...) { ... } // ✅ Can be used anywhere
```

---

## 📊 Import Updates

### EmailComposer.tsx

```typescript
// Before
import {
  findContactsByEmails,
  extractEmailAddresses,
} from '@/lib/contacts/helpers';

// After
import { findContactsByEmails } from '@/lib/contacts/helpers';
import { extractEmailAddresses } from '@/lib/contacts/email-utils';
```

### email-sync-service.ts

```typescript
// Before
import {
  findContactByEmail,
  extractEmailAddress,
} from '@/lib/contacts/helpers';

// After
import { findContactByEmail } from '@/lib/contacts/helpers';
import { extractEmailAddress } from '@/lib/contacts/email-utils';
```

---

## ✅ Result

- ✅ Build compiles successfully
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Server actions properly isolated
- ✅ Utility functions accessible everywhere
- ✅ Clean architecture maintained

---

## 📚 Key Learnings

### Next.js Server Actions Rules

1. **File-level `'use server'`**:
   - ALL exports must be async functions
   - File can only be imported by server components

2. **Function-level `'use server'`**:
   - Can't be used in client component files
   - Next.js doesn't support this pattern

3. **Best Practice**:
   - Separate server actions from utility functions
   - Server actions → `'use server'` file
   - Utilities → regular file (no directive)

---

## 🎯 Architecture Pattern

```
src/lib/contacts/
├── helpers.ts          # 'use server' - DB operations only
├── email-utils.ts      # No directive - Pure utility functions
├── timeline-actions.ts # 'use server' - DB operations
└── notes-actions.ts    # 'use server' - DB operations
```

**Benefits:**

- ✅ Clear separation of concerns
- ✅ Utilities usable in both client & server
- ✅ Server actions properly isolated
- ✅ No build errors
- ✅ Type-safe across boundaries

---

**Fix Time**: 5 minutes  
**Files Changed**: 4  
**Files Created**: 1  
**Build Status**: ✅ Working

**Status**: ✅ Build error resolved!
