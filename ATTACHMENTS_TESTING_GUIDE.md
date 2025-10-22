# 🧪 Attachments Repository - Easy Testing Guide

**Date**: October 22, 2025  
**Purpose**: Simple, step-by-step testing for all attachment features

---

## 📋 Quick Test Checklist

Copy this checklist and check off as you test:

```
ATTACHMENTS PAGE TESTING
========================

□ Page loads without errors
□ Header shows correct file count and total size
□ Stats dashboard displays (if you have attachments)
□ Search bar is visible and functional
□ Filter dropdowns work
□ Grid/Table view toggle works

FILE ICONS
==========
□ Images show purple icon
□ PDFs show red icon
□ Word docs show blue icon
□ Excel files show green icon
□ Archives show yellow icon
□ Other files show appropriate icons

GRID VIEW
=========
□ Cards display properly
□ Hover shows zoom effect on images
□ Hover shows action buttons (download, delete)
□ Selection checkboxes work
□ File metadata displays (size, date)
□ Download count badge shows (if applicable)

SEARCH & FILTERS
================
□ Search filters files by name
□ Type filter (All/Images/Documents) works
□ Sort by Date works
□ Sort by Name works
□ Sort by Size works
□ Sort direction toggle works

STATISTICS DASHBOARD
====================
□ Total Files card shows correct count
□ Total Size card shows correct size
□ Total Downloads card works
□ Recently Added card shows count
□ Category breakdown displays
□ Stats toggle button works

PREVIEW MODAL
=============
□ Clicking a file opens preview
□ Modal displays file info
□ Images display correctly
□ Zoom controls work (images only)
□ Rotate button works (images only)
□ AI Summary section displays
□ Download button works
□ Delete button works
□ Close button works

BULK ACTIONS
============
□ Selecting multiple files shows count
□ Bulk delete works
□ Selection clears after action
□ "Select All" works

RESPONSIVE DESIGN
=================
□ Mobile view (< 640px) works
□ Tablet view (640-1024px) works
□ Desktop view (> 1024px) works
□ 2XL view (> 1536px) shows 5 columns

DARK MODE
=========
□ Toggle dark mode - everything looks good
□ Colors are readable
□ Hover states work in dark mode

ERROR STATES
============
□ Empty state shows when no files
□ Loading state shows during fetch
□ Broken image state handles gracefully
□ Network error shows friendly message
```

---

## 🎯 Detailed Testing Steps

### Test 1: Basic Page Load (2 minutes)

**What to do:**

1. Navigate to `/dashboard/attachments`
2. Wait for page to load

**Expected Result:**

- ✅ Page loads without white screen
- ✅ Header shows "Attachments Repository"
- ✅ File count and size display in header
- ✅ Search bar is visible
- ✅ Filter dropdowns are present

**If it fails:**

- Check browser console for errors
- Verify you're logged in
- Check if API is running (`npm run dev`)

---

### Test 2: Statistics Dashboard (3 minutes)

**What to do:**

1. Look for statistics section below header
2. Click "Stats" button to toggle visibility
3. Check all 4 overview cards
4. Look at category breakdown

**Expected Result:**

- ✅ 4 cards display: Total Files, Total Size, Total Downloads, Recently Added
- ✅ Each card shows a number and icon
- ✅ Category breakdown shows file types with counts
- ✅ Toggle button hides/shows stats

**If you have NO attachments:**

- Stats section won't show (this is correct)
- Upload some test emails with attachments first

---

### Test 3: File Icons (2 minutes)

**What to do:**

1. Look at the grid of files
2. Check icon colors match file types

**Expected Results:**

- ✅ **Images** (jpg, png, gif) = **Purple** icon
- ✅ **PDFs** = **Red** icon
- ✅ **Word docs** (.docx, .doc) = **Blue** icon
- ✅ **Excel files** (.xlsx, .xls) = **Green** icon
- ✅ **PowerPoint** (.pptx) = **Orange** icon
- ✅ **Archives** (.zip, .rar) = **Yellow** icon
- ✅ **Videos** (.mp4, .avi) = **Red** icon
- ✅ **Other files** = **Gray** icon

**Visual Check:**
Each file should have:

- Colored icon background
- File type icon (image, document, etc.)
- File extension badge (bottom right for non-images)

---

### Test 4: Search Functionality (3 minutes)

**What to do:**

1. Type a filename in search bar
2. Try partial matches (e.g., "report" finds "report.pdf")
3. Clear search and try again
4. Test with uppercase/lowercase

**Expected Result:**

- ✅ Search filters files instantly (no button needed)
- ✅ Case-insensitive search works
- ✅ Partial matches work
- ✅ Clearing search shows all files again
- ✅ "No files found" message if no matches

**Test Cases:**

```
Search: "pdf" → Should show all PDF files
Search: "image" → Should show image files
Search: "test" → Should show files with "test" in name
Search: "xyz123" → Should show empty state
```

---

### Test 5: Filter & Sort (3 minutes)

