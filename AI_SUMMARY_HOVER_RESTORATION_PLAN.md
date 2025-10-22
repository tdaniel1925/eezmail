# AI Summary Hover Popup - Restoration Plan

## Issue Found

The AI summary hover popup feature was implemented in a separate component (`EmailCardWithSummary.tsx`) but is **NOT being used** in the actual email list. The email list uses `ExpandableEmailItem.tsx` which doesn't have the hover feature.

## Current State

### ✅ Exists:

- `src/components/email/EmailCardWithSummary.tsx` - Component WITH hover summary feature
- Documentation files explaining the feature
- `/api/ai/summarize` endpoint

### ❌ Problem:

- `src/components/email/EmailList.tsx` uses `ExpandableEmailItem` (line 644)
- `ExpandableEmailItem` does NOT have hover summary functionality
- Feature was never integrated into the actual inbox view

## Solution Options

### Option A: Add Hover Feature to ExpandableEmailItem (Recommended)

**Pros:**

- Maintains current architecture
- No breaking changes to EmailList
- ExpandableEmailItem already handles expand/collapse

**Cons:**

- Duplicate code from EmailCardWithSummary

### Option B: Replace ExpandableEmailItem with EmailCardWithSummary

**Pros:**

- Uses existing working component
- No code duplication

**Cons:**

- EmailCardWithSummary might not support expand/collapse
- May need refactoring to match ExpandableEmailItem features

### Option C: Create Hybrid Component

**Pros:**

- Best of both worlds
- Clean architecture

**Cons:**

- More work

## Recommended Implementation: Option A

Add hover summary feature to `ExpandableEmailItem.tsx` by copying the logic from `EmailCardWithSummary.tsx`.

### Steps:

1. **Add imports**:

```typescript
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
```

2. **Add state variables**:

```typescript
const [showSummary, setShowSummary] = useState(false);
const [summary, setSummary] = useState<string | null>(null);
const [isLoadingSummary, setIsLoadingSummary] = useState(false);
const [summaryError, setSummaryError] = useState(false);
const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
const cardRef = useRef<HTMLDivElement>(null);
const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

3. **Add functions**:

- `fetchSummary()` - Copy from EmailCardWithSummary
- `calculatePopupPosition()` - Copy from EmailCardWithSummary
- `handleMouseEnter()` - Copy from EmailCardWithSummary
- `handleMouseLeave()` - Copy from EmailCardWithSummary

4. **Add cleanup**:

```typescript
useEffect(() => {
  return () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };
}, []);
```

5. **Update main div**:

```typescript
<div
  ref={cardRef}
  onMouseEnter={handleMouseEnter}
  onMouseLeave={handleMouseLeave}
  className={...}
>
```

6. **Add popup after component**:
   Copy the `<AnimatePresence>` block from EmailCardWithSummary

### Key Condition:

Only show popup when **NOT expanded**: `{showSummary && !isExpanded && (...)}`

## Files to Modify

1. `src/components/email/ExpandableEmailItem.tsx` - Add hover summary feature

## Alternative: Keep EmailCardWithSummary for Later

If we want a non-expandable card view in the future (like Gmail's compact view), we can keep `EmailCardWithSummary.tsx` as an alternative component.

## Status

❌ **Feature NOT Active** - Implementation exists but not integrated
🔧 **Needs Integration** - Copy hover logic to ExpandableEmailItem
📚 **Well Documented** - Full docs exist from original implementation

## Next Steps

1. Copy hover summary logic from EmailCardWithSummary.tsx to ExpandableEmailItem.tsx
2. Test hover on collapsed email cards
3. Verify popup positioning
4. Test that expanded emails don't show popup
5. Verify summary caching works

