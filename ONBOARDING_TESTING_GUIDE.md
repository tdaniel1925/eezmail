# Onboarding Center - Testing Guide

## ✅ Implementation Complete!

All 8 phases of the onboarding center have been successfully implemented and the database migration has been executed.

---

## 🧪 Testing Checklist

### **1. Database Verification** ✅

Tables created in Supabase:

- ✅ `onboarding_progress`
- ✅ `onboarding_achievements`
- ✅ `onboarding_tutorials`

**Verify in Supabase:**

- Go to Database → Tables
- Confirm all 3 tables exist with correct columns

---

### **2. Test Onboarding Page**

**Steps:**

1. Navigate to: `http://localhost:3000/dashboard/onboarding`
2. Verify page loads without errors
3. Check for these elements:
   - ✅ "Getting Started with easeMail" header
   - ✅ Progress tracker showing percentage
   - ✅ "Your Progress: 0 of 11 steps complete"
   - ✅ 3 phase cards (Essential Setup, Quick Wins, Power User)
   - ✅ Phase 2 and 3 are locked (have lock icons)
   - ✅ "Go to Inbox" button at bottom

**Expected Appearance:**

```
┌─────────────────────────────────────────────┐
│ Getting Started with easeMail               │
│ Learn the features...                       │
├─────────────────────────────────────────────┤
│ Your Progress                          0%   │
│ 0 of 11 steps complete                      │
│ [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]      │
├─────────────────────────────────────────────┤
│ ✅ Essential Setup               0/3        │
│ Get your account ready in 5 minutes         │
│ ○ Connect email account                     │
│ ○ Set up email signature        [Start]     │
│ ○ Complete your profile         [Start]     │
├─────────────────────────────────────────────┤
│ 🔒 Quick Wins                    0/3        │
│ Discover AI-powered productivity            │
│ (Locked until Phase 1 complete)             │
├─────────────────────────────────────────────┤
│ 🔒 Power User                    0/4        │
│ Unlock advanced features                    │
│ (Locked until Phase 2 complete)             │
└─────────────────────────────────────────────┘
```

---

### **3. Test Sidebar Integration**

**Steps:**

1. Look at the left sidebar navigation
2. Find "Getting Started" link (should appear below Tasks)
3. Verify it shows "0%" on the right side
4. Click the link → Should navigate to onboarding page
5. Link should highlight when active

**Expected:**

```
Sidebar:
├── Inbox
├── Sent
├── Drafts
├── Contacts
├── Calendar
├── Scheduled
├── Tasks
└── 📚 Getting Started      0%  ← This is new!
```

---

### **4. Test OAuth Redirect (First-Time Users)**

**Note:** This requires creating a NEW user account.

**Steps:**

1. Sign out of current account
2. Create a new test account
3. Go through email verification
4. Connect a Microsoft/Gmail account via OAuth
5. **After OAuth completes:**
   - ✅ Should redirect to `/dashboard/onboarding` (not inbox)
   - ✅ Should show "Connect email account" as completed (checkmark)
   - ✅ Progress should show "9% (1/11)"

**For Existing Users:**

- Connecting a 2nd email account → Should go to inbox (not onboarding)

---

### **5. Test Phase Progression**

**Manually mark steps complete to test phase unlocking:**

Run in Supabase SQL Editor:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users LIMIT 5;

-- Replace YOUR_USER_ID with actual ID
UPDATE public.onboarding_progress
SET
  email_connected = true,
  signature_configured = true,
  profile_completed = true,
  current_phase = 2