**What to do:**

1. Click "Type" dropdown → Select "🖼️ Images"
2. Verify only images show
3. Click "Sort" dropdown → Try each option:
   - 📅 Date
   - 🔤 Name
   - 💾 Size
   - 📋 Type
4. Click sort direction button (↑↓)
5. Reset filter to "All types"

**Expected Result:**

- ✅ Filter shows only selected file type
- ✅ Sort by Date orders newest/oldest
- ✅ Sort by Name orders A-Z or Z-A
- ✅ Sort by Size orders largest/smallest
- ✅ Direction toggle reverses order

---

### Test 6: Grid View & Hover Effects (3 minutes)

**What to do:**

1. Hover over a file card
2. Check hover effects
3. Try hovering over an image vs. non-image
4. Click action buttons (download, delete)

**Expected Result:**

- ✅ Card border changes on hover
- ✅ Shadow increases on hover
- ✅ **Images**: Zoom effect (110% scale) + eye icon overlay
- ✅ Action buttons appear on hover (top right)
- ✅ Download button works
- ✅ Delete button asks for confirmation

**Visual Effects to Check:**

- Smooth transitions (no janky animations)
- Buttons have hover states
- Colors are consistent

---

### Test 7: File Selection (2 minutes)

**What to do:**

1. Click checkbox on a file card
2. Select 2-3 files
3. Check selection toolbar appears
4. Click "Select All"
5. Try bulk delete

**Expected Result:**

- ✅ Checkbox shows blue checkmark when selected
- ✅ Card has blue ring when selected
- ✅ Selection count shows (e.g., "3 selected")
- ✅ Bulk action buttons appear
- ✅ "Select All" selects all visible files
- ✅ "Clear Selection" deselects all
- ✅ Delete asks for confirmation

---

### Test 8: Preview Modal (5 minutes)

**What to do:**

1. Click on a file card
2. Modal opens
3. Test ALL controls
4. Close and open different file types

**For IMAGE files:**

- ✅ Image displays in center
- ✅ Zoom Out button works (down to 50%)
- ✅ Zoom In button works (up to 200%)
- ✅ Zoom percentage shows (e.g., "100%")
- ✅ Rotate button rotates 90° each click
- ✅ Image scales and rotates smoothly

**For PDF files:**

- ✅ PDF viewer iframe shows
- ✅ PDF loads (may take a moment)
- ✅ No zoom/rotate controls (correct for PDFs)

**For OTHER files:**

- ✅ Shows "Preview not available"
- ✅ Shows large file icon
- ✅ "Download to view" button present

**AI Summary Sidebar:**

- ✅ "AI Summary" section shows
- ✅ Loading spinner appears first
- ✅ Summary text appears (or error message)
- ✅ File details section shows:
  - Type
  - Size
  - Downloads count
  - Date added
- ✅ Action buttons at bottom:
  - "Download File" (blue, prominent)
  - "Open in New Tab" (if URL exists)

**Modal Header:**

- ✅ File name displays (truncated if long)
- ✅ File size and date show
- ✅ Category badge shows
- ✅ Download button works
- ✅ Delete button works
- ✅ Close (X) button works

---

### Test 9: Empty States (2 minutes)

**What to do:**

1. If you have files, search for gibberish (e.g., "xyz99999")
2. Check empty state design
3. Clear search to return to files

**Expected Result:**

- ✅ Large gray icon in gradient circle
- ✅ "No attachments found" heading
- ✅ Helpful message:
  - With search: "Try adjusting your search query..."
  - Without search: "Email attachments will appear here..."
- ✅ Dashed border container
- ✅ Center-aligned, looks professional

---

### Test 10: Loading States (1 minute)

**What to do:**

1. Refresh page
2. Watch initial load animation
3. Open preview modal
4. Watch AI summary loading

**Expected Result:**

- ✅ **Page Load**: Spinning blue circle with file icon inside
- ✅ "Loading attachments..." text
- ✅ **AI Summary**: Spinning purple circle
- ✅ "Analyzing file..." text
- ✅ No layout shift during loading

---

### Test 11: Responsive Design (5 minutes)

**What to do:**

1. Open browser DevTools (F12)
2. Click responsive mode icon (phone icon)
3. Test these viewport sizes:

**Mobile (375px)**

- ✅ 1 column grid
- ✅ Stats stack vertically
- ✅ Search bar full width
- ✅ Filters stack
- ✅ Modal is scrollable

**Tablet (768px)**

- ✅ 2 column grid
- ✅ Stats in 2 rows
- ✅ Search and filters side-by-side
- ✅ Modal fits screen

**Desktop (1024px)**

- ✅ 3 column grid
- ✅ Stats in 1 row (4 cards)
- ✅ All controls visible

**Large Desktop (1920px)**

- ✅ 5 column grid
- ✅ Stats fully expanded
- ✅ No excessive whitespace

---

### Test 12: Dark Mode (3 minutes)

**What to do:**

