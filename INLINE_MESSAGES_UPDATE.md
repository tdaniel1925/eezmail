# Toast to Inline Messages - Implementation Guide

## ✅ Completed

- [x] IMAP Setup Page (`src/app/dashboard/settings/email/imap-setup/page.tsx`)

## 🔄 In Progress

### ConnectedAccounts Component

**File:** `src/components/settings/ConnectedAccounts.tsx`

**Toast Calls to Replace:**

1. Line 78-83: Account connected success (from URL params)
2. Line 93-95: Connection error (from URL params)
3. Line 174: Loading toast for OAuth redirect
4. Line 178-180: Connection failed error
5. Line 184-186: Connection error catch
6. Line 196-198: Sync success
7. Line 202-204: Sync failed
8. Line 240-242: Disconnect success
9. Line 246-248: Disconnect failed
10. Line 260: Remove success
11. Line 263-265: Remove failed
12. Line 276: Default account success
13. Line 279-281: Default account failed
14. Line 297-299: Reconnect success
15. Line 302-304: Reconnect failed
16. Line 316-318: Reconnect OAuth loading
17. Line 321-323: Reconnect OAuth failed
18. Line 326: Reconnect catch error
19. Line 362: Bulk sync success
20. Line 365: Bulk sync partial failure

**Required State:**

```typescript
const [statusMessage, setStatusMessage] = useState<{
  type: 'success' | 'error' | 'info' | null;
  message: string;
}>({ type: null, message: '' });
```

**Display Location:**
After the header and before the accounts list (around line 389)

### CommunicationSettings Component

**File:** `src/components/settings/CommunicationSettings.tsx`

**Toast Calls to Replace:**

1. Line 60: Load settings failed
2. Line 67: Missing credentials
3. Line 85: No certified numbers found
4. Line 87: Numbers found success
5. Line 90: Fetch numbers failed
6. Line 95: Fetch numbers error catch
7. Line 104: Missing credentials for test
8. Line 117: Valid credentials success
9. Line 121: Invalid credentials
10. Line 129: Missing Twilio settings
11. Line 138: Settings saved success
12. Line 141: Settings save failed

### SignaturesSettings Component

**File:** `src/components/settings/SignaturesSettings.tsx`

**Toast Calls to Replace:**

1. Line 108: Delete signature success
2. Line 111: Delete signature failed
3. Line 118: Set default success
4. Line 121: Set default failed
5. Line 128: Toggle signature success
6. Line 131: Toggle failed
7. Line 341-345: Create/update success
8. Line 348: Save failed

### RulesSettings Component

**File:** `src/components/settings/RulesSettings.tsx`

**Toast Calls to Replace:**

1. Line 197: Delete rule success
2. Line 200: Delete failed
3. Line 207: Toggle success
4. Line 210: Toggle failed
5. Line 561-563: Save success
6. Line 566: Save failed

## Implementation Pattern

### 1. Add Status State

```typescript
const [statusMessage, setStatusMessage] = useState<{
  type: 'success' | 'error' | 'info' | null;
  message: string;
}>({ type: null, message: '' });
```

### 2. Replace Toast Calls

```typescript
// Before
toast.success('Operation successful!');

// After
setStatusMessage({ type: 'success', message: 'Operation successful!' });
```

### 3. Auto-Clear Success Messages

```typescript
useEffect(() => {
  if (statusMessage.type === 'success') {
    const timer = setTimeout(() => {
      setStatusMessage({ type: null, message: '' });
    }, 5000);
    return () => clearTimeout(timer);
  }
}, [statusMessage]);
```

### 4. Display Status Message

```tsx
{
  statusMessage.type && (
    <div
      className={`mb-6 rounded-lg border p-4 ${
        statusMessage.type === 'success'
          ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
          : statusMessage.type === 'error'
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
      }`}
    >
      <div
        className={`flex items-center gap-2 ${
          statusMessage.type === 'success'
            ? 'text-green-600 dark:text-green-400'
            : statusMessage.type === 'error'
              ? 'text-red-600 dark:text-red-400'
              : 'text-blue-600 dark:text-blue-400'
        }`}
      >
        {statusMessage.type === 'success' && (
          <CheckCircle className="h-4 w-4" />
        )}
        {statusMessage.type === 'error' && <AlertCircle className="h-4 w-4" />}
        {statusMessage.type === 'info' && (
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
        )}
        <span>{statusMessage.message}</span>
      </div>
    </div>
  );
}
```

### 5. Remove Toast Import

```typescript
// Remove
import { toast } from '@/lib/toast';

// Keep icons if not already imported
import { CheckCircle, AlertCircle } from 'lucide-react';
```

## Testing Checklist

- [ ] IMAP account addition shows inline success/error
- [ ] Email account connection shows inline status
- [ ] Sync operations show inline progress
- [ ] Account removal shows inline confirmation
- [ ] Twilio settings save shows inline result
- [ ] Signature operations show inline feedback
- [ ] Rule operations show inline feedback
- [ ] All settings pages work without toasts
- [ ] Status messages auto-clear after 5 seconds
- [ ] Error messages persist until user action
