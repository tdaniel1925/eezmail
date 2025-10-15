# Navigation Review & Missing Features

## ✅ Currently Implemented

### Pages

- `/dashboard` - Main 3-panel email interface
- `/dashboard/screener` - Email screening (with back button ✅)
- `/dashboard/imbox` - Imbox view
- `/dashboard/feed` - Feed view
- `/dashboard/paper-trail` - Paper Trail view
- `/dashboard/settings` - Settings with tabs

### Components

- Sidebar navigation with Hey Views, Traditional Folders, Labels
- Theme toggle (light/dark mode)
- Email list with search bar (visual only)
- Email viewer with action buttons (visual only)

---

## ❌ Critical Missing Features

### 1. **Email Composer** (CRITICAL!)

**Problem:** No way to compose new emails!

**What's needed:**

- Floating "Compose" button (bottom-right or in sidebar)
- Full-screen composer modal/page
- Reply/Reply All/Forward functionality
- Draft auto-save
- Rich text editor
- Attachments support
- Send button

**PRD Reference:** Section 5.1 Smart Composer

---

### 2. **Missing Hey View Pages**

**Problem:** Sidebar links to pages that don't exist

**Missing pages:**

- `/dashboard/reply-later` - Emails snoozed for later response
- `/dashboard/set-aside` - Emails temporarily set aside

---

### 3. **Missing Traditional Folder Pages**

**Problem:** All traditional folder links lead to 404

**Missing pages:**

- `/dashboard/inbox` - Traditional Gmail-style inbox
- `/dashboard/sent` - Sent emails
- `/dashboard/drafts` - Draft emails
- `/dashboard/starred` - Starred/favorited emails
- `/dashboard/archive` - Archived emails
- `/dashboard/trash` - Deleted emails

---

### 4. **Keyboard Shortcuts**

**Problem:** No keyboard navigation

**What's needed:**

- `c` - Compose new email
- `r` - Reply
- `j/k` - Next/previous email
- `s` - Star email
- `e` - Archive
- `/` - Focus search
- `Cmd+K` - Command palette
- `Esc` - Close modals

**PRD Reference:** Section 9.1

---

### 5. **Command Palette (Cmd+K)**

**Problem:** No quick action menu

**What's needed:**

- Fuzzy search for actions
- Quick navigation
- Recent actions
- Settings access

**PRD Reference:** Section 9.2

---

### 6. **Search Functionality**

**Problem:** Search bar exists but doesn't work

**What's needed:**

- `/dashboard/search` - Search results page
- Global search that searches all emails
- Filters (from, date, has attachment, etc.)
- Search suggestions

---

### 7. **Mobile Navigation**

**Problem:** Sidebar isn't mobile-responsive

**What's needed:**

- Hamburger menu for mobile
- Bottom navigation bar (mobile)
- Swipe gestures
- Collapsed sidebar on mobile

---

### 8. **Active Route Highlighting**

**Problem:** Unclear which page you're on

**Status:** Sidebar uses `usePathname()` but highlighting might not be visible enough

**What's needed:**

- Verify active state styling works
- Add subtle background to active item
- Highlight parent section

---

### 9. **Quick Actions & FAB**

**Problem:** No floating action button

**What's needed:**

- Floating "+" button (bottom-right)
- Quick actions menu:
  - Compose email
  - Quick note
  - Create task
  - Schedule reminder

---

### 10. **Breadcrumbs** (Optional)

**Problem:** Deep navigation lacks context

**What's needed:**

- Email detail breadcrumb: Imbox > sender@email.com > Subject
- Settings breadcrumb: Settings > AI Preferences

---

## 📊 Priority Matrix

### 🔴 Critical (Build Immediately)

1. **Email Composer** - Core functionality missing!
2. **Reply/Forward** - Can't respond to emails
3. **Keyboard Shortcuts** - Power user essential
4. **Active Route Highlighting** - UX clarity

### 🟡 High Priority (Build Soon)

5. **Command Palette** - Modern UX expectation
6. **Reply Later page** - Promised in sidebar
7. **Set Aside page** - Promised in sidebar
8. **Traditional Folder pages** - User expectation