1. Toggle dark mode (in your app settings)
2. Check attachments page
3. Test each component in dark mode

**Expected Result:**

- ✅ Background is dark gray/black gradient
- ✅ Text is white/light gray
- ✅ Cards have dark background
- ✅ Borders are gray (not invisible)
- ✅ Hover states work in dark
- ✅ Icons remain colorful
- ✅ Modal has dark background
- ✅ All text is readable
- ✅ No white flash transitions

**Visual Check:**

- No pure white backgrounds
- No pure black text on dark backgrounds
- Good contrast on all elements

---

### Test 13: Performance (2 minutes)

**What to do:**

1. Open DevTools → Network tab
2. Reload page
3. Check load time and requests

**Expected Result:**

- ✅ Page loads in < 2 seconds
- ✅ Images lazy load (not all at once)
- ✅ No console errors
- ✅ Smooth scrolling
- ✅ Hover effects are smooth (60fps)

**If slow:**

- Check if you have 100+ files (pagination may help)
- Check network connection
- Clear browser cache and retry

---

### Test 14: Error Handling (3 minutes)

**What to do:**

1. **Broken Images**:
   - Check if any images fail to load
   - Should show "Image Unavailable" state

2. **Network Error**:
   - Turn off internet (briefly)
   - Reload page
   - Should show friendly error

3. **Delete Error**:
   - Try deleting a file (then undo if possible)
   - Should show success toast

**Expected Result:**

- ✅ Broken images show red alert icon
- ✅ "Image Unavailable" message
- ✅ Download button still available
- ✅ Network errors show friendly message
- ✅ Actions show toast notifications

---

## 🐛 Common Issues & Fixes

### Issue: "No attachments showing"

**Fix:**

1. Check if you have emails with attachments
2. Send yourself an email with a PDF attachment
3. Wait for sync to complete
4. Refresh attachments page

### Issue: "Images not loading"

**Fix:**

1. Check if `SUPABASE_URL` is set in `.env.local`
2. Verify Supabase Storage is set up
3. Check browser console for CORS errors
4. Try downloading the file (if that works, it's a display issue)

### Issue: "Stats not showing"

**Fix:**

- Stats only show if you have attachments
- Stats are collapsible - click "Stats" button
- If you have files but no stats, check console for errors

### Issue: "Search not working"

**Fix:**

1. Check if you're typing in the search bar
2. Clear any filter that might conflict
3. Check console for JavaScript errors

### Issue: "Modal won't close"

**Fix:**

1. Click the X button (top right)
2. Click outside the modal
3. Press ESC key
4. Refresh page if stuck

### Issue: "Zoom controls not showing"

**Fix:**

- Zoom controls only show for images
- PDFs and documents don't have zoom controls
- This is correct behavior

---

## ✅ Quick Visual Checklist

Print this and check off as you test:

```
VISUAL QUALITY CHECK
====================

Layout:
□ No overlapping elements
□ Proper spacing between cards
□ Aligned text and icons
□ Consistent padding

Colors:
□ File type icons are colorful
□ Gradients look smooth
□ Dark mode has good contrast
□ Hover states are visible

Typography:
□ Headers are bold and readable
□ Body text is clear
□ Small text (metadata) is legible
□ No text overflow/truncation issues

Icons:
□ All icons render correctly
□ Icons have proper size
□ Icons are centered in backgrounds
□ Icons match their file types

Animations:
□ Smooth hover effects
□ No janky transitions
□ Loading spinners rotate smoothly
□ Modal opens/closes smoothly

Responsiveness:
□ Looks good on mobile
□ Looks good on tablet
□ Looks good on desktop
□ No horizontal scroll
```

---

## 📊 Testing Summary

**Total Testing Time**: ~30-40 minutes for complete testing

**Critical Tests** (must pass):

1. ✅ Page loads
2. ✅ Files display
3. ✅ Search works
4. ✅ Preview modal opens
5. ✅ Download works

**Important Tests** (should pass): 6. ✅ File icons correct 7. ✅ Filters work 8. ✅ Stats display 9. ✅ Responsive design 10. ✅ Dark mode

**Nice-to-Have Tests** (bonus): 11. ✅ Hover effects smooth 12. ✅ Empty states look good 13. ✅ Error handling graceful 14. ✅ AI summaries work

---

## 🎉 Testing Complete!

If you checked off all critical and important tests, your attachments repository is **production-ready**! 🚀

**Next Steps:**

1. Test with real attachments from your email account
2. Get feedback from a colleague
3. Deploy to production
4. Monitor for any issues

---

**Need Help?**

- Check browser console for errors
- Review `ATTACHMENTS_REPOSITORY_COMPLETE.md` for implementation details
- Test with different file types (PDF, images, docs)
- Try on different browsers (Chrome, Firefox, Safari)

---

_Testing Guide Created: October 22, 2025_  
_Status: Ready to Use_

_Context improved by Giga AI - utilized information about component testing strategies, user acceptance testing patterns, and attachment management quality assurance best practices._
