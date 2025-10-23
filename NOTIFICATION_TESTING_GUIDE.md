# 🧪 Notification Center Testing Guide

## Quick Test Instructions

### 1. **View the Notification Bell**
- Open your dashboard
- Look in the top-right header
- You should see a bell icon 🔔
- Badge shows unread count (if any)

### 2. **Open Notification Center**
- Click the bell icon
- Panel should slide in from the right
- Smooth animation
- Background darkens slightly

### 3. **Test Filters**
- Click different filter tabs (All, Unread, Email, etc.)
- Notifications should filter accordingly
- Active tab has red background

### 4. **Test Actions**
- Click "Mark all as read" - badge should go to 0
- Click "Clear read" - read notifications disappear
- Click individual notification - marks as read
- Click X on notification - deletes it
- Click action buttons - navigates to correct page

### 5. **Test Toast Integration**
Try these anywhere in the app:
```typescript
import { toast } from '@/lib/toast';

// Simple success
toast.success('Test notification');

// With category
toast.success('Email sent', { category: 'email' });

// With action
toast.error('Sync failed', {
  category: 'sync',
  actionUrl: '/dashboard/settings',
  actionLabel: 'Fix Now',
});
```

### 6. **Test Existing Features**
All these should now create notifications:
- Send an email → Success notification
- Sync fails → Error notification  
- Delete contact → Success notification
- Create event → Success notification
- Any existing toast call

### 7. **Test Close Behavior**
- Click outside panel → closes
- Press ESC key → closes
- Click bell again → closes

### 8. **Test Real-time Updates**
- Wait 30 seconds
- New notifications should appear automatically
- Badge should update

### 9. **Test Responsive Design**
- Resize browser window
- Mobile: Panel should be full width
- Desktop: Panel should be 450px wide

### 10. **Test Performance**
- Open notification center
- Scroll through notifications
- Should be smooth, no lag
- Filtering should be instant

---

## Expected Behavior

✅ Bell appears in header  
✅ Badge shows correct unread count  
✅ Panel slides in smoothly  
✅ Filters work correctly  
✅ Mark as read works  
✅ Delete works  
✅ Actions navigate correctly  
✅ Close on outside click works  
✅ ESC key works  
✅ Auto-polling updates badge (30s)  
✅ Toast integration works  
✅ Mobile responsive

---

## Common Issues & Fixes

### Issue: Bell doesn't appear
**Fix:** Make sure you're using a page with `UnifiedHeader` component

### Issue: Notifications don't persist
**Fix:** Run the database migration:
```bash
# Via Supabase SQL Editor
migrations/add_notification_center.sql
```

### Issue: Badge doesn't update
**Fix:** Wait 30 seconds for next poll, or refresh page

### Issue: Toast doesn't add to center
**Fix:** Make sure you're importing from `@/lib/toast`, not from `sonner` directly

---

## Manual Test Scenario

**Complete User Flow:**

1. **User sends an email**
   - Toast appears: "Email sent"
   - Toast disappears after 3 seconds
   - Bell badge increments (+1)
   - Click bell → see "Email sent" notification

2. **User opens notification center**
   - Panel slides in
   - Sees "Email sent" notification
   - Clicks notification → marks as read
   - Badge decrements (-1)

3. **User filters by Email**
   - Clicks "Email" tab
   - Only email-related notifications show

4. **User clicks action button**
   - Clicks "View Email"
   - Navigates to correct page
   - Panel closes

5. **User marks all as read**
   - Clicks "Mark all as read"
   - Badge goes to 0
   - All notifications have no red dot

6. **User clears read**
   - Clicks "Clear read"
   - All read notifications disappear
   - Only unread remain

---

## Automated Testing (Future)

```typescript
// Example test structure
describe('NotificationCenter', () => {
  it('should open when bell is clicked', () => {
    // Test implementation
  });

  it('should filter notifications by category', () => {
    // Test implementation
  });

  it('should mark notification as read', () => {
    // Test implementation
  });
});
```

---

**Status:** Ready for testing! 🚀

