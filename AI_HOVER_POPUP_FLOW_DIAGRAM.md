# AI Summary Hover Popup - Visual Flow Diagram

## User Interaction Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER HOVERS OVER EMAIL CARD                   │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│            onMouseEnter() triggered                              │
│            • Check if email is expanded (skip if yes)            │
│            • Start 500ms timeout                                 │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────┴─────────────┐
                    │                           │
          USER MOVES AWAY               500ms PASSES
              BEFORE 500ms                     │
                    │                           ▼
                    ▼               ┌──────────────────────────┐
         onMouseLeave()             │  setShowSummary(true)    │
         • Clear timeout            │  calculatePopupPosition()│
         • Cancel popup             │  fetchSummary()          │
                                    └──────────────────────────┘
                                                │
                                                ▼
                    ┌───────────────────────────┴────────────────────┐
                    │                                                │
           ┌────────▼────────┐                          ┌───────────▼────────┐
           │ CACHED SUMMARY? │                          │ FETCH FROM API     │
           │ (summary exists)│                          │ POST /ai/summarize │
           └────────┬────────┘                          └───────────┬────────┘
                    │                                                │
                    │ YES                                       NO   │
                    ▼                                                ▼
         ┌─────────────────┐                          ┌─────────────────────┐
         │ SHOW INSTANTLY  │                          │ SHOW LOADING STATE  │
         │ • Display popup │                          │ ⟳ Generating...     │
         │ • Show summary  │                          │ (Loader2 spinner)   │
         └─────────────────┘                          └──────────┬──────────┘
                                                                 │
                                              ┌──────────────────┴───────────────┐
                                              │                                  │
                                      ┌───────▼───────┐                  ┌───────▼────────┐
                                      │   SUCCESS     │                  │     ERROR      │
                                      │ • Cache result│                  │ • Show error   │
                                      │ • Show summary│                  │ • Retry option │
                                      └───────────────┘                  └────────────────┘
```

## Popup Positioning Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VIEWPORT                                       │
│                                                                          │
│    ┌──────────────┐                                                     │
│    │ Email Card   │ ◄─── Get rect.right + 16px                         │
│    └──────────────┘                                                     │
│                        │                                                │
│                        ▼                                                │
│            ┌─────────────────────────┐                                 │
│            │ ✨ AI SUMMARY (320px)   │ ◄─── DEFAULT POSITION          │
│            │ ───────────────────────│                                 │
│            │ Email summary text...   │                                 │
│            │ ...continues here       │                                 │
│            │ ───────────────────────│                                 │
│            │ 💡 Click for details    │                                 │
│            └─────────────────────────┘                                 │
│                                                                          │
│                                                                          │
│                                                      IF WOULD OVERFLOW → │
│                                                                          │
│                        ┌─────────────────────────┐  ┌──────────────┐  │
│                        │ ✨ AI SUMMARY (320px)   │  │ Email Card   │  │
│                        │ ───────────────────────│  └──────────────┘  │
│                        │ Email summary text...   │                     │
│                        │ ...continues here       │                     │
│                        │ ───────────────────────│                     │
│                        │ 💡 Click for details    │                     │
│                        └─────────────────────────┘                     │
│                        ▲                                                │
│                        └─── FALLBACK: rect.left - 320px - 16px         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                          IDLE STATE                              │
│  • showSummary: false                                           │
│  • isLoadingSummary: false                                      │
│  • summary: null                                                │
│  • summaryError: false                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ onMouseEnter + 500ms
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         LOADING STATE                            │
│  • showSummary: true                                            │
│  • isLoadingSummary: true                                       │
│  • summary: null                                                │
│  • summaryError: false                                          │
│  • Displays: ⟳ Generating summary...                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                │ API Success               │ API Error
                ▼                           ▼
┌──────────────────────────────┐   ┌────────────────────────────┐
│      SUCCESS STATE           │   │      ERROR STATE           │
│  • showSummary: true         │   │  • showSummary: true       │
│  • isLoadingSummary: false   │   │  • isLoadingSummary: false │
│  • summary: "AI text..."     │   │  • summary: null           │
│  • summaryError: false       │   │  • summaryError: true      │
│  • Displays: [Summary text]  │   │  • Displays: ❌ Failed...  │
└──────────────────────────────┘   └────────────────────────────┘
                │                           │
                │ onMouseLeave              │ onMouseLeave
                ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CACHED STATE (IDLE)                            │
│  • showSummary: false                                           │
│  • isLoadingSummary: false                                      │
│  • summary: "AI text..." (preserved)                            │
│  • summaryError: false                                          │
│  • Next hover will show instantly!                              │
└─────────────────────────────────────────────────────────────────┘
```

