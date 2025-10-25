# Previous Emails - Clickable Navigation

## Feature

Made previous emails in the "People" tab clickable to scroll to and open the email in the main inbox view.

## Implementation

### How It Works

1. **User clicks** on a previous email in the People tab
2. `PeopleTab` component **dispatches** a `CustomEvent` named `open-email` with the email ID
3. `EmailList` component **listens** for this event
4. When event is received:
   - **Finds** the email in the current list
   - **Expands** the email by setting `expandedEmailId`
   - **Scrolls** to the email using `scrollIntoView()` with smooth animation

### Code Changes

#### `src/components/ai/tabs/PeopleTab.tsx` (Already had this)

```typescript
function handleEmailClick(emailId: string) {
  // Dispatch event to open email in main view
  const event = new CustomEvent('open-email', { detail: { emailId } });
  window.dispatchEvent(event);
}

// Used in email list:
<button
  onClick={() => handleEmailClick(email.id)}
  className="w-full text-left p-3 rounded-lg..."
>
  {/* Email details */}
</button>
```

#### `src/components/email/EmailList.tsx` (NEW)

```typescript
// Listen for 'open-email' event from other components (e.g., PeopleTab)
useEffect(() => {
  const handleOpenEmail = (event: CustomEvent) => {
    const { emailId } = event.detail;

    console.log('[EmailList] Open email event received:', emailId);

    // Find the email in the list
    const email = emails.find((e) => e.id === emailId);
    if (!email) {
      console.warn('[EmailList] Email not found in current list:', emailId);
      return;
    }

    // Expand the email
    setExpandedEmailId(emailId);

    // Scroll to the email after a brief delay to allow DOM update
    setTimeout(() => {
      const emailElement = emailRefs.current[emailId];
      if (emailElement && scrollContainerRef.current) {
        emailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        console.log('[EmailList] Scrolled to email:', emailId);
      } else {
        console.warn('[EmailList] Email element not found in DOM:', emailId);
      }
    }, 100);
  };

  window.addEventListener('open-email', handleOpenEmail as EventListener);

  return () => {
    window.removeEventListener('open-email', handleOpenEmail as EventListener);
  };
}, [emails]);
```

## User Experience

### Before

- ❌ Previous emails displayed but not clickable
- ❌ No way to navigate from People tab to email

### After

- ✅ Click any previous email to open it
- ✅ Smooth scroll animation to the email
- ✅ Email automatically expands
- ✅ Email centered in viewport
- ✅ Visual feedback (hover state on buttons)

## Technical Details

### Event-Driven Architecture

- Uses `CustomEvent` for cross-component communication
- Decoupled: PeopleTab doesn't need direct access to EmailList
- Extensible: Other components can dispatch the same event

### Scroll Behavior

- `scrollIntoView({ behavior: 'smooth', block: 'center' })`
- Centers the email in the viewport for better visibility
- 100ms delay allows React to update DOM before scrolling

### Error Handling

- Console warnings if email not found in list
- Console warnings if email element not in DOM
- Graceful degradation (no crash if something fails)

### Performance

- Event listener cleanup on component unmount
- Efficient email lookup using `find()`
- Refs already cached in `emailRefs.current`

## Testing Checklist

1. ✅ Open an email in inbox
2. ✅ Switch to "People" tab in AI sidebar
3. ✅ See list of previous emails from sender
4. ✅ Click on any previous email
5. ✅ Email should:
   - Scroll into view smoothly
   - Expand automatically
   - Center in the viewport

### Edge Cases

- **Email not in current list**: Console warning, no crash
- **Email not loaded yet**: Will show warning (user may need to scroll to load more emails first)
- **Multiple clicks**: Each click re-focuses and expands the email

## Debug Logs

Console logs help trace the flow:

```
[EmailList] Open email event received: abc123
[EmailList] Scrolled to email: abc123
```

Or if there's an issue:

```
[EmailList] Email not found in current list: abc123
[EmailList] Email element not found in DOM: abc123
```

## Files Modified

- `src/components/email/EmailList.tsx` - Added event listener for `open-email` event

## Related Files (No changes needed)

- `src/components/ai/tabs/PeopleTab.tsx` - Already had click handler and event dispatch
- `src/components/email/ExpandableEmailItem.tsx` - Already had ref setup

---

**Status**: ✅ Complete! Previous emails are now fully clickable and navigate smoothly.
