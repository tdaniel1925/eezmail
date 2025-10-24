# React Hydration Error - Fix Guide

## Error Description

```
Error: Text content does not match server-rendered HTML.
Error: There was an error while hydrating this Suspense boundary.
```

## Common Causes & Fixes

### 1. **Date/Time Formatting** (Most Common)

**Problem:** Dates formatted differently on server vs client due to timezones.

**Fix:** Use `suppressHydrationWarning` or client-side only rendering:

```typescript
// Option 1: Suppress hydration warning (if date differences are acceptable)
<time suppressHydrationWarning>
  {new Date(email.receivedAt).toLocaleString()}
</time>

// Option 2: Client-side only rendering
'use client';

const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <div>Loading...</div>;
}

return <div>{new Date(email.receivedAt).toLocaleString()}</div>;
```

### 2. **Random/Dynamic Content**

**Problem:** Content that changes between server and client (random IDs, timestamps).

**Fix:** Generate on client only or use stable IDs:

```typescript
// BAD
<div key={Math.random()}>{content}</div>

// GOOD
<div key={item.id}>{content}</div>
```

### 3. **Browser-Only APIs**

**Problem:** Using `window`, `localStorage`, or other browser APIs during SSR.

**Fix:** Check if running in browser:

```typescript
const theme =
  typeof window !== 'undefined' ? localStorage.getItem('theme') : 'light';
```

### 4. **Third-Party Libraries**

**Problem:** Libraries that render differently on server vs client.

**Fix:** Use dynamic imports with `ssr: false`:

```typescript
import dynamic from 'next/dynamic';

const ClientOnlyComponent = dynamic(() => import('./ClientOnlyComponent'), {
  ssr: false,
});
```

## Quick Fixes for This Project

### Fix 1: Add `suppressHydrationWarning` to Date Elements

If the hydration error is from date formatting, add this attribute:

```bash
# Search for date formatting in your code
grep -r "toLocaleString\|toLocaleDateString\|toLocaleTimeString" src/
```

Then add `suppressHydrationWarning`:

```typescript
<span suppressHydrationWarning>
  {new Date(email.receivedAt).toLocaleString()}
</span>
```

### Fix 2: Clear Browser Cache & Restart

Sometimes stale cache causes hydration mismatches:

```bash
# 1. Stop dev server (Ctrl+C)
# 2. Clear Next.js cache
rm -rf .next

# 3. Restart
npm run dev
```

Then in browser:

- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear site data in DevTools

### Fix 3: Check for Conditional Rendering

**Problem:** Different content rendered based on state that's not hydrated:

```typescript
// BAD - userAgent might differ server vs client
const isMobile = navigator.userAgent.includes('Mobile');

// GOOD - use CSS media queries instead
<div className="hidden md:block">Desktop Only</div>
```

## Debugging Steps

### Step 1: Identify the Component

Look at the browser console error - it usually points to a specific component.

### Step 2: Check for Date/Time Usage

Search the component for:

- `new Date()`
- `.toLocaleString()`
- `.toLocaleDateString()`
- `.toLocaleTimeString()`
- `format()` from date-fns

### Step 3: Add `'use client'` if Missing

Ensure components with hydration-sensitive code have:

```typescript
'use client';

import { useState } from 'react';
// ... rest of component
```

### Step 4: Use `suppressHydrationWarning` Strategically

Add to elements with acceptable mismatches:

```typescript
<div suppressHydrationWarning>
  {/* Content that's okay to differ server vs client */}
</div>
```

## For This Specific Error

Based on your project, the most likely culprit is **date formatting in email list components**.

**Quick Fix:**

1. Find the component rendering email dates
2. Add `suppressHydrationWarning` to the time element:

```typescript
// In ExpandableEmailItem.tsx or similar
<span suppressHydrationWarning className="text-xs text-gray-500">
  {getTimeAgo(email.receivedAt || email.createdAt)}
</span>
```

3. Or use client-side only rendering:

```typescript
'use client';

const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

// Show placeholder until mounted
if (!mounted) {
  return <span className="text-xs text-gray-500">--</span>;
}

return (
  <span className="text-xs text-gray-500">
    {getTimeAgo(email.receivedAt || email.createdAt)}
  </span>
);
```

## Production-Ready Solution

For a robust fix, use a utility function:

```typescript
// src/lib/utils/date.ts
'use client';

export function useHydrationSafeDate() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}

// Usage in component
const isClient = useHydrationSafeDate();

return (
  <div>
    {isClient ? (
      <time>{new Date(date).toLocaleString()}</time>
    ) : (
      <time>Loading...</time>
    )}
  </div>
);
```

## References

- [Next.js Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Docs](https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content)

---

**TL;DR:** Add `suppressHydrationWarning` to elements with dates, or use client-side only rendering for dynamic content.