## Animation Timeline

```
TIME (ms)    EVENT                           VISUAL STATE
─────────────────────────────────────────────────────────────────
0            User hovers                     [Email card highlighted]
             onMouseEnter()

500          Timeout fires                   [Popup starts appearing]
             setShowSummary(true)            opacity: 0 → 1
             fetchSummary()                  scale: 0.95 → 1
                                            y: -10 → 0

700          Animation complete              [Popup fully visible]
             (200ms duration)                Loading spinner active

~1500        API response                    [Loading → Summary text]
             setSummary(data.summary)
             setIsLoadingSummary(false)

[HOVER]      User stays on card              [Popup remains visible]
             (any duration)

N            User leaves card                [Popup starts fading]
             onMouseLeave()                  opacity: 1 → 0
             setShowSummary(false)           scale: 1 → 0.95
                                            y: 0 → -10

N+200        Animation complete              [Popup removed from DOM]
             (200ms duration)                AnimatePresence unmounts
```

## Code Execution Order

```
1. USER HOVERS OVER CARD
   ↓
2. onMouseEnter() executes
   ↓
3. Check: isExpanded? (if yes, STOP)
   ↓
4. setTimeout(() => {...}, 500)
   ↓
5. [WAIT 500ms OR CANCEL IF USER LEAVES]
   ↓
6. setShowSummary(true)
   ↓
7. calculatePopupPosition()
   │ ├─ Get card.getBoundingClientRect()
   │ ├─ Calculate left = rect.right + 16
   │ ├─ Check: Would overflow? (adjust if yes)
   │ └─ setPopupPosition({ top, left })
   ↓
8. fetchSummary()
   │ ├─ Check: Already have summary? (RETURN if yes)
   │ ├─ Check: Already loading? (RETURN if yes)
   │ ├─ setIsLoadingSummary(true)
   │ ├─ POST /api/ai/summarize
   │ ├─ [WAIT FOR API RESPONSE]
   │ ├─ setSummary(data.summary)
   │ └─ setIsLoadingSummary(false)
   ↓
9. AnimatePresence renders popup
   │ ├─ motion.div initial state
   │ ├─ Animate to visible state
   │ └─ Display summary (or loading/error)
   ↓
10. USER MOVES CURSOR AWAY
   ↓
11. onMouseLeave() executes
   ↓
12. Clear timeout (if still pending)
   ↓
13. setShowSummary(false)
   ↓
14. AnimatePresence animates out
   ↓
15. Component unmounts popup
   ↓
16. [SUMMARY CACHED IN STATE]
    (Next hover will skip API call!)
```

## Memory Management

```
COMPONENT LIFECYCLE:

Mount
  ↓
[User Interaction Loop]
  │
  ├─ Hover → Start timeout → Store in hoverTimeoutRef
  │  ├─ 500ms pass → Execute callback
  │  └─ User leaves early → clearTimeout(hoverTimeoutRef)
  │
  └─ API Call → Store summary in state
     └─ Future hovers → Use cached summary

Unmount
  ↓
useEffect cleanup → clearTimeout(hoverTimeoutRef)
  ↓
Component removed from DOM
  ↓
All state garbage collected
```

---

## Key Technical Decisions

### 1. Why 500ms delay?

- Prevents accidental triggers from quick mouse movements
- Feels intentional without being slow
- Standard UX pattern for hover interactions

### 2. Why fixed positioning?

- Popup needs to overlay everything (z-index: 9999)
- Must work across scrolling containers
- Allows precise pixel positioning

### 3. Why AnimatePresence?

- Smooth fade in/out animations
- Proper cleanup on unmount
- Prevents popup from "popping" in/out

### 4. Why cache summaries?

- Avoids repeated API calls
- Instant display on subsequent hovers
- Reduces OpenAI costs

### 5. Why not show when expanded?

- Email is already visible
- Would be redundant
- Saves API calls

---

## Performance Metrics

| Metric             | Value          | Notes                |
| ------------------ | -------------- | -------------------- |
| Hover delay        | 500ms          | Configurable         |
| Animation duration | 200ms          | Entry + exit         |
| API call time      | ~1-2s          | OpenAI GPT-4         |
| Popup size         | 320px × ~200px | Dynamic height       |
| Z-index            | 9999           | Above all content    |
| Memory per email   | ~500 bytes     | Cached summary       |
| Re-renders         | Minimal        | Only on state change |

---

This visual flow should help understand exactly how the feature works!


