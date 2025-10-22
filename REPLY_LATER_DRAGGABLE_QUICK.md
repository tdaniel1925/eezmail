# 🎯 Reply Later Grouped Draggable - Quick Guide

## What Changed?

The **title badge** ("X Reply Later") and the **bubble stack** (avatar circles) now move **together as one grouped unit**!

---

## How to Use

### Drag the Entire Group

1. **Hover** anywhere over the Reply Later widget
2. **See** the grip icon (⋮⋮) on the title badge
3. **Click and drag** anywhere on the group to move both title and bubbles together
4. **Release** to drop
5. Position automatically saved! ✅

### Reset to Default Position

If the widget gets dragged off-screen or you want to reset it:

**Option 1: Double-Click**

- **Double-click** anywhere on the widget
- It instantly returns to center-bottom ✨

**Option 2: Browser Console**

```javascript
localStorage.removeItem('replyLaterGroupPosition');
location.reload();
```

---

## Visual Layout

### Grouped Stack

```
     [⋮⋮ 🕐 3 Reply Later]  ← Title Badge
              ↓
     [AB] [CD] [EF] [+3]   ← Bubble Stack
              ↓
    Everything moves together!
```

**Hover Effects:**

- Title badge scales up slightly (105%)
- Grip icon visible
- Cursor: move anywhere on the group

**While Dragging:**

- Cursor: grabbing
- Both elements follow mouse together
- Entire widget moves as one unit

---

## Where It Goes

The entire group stays **within screen bounds**:

- ✅ Can't drag off-screen
- ✅ Respects margins
- ✅ Always visible
- ✅ Title and bubbles maintain spacing

---

## Position Memory

**Your position is saved!**

- Survives page refresh ✅
- Survives browser close ✅
- Per-browser (localStorage key: `replyLaterGroupPosition`)

**To reset:**

```javascript
// In browser console
localStorage.removeItem('replyLaterGroupPosition');
location.reload();
```

---

## Quick Demo

**Before:**

```
Screen (centered bottom)
     [Title]
     [Bubbles]
```

**After Dragging:**

```
Screen
               [Title]    ← You dragged here!
              [Bubbles]   ← Moved with title!
```

**After Refresh:**

```
Screen
               [Title]    ← Still here!
              [Bubbles]   ← Still together!
```

---

## Features at a Glance

| Feature                | Status            |
| ---------------------- | ----------------- |
| Drag title badge       | ✅                |
| Drag bubble stack      | ✅                |
| Move together as group | ✅ (NEW!)         |
| Save position          | ✅                |
| Persist on reload      | ✅                |
| Stay in bounds         | ✅                |
| Visual feedback        | ✅                |
| Mobile support         | ❌ (desktop only) |

---

## Key Improvements

### Before (Previous Version)

- Title and bubbles dragged **separately**
- Two separate positions saved
- Had to reposition each element individually

### Now (Current Version)

- Title and bubbles drag **together** ✨
- Single position saved
- Move entire widget in one action
- Always maintains perfect spacing

---

## Tips

💡 **Tip 1:** Drag from anywhere - title or bubbles!  
💡 **Tip 2:** Position in corner to maximize workspace  
💡 **Tip 3:** Entire widget moves as one - no need to align  
💡 **Tip 4:** Position saved automatically on drop

---

## Troubleshooting

**Q: Widget dragged off-screen and I can't find it!**  
A: **Double-click anywhere on screen** where you think it might be, OR use the browser console reset (see "Reset to Default Position" above)

**Q: Position resets on page load?**  
A: Check if localStorage is enabled in your browser

**Q: Can't drag on mobile?**  
A: Feature is desktop-only (mobile screens too small)

**Q: Position is weird after browser resize?**  
A: Double-click the widget to reset, then drag to reposition

**Q: Want to reset to default center-bottom?**  
A: **Double-click the widget** (easiest!) or use: `localStorage.removeItem('replyLaterGroupPosition');` + refresh

**Q: Can I still drag just the title or just the bubbles?**  
A: No - they now move together as one unit for better UX

**Q: The widget won't reset when I double-click?**  
A: Make sure you're double-clicking directly on the widget (title badge or bubbles), not empty space

---

## Technical Details

**What Changed:**

- Removed separate `titlePosition` and `stackPosition` state
- Added single `groupPosition` state
- Wrapped both elements in one draggable `motion.div`
- Changed layout from two separate `fixed` elements to one `fixed` flex column
- Simplified localStorage to single key: `replyLaterGroupPosition`

**Benefits:**

- Simpler code
- Better UX (one action instead of two)
- Always perfect alignment
- Less localStorage usage

---

## That's It! 🎉

**You can now drag the entire Reply Later widget as one grouped unit!**

Drag away! ✨

---

**File Modified:** `src/components/email/ReplyLaterStack.tsx`  
**Documentation:** `REPLY_LATER_DRAGGABLE.md`  
**Status:** ✅ Ready to use  
**Version:** 2.0 (Grouped Dragging)
