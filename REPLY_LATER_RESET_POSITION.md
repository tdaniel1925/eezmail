# 🔧 Reply Later Widget - Reset Position

## Quick Fix: Widget Dragged Off-Screen

If you accidentally dragged the Reply Later widget off-screen and can't find it, here's how to reset it:

### Method 1: Browser Console (Fastest)

1. **Open Browser Console:**
   - Press `F12` OR
   - Right-click anywhere → "Inspect" → "Console" tab

2. **Paste this command:**

   ```javascript
   localStorage.removeItem('replyLaterGroupPosition');
   location.reload();
   ```

3. **Press Enter**

4. **Done!** ✅ The widget will appear back in the center-bottom position

---

### Method 2: Clear All Reply Later Positions

If the above doesn't work, clear all related positions:

```javascript
// In browser console
localStorage.removeItem('replyLaterGroupPosition');
localStorage.removeItem('replyLaterTitlePosition');
localStorage.removeItem('replyLaterStackPosition');
location.reload();
```

---

### Method 3: Settings (If Available)

Some browsers allow clearing site data:

1. Go to browser settings
2. Find "Site settings" or "Privacy"
3. Clear localStorage for localhost:3000
4. Refresh page

---

## Prevention

To prevent this from happening again, the drag constraints should keep the widget on-screen. If it still goes off-screen, this might be a bug we should fix!

**Current constraints:**

```typescript
dragConstraints={{
  top: -window.innerHeight / 2 + 100,
  bottom: window.innerHeight / 2 - 100,
  left: -window.innerWidth / 2 + 150,
  right: window.innerWidth / 2 - 150,
}}
```

These should keep the widget visible, but edge cases (like very small screens or window resizing) might cause issues.

---

## Quick Copy-Paste

**Reset command (copy this):**

```javascript
localStorage.removeItem('replyLaterGroupPosition');
location.reload();
```

---

**Need help?** Let me know if this doesn't work!
