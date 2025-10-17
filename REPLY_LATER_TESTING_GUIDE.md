# Reply Later Stack - Testing Guide

## Quick Start

### Prerequisites
1. Ensure development server is running: `npm run dev`
2. Have at least one email account connected
3. OpenAI API key configured for AI draft generation

## Testing Steps

### 1. Mark an Email as Reply Later

**Steps:**
1. Navigate to `/dashboard/inbox`
2. Click on any email to open EmailViewer
3. Look for the Clock icon (⏰) in the action bar
4. Click the Clock icon
5. Select a time option (e.g., "Tomorrow")

**Expected Results:**
- ✅ Toast message: "Added to Reply Later. AI is drafting your reply..."
- ✅ Email viewer closes
- ✅ A circular bubble appears at bottom-center of screen
- ✅ Bubble shows sender's initials

### 2. View the Reply Later Stack

**Steps:**
1. Look at bottom-center of any dashboard page
2. Multiple bubbles should stack horizontally
3. Hover over a bubble

**Expected Results:**
- ✅ Bubbles are visible across all dashboard pages
- ✅ Bubbles have colored backgrounds with white borders
- ✅ Hovering scales bubble up slightly
- ✅ Quick X button appears on hover
- ✅ If >6 bubbles, see "+N more" indicator

### 3. Open Preview Modal

**Steps:**
1. Click on any bubble in the stack
2. Wait for AI draft to generate (2-5 seconds)

**Expected Results:**
- ✅ Preview modal expands above the bubble
- ✅ Shows email subject and sender
- ✅ Shows email snippet
- ✅ Loading spinner while AI generates draft
- ✅ AI-generated reply text appears in textarea
- ✅ Backdrop with blur effect

### 4. Edit and Send Reply

**Steps:**
1. In the preview modal, edit the draft text
2. Click "Send Reply" button

**Expected Results:**
- ✅ Reply is sent to original sender
- ✅ Toast: "Reply sent successfully!"
- ✅ Bubble animates out and disappears
- ✅ Email removed from reply later queue

### 5. Open Full View

**Steps:**
1. Click a bubble to open preview
2. Click "Open Full View" button

**Expected Results:**
- ✅ Navigates to /dashboard/inbox
- ✅ Email opens in full viewer
- ✅ (Future: Composer pre-loads with draft)

### 6. Quick Dismiss

**Steps:**
1. Hover over any bubble
2. Click the X button that appears

**Expected Results:**
- ✅ Bubble immediately disappears
- ✅ Toast: "Removed from Reply Later"
- ✅ Email removed from queue

### 7. Test Overdue Indicator

**Steps:**
1. Use developer tools to set a reply later date in the past
2. Or wait for a scheduled email to become overdue

**Expected Results:**
- ✅ Red badge with clock icon appears on bubble
- ✅ "Overdue" label shows in preview modal

### 8. Test Dark Mode

**Steps:**
1. Toggle dark mode in browser/OS
2. View bubbles and preview modal

**Expected Results:**
- ✅ Bubbles adapt to dark theme
- ✅ Modal has dark background
- ✅ Text is readable
- ✅ Borders and shadows work in dark mode

### 9. Test Mobile Hide

**Steps:**
1. Resize browser to < 768px width
2. Or use Chrome DevTools mobile emulation

**Expected Results:**
- ✅ Reply Later stack is hidden
- ✅ No bubbles visible on mobile

### 10. Test Error Handling

**Steps:**
1. Temporarily disable OpenAI API key
2. Click a bubble to generate draft

**Expected Results:**
- ✅ Error message shown in modal
- ✅ Empty textarea available for manual editing
- ✅ Can still type and send reply manually

## Common Issues & Solutions

### Issue: Bubbles don't appear
**Solution:**
- Check if emails have `replyLaterUntil` timestamp set
- Verify `isTrashed` is false
- Check console for errors
- Refresh the page

### Issue: AI draft fails to generate
**Solution:**
- Verify OpenAI API key is configured
- Check API quota/rate limits
- Look at console logs for error details
- Manual editing still works

### Issue: Send Reply fails
**Solution:**
- Check email account is connected
- Verify SMTP settings
- Check console for errors
- Try "Open Full View" instead

### Issue: Modal doesn't close
**Solution:**
- Click outside the modal
- Click Dismiss button
- Refresh page if stuck

## Browser Console Checks

Open browser console and look for:
- ✅ No React errors
- ✅ No network errors
- ✅ Successful API calls to `/api/ai/reply`
- ✅ Console logs showing draft generation

## Database Verification

Check the database to verify:
```sql
-- View all reply later emails
SELECT id, subject, "replyLaterUntil", "replyLaterNote"
FROM emails
WHERE "replyLaterUntil" IS NOT NULL
AND "isTrashed" = false;

-- Count reply later emails per user
SELECT "accountId", COUNT(*)
FROM emails
WHERE "replyLaterUntil" IS NOT NULL
GROUP BY "accountId";
```

## Performance Checks

Monitor:
- Page load time (should be unaffected)
- Animation smoothness (60fps)
- AI generation time (2-5 seconds)
- Memory usage (no leaks)

## Accessibility Checks

Test:
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader announcements
- Focus indicators
- ARIA labels

## Cross-Browser Testing

Test in:
- Chrome ✅
- Firefox ✅
- Safari ✅
- Edge ✅

## Test Data

Use these scenarios:
1. **Normal email**: Standard business email
2. **Short email**: Just a few words
3. **Long email**: Multiple paragraphs
4. **Multiple recipients**: CC/BCC included
5. **With attachments**: File attachments present

## Success Criteria

All features work:
- ✅ Bubbles appear and stack correctly
- ✅ AI drafts generate successfully
- ✅ Replies send properly
- ✅ UI is responsive and smooth
- ✅ No console errors
- ✅ Dark mode works
- ✅ Mobile hides stack
- ✅ Overdue indicators show
- ✅ Error handling graceful

## Next Steps After Testing

1. Fix any bugs found
2. Optimize performance if needed
3. Add missing features from wishlist
4. Deploy to staging
5. User acceptance testing
6. Deploy to production

---

**Happy Testing!** 🧪