WHERE user_id = 'YOUR_USER_ID';
```

**Then refresh onboarding page:**

- ✅ Phase 1 should show all checkmarks (green background)
- ✅ Phase 2 should now be unlocked (no lock icon)
- ✅ Progress should update to "27% (3/11)"

---

### **6. Test API Endpoint**

**Steps:**

1. Open browser dev tools (F12)
2. Go to Console tab
3. Run:
   ```javascript
   fetch('/api/onboarding/progress')
     .then((r) => r.json())
     .then(console.log);
   ```

**Expected Response:**

```json
{
  "id": "...",
  "userId": "...",
  "emailConnected": false,
  "signatureConfigured": false,
  "profileCompleted": false,
  "aiReplyTried": false,
  "smartInboxViewed": false,
  "keyboardShortcutsLearned": false,
  "contactsExplored": false,
  "automationCreated": false,
  "voiceFeatureTried": false,
  "chatbotUsed": false,
  "currentPhase": 1,
  "onboardingCompleted": false,
  "completedAt": null,
  "lastViewedStep": null,
  "dismissedOnboarding": false,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### **7. Test Sidebar Auto-Hide**

**Steps:**

1. Mark all 11 steps as complete in database:

   ```sql
   UPDATE public.onboarding_progress
   SET
     email_connected = true,
     signature_configured = true,
     profile_completed = true,
     ai_reply_tried = true,
     smart_inbox_viewed = true,
     keyboard_shortcuts_learned = true,
     contacts_explored = true,
     automation_created = true,
     voice_feature_tried = true,
     chatbot_used = true,
     onboarding_completed = true,
     completed_at = NOW(),
     current_phase = 3
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. Navigate to any other page (Inbox, Contacts, etc.)
3. ✅ "Getting Started" link should disappear from sidebar

---

### **8. Test Dark Mode**

**Steps:**

1. Toggle dark mode (if available)
2. Go to onboarding page
3. Verify all colors look professional:
   - ✅ Cards have dark backgrounds
   - ✅ Text is readable
   - ✅ Progress bar visible
   - ✅ Lock icons show properly

---

## 🐛 Common Issues & Solutions

### Issue: Page shows 404

**Solution:** Make sure dev server is running (`npm run dev`)

### Issue: Sidebar link not showing

**Solution:**

- Check that you're logged in
- Verify `onboarding_progress` table was created
- Try navigating to a different page to trigger re-render

### Issue: Progress stuck at 0%

**Solution:**

- Check browser console for errors
- Verify API endpoint works (step 6 above)
- Check database connection in `.env.local`

### Issue: OAuth redirect still goes to inbox

**Solution:**

- Clear browser cache/cookies
- Make sure you're testing with a NEW account (not existing)
- Check that `emailConnected` is `false` in database before OAuth

---

## 📊 Database Queries for Testing

### View all onboarding progress records

```sql
SELECT
  op.*,
  u.email
FROM public.onboarding_progress op
JOIN auth.users u ON u.id = op.user_id
ORDER BY op.created_at DESC;
```

### Reset progress for testing

```sql
-- Replace YOUR_USER_ID
UPDATE public.onboarding_progress
SET
  email_connected = false,
  signature_configured = false,
  profile_completed = false,
  ai_reply_tried = false,
  smart_inbox_viewed = false,
  keyboard_shortcuts_learned = false,
  contacts_explored = false,
  automation_created = false,
  voice_feature_tried = false,
  chatbot_used = false,
  current_phase = 1,
  onboarding_completed = false,
  completed_at = NULL,
  dismissed_onboarding = false
WHERE user_id = 'YOUR_USER_ID';
```

### Check achievements

```sql
SELECT * FROM public.onboarding_achievements
ORDER BY unlocked_at DESC;
```

---

## ✅ Success Criteria

All items must pass:

- [ ] Onboarding page loads at `/dashboard/onboarding`
- [ ] Progress tracker shows correct percentage
- [ ] All 3 phase cards render properly
- [ ] Phase 2 and 3 are locked initially
- [ ] Sidebar shows "Getting Started" link with percentage
- [ ] Clicking sidebar link navigates to onboarding
- [ ] API endpoint returns progress JSON
- [ ] OAuth redirects first-time users to onboarding
- [ ] Marking steps complete updates progress
- [ ] Phase 2 unlocks after Phase 1 complete
- [ ] Phase 3 unlocks after Phase 2 complete
- [ ] Sidebar link hides when 100% complete
- [ ] Dark mode styling looks professional
- [ ] No console errors

---

## 🎯 Next Steps After Testing

Once all tests pass:

1. **Optional: Add Welcome Modal**
   - Import `WelcomeModal` in dashboard layout
   - Shows on first visit only

2. **Future: Interactive Tutorials (Phase 9)**
   - Create tutorial overlay component
   - Add spotlight effects
   - Build step-by-step guides

3. **Future: Video Support (Phase 10)**
   - Add video player component
   - Create tutorial videos
   - Embed in onboarding cards

4. **Auto-Detection Features**
   - Track when users actually use AI Reply
   - Auto-mark "Smart Inbox Viewed" when switching categories
   - Detect keyboard shortcut usage

---

## 📝 Manual Testing Log

Use this to track your testing:

| Test Item                  | Status | Notes |
| -------------------------- | ------ | ----- |
| Page loads                 | ⬜     |       |
| Progress tracker displays  | ⬜     |       |
| Phase cards render         | ⬜     |       |
| Phases locked correctly    | ⬜     |       |
| Sidebar link appears       | ⬜     |       |
| Sidebar link navigates     | ⬜     |       |
| API endpoint works         | ⬜     |       |
| OAuth redirect (new user)  | ⬜     |       |
| Phase progression works    | ⬜     |       |
| 100% completion hides link | ⬜     |       |
| Dark mode looks good       | ⬜     |       |
| No console errors          | ⬜     |       |

---

**Testing Date:** ******\_******
**Tested By:** ******\_******
**Environment:** Local Development
**Status:** 🟡 Ready for Testing

---

## 🎉 Completion

When all tests pass, update the status in `ONBOARDING_CENTER_COMPLETE.md` and mark the onboarding center as **Production Ready**!