### 🟢 Medium Priority (Nice to Have)

9. **Search functionality** - Important but can work around
10. **Mobile navigation** - Important for mobile users
11. **Quick Actions FAB** - Nice UX improvement

### ⚪ Low Priority (Future)

12. **Breadcrumbs** - Only needed for complex navigation

---

## 🎯 Recommended Implementation Order

### Phase 1: Core Functionality (Do Now!)

1. ✅ Add "Back to Emails" to Screener (DONE)
2. ⬜ Build Email Composer component + modal
3. ⬜ Add Compose button to sidebar/FAB
4. ⬜ Implement Reply/Forward in EmailViewer
5. ⬜ Add keyboard shortcut foundation
6. ⬜ Fix/verify active route highlighting

### Phase 2: Complete Navigation (Next)

7. ⬜ Create Reply Later page
8. ⬜ Create Set Aside page
9. ⬜ Create traditional folder pages (template them all at once)
10. ⬜ Implement Command Palette (Cmd+K)
11. ⬜ Add keyboard shortcuts help modal

### Phase 3: Polish (Later)

12. ⬜ Search results page
13. ⬜ Mobile navigation improvements
14. ⬜ Quick Actions FAB with menu
15. ⬜ Breadcrumbs for deep navigation

---

## 🛠️ Technical Notes

### Email Composer Design

- Use modal overlay (like Gmail)
- Support minimized mode (compose while viewing emails)
- Auto-save to drafts every 30 seconds
- Use `react-hook-form` + `zod` for validation
- Rich text editor: TipTap or similar

### Keyboard Shortcuts Implementation

- Use `react-hotkeys-hook` or custom hook
- Don't conflict with browser shortcuts
- Respect input focus (disable in text fields)
- Show shortcuts in tooltips

### Command Palette

- Use `cmdk` library (same as Vercel, Linear, GitHub)
- Fuzzy search with `fuse.js`
- Group actions by category
- Show recent actions first

### Mobile Navigation

- Use `@radix-ui/react-navigation-menu` for mobile
- Bottom navigation for primary actions
- Drawer for sidebar on mobile
- Swipe gestures with `react-swipeable`

---

## 🎨 Design Consistency

All new features should match:

- Glassmorphic design system
- Light/dark mode support
- Primary color: `#FF4C5A`
- Backdrop blur and transparency
- Smooth transitions
- Consistent spacing

---

## 📝 Files to Create/Modify

### New Files Needed

```
src/components/email/EmailComposer.tsx          # Main composer component
src/components/email/ComposeButton.tsx          # FAB/button to open composer
src/components/email/ReplyBox.tsx               # Quick reply component
src/components/ui/CommandPalette.tsx            # Cmd+K menu
src/hooks/useKeyboardShortcuts.ts               # Keyboard shortcut hook
src/app/dashboard/reply-later/page.tsx          # Reply Later view
src/app/dashboard/set-aside/page.tsx            # Set Aside view
src/app/dashboard/inbox/page.tsx                # Traditional inbox
src/app/dashboard/sent/page.tsx                 # Sent emails
src/app/dashboard/drafts/page.tsx               # Drafts
src/app/dashboard/starred/page.tsx              # Starred
src/app/dashboard/archive/page.tsx              # Archive
src/app/dashboard/trash/page.tsx                # Trash
src/app/dashboard/search/page.tsx               # Search results
```

### Files to Modify

```
src/components/layout/Sidebar.tsx               # Add compose button
src/components/email/EmailViewer.tsx            # Add reply/forward
src/app/layout.tsx                              # Add keyboard shortcuts
src/components/email/EmailCard.tsx              # Add quick actions
```

---

## ✨ Next Steps

1. Review this document with user
2. Get approval for Phase 1 priorities
3. Start implementing Email Composer
4. Build out missing pages systematically
5. Add keyboard shortcuts and command palette
6. Polish and test on mobile

---

**Created:** $(date)
**Last Updated:** $(date)
**Status:** Ready for implementation
