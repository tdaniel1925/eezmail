# Logo Replacement Guide

## New Logo Details

The new logo is the **easemail** logo with:

- Blue laptop/envelope icon on the left
- "easemail" text in a modern blue font
- Horizontal layout
- Clean, professional design

---

## Steps to Replace Logo

### 1. Save the New Logo File

**Location:** `public/images/easemail-logo.png`

**How to save:**

1. Save the logo image you provided as `easemail-logo.png`
2. Replace the existing file at: `C:\dev\win-email_client\public\images\easemail-logo.png`

**Recommended image specs:**

- Format: PNG (with transparency)
- Width: 600-800px (for retina displays)
- Height: Proportional (approximately 150-200px based on aspect ratio)
- Background: Transparent

---

## Files That Use the Logo

The logo is currently used in 3 places:

### 1. Sidebar (Dashboard)

**File:** `src/components/sidebar/ModernSidebar.tsx`  
**Line:** 111  
**Current dimensions:** 140x32

```typescript
<Image
  src="/images/easemail-logo.png"
  alt="easeMail"
  width={140}
  height={32}
  className="..."
/>
```

### 2. Login Page

**File:** `src/app/(auth)/login/page.tsx`  
**Line:** 71  
**Current dimensions:** 220x50

```typescript
<Image
  src="/images/easemail-logo.png"
  alt="easeMail"
  width={220}
  height={50}
  className="..."
/>
```

### 3. Marketing Navigation

**File:** `src/components/marketing/MarketingNav.tsx`  
**Line:** 65  
**Current dimensions:** 180x40

```typescript
<Image
  src="/images/easemail-logo.png"
  alt="easeMail"
  width={180}
  height={40}
  className="..."
/>
```

---

## Dimension Adjustments (If Needed)

If the new logo has a different aspect ratio, you may need to adjust the dimensions in the code.

**To calculate proper dimensions:**

1. Get the actual logo image dimensions (e.g., 800x200 = 4:1 ratio)
2. Maintain the aspect ratio when resizing
3. Update the width/height props in each component

**Example:** If your logo is 800x200 (4:1 ratio):

- Sidebar: `width={128} height={32}` (4:1 maintained)
- Login: `width={200} height={50}` (4:1 maintained)
- Marketing Nav: `width={160} height={40}` (4:1 maintained)

---

## Quick Replacement Steps

### Option 1: Just Replace the File (Easiest)

1. Save your new logo as `easemail-logo.png`
2. Copy it to: `C:\dev\win-email_client\public\images\easemail-logo.png`
3. Overwrite the existing file
4. Refresh your browser (Ctrl+Shift+R to clear cache)
5. Done! ✅

### Option 2: Adjust Dimensions (If aspect ratio changed)

1. Replace the file (as above)
2. Check the actual dimensions of your new logo
3. Calculate the aspect ratio (width ÷ height)
4. Update dimensions in the 3 files listed above
5. Maintain the aspect ratio for each usage

---

## Automatic Updates

Once you replace the file at `public/images/easemail-logo.png`, the logo will automatically update in:

- ✅ Sidebar (all dashboard pages)
- ✅ Login page
- ✅ Signup page (likely uses same component)
- ✅ Marketing pages (homepage, features, etc.)

---

## Testing Checklist

After replacing the logo:

- [ ] Check sidebar on dashboard page
- [ ] Check login page
- [ ] Check marketing/landing pages
- [ ] Check logo on mobile (responsive)
- [ ] Verify logo looks crisp (not blurry)
- [ ] Check dark mode if applicable

---

## Troubleshooting

### Logo not updating?

- Clear browser cache (Ctrl+Shift+R)
- Hard refresh the page
- Restart Next.js dev server (`npm run dev`)

### Logo looks blurry?

- Use a higher resolution image (2x or 3x size)
- Ensure PNG format with transparency
- Check image compression settings

### Logo too big/small?

- Adjust width/height props in the component files
- Maintain aspect ratio
- Test on different screen sizes

---

## Current vs New Logo

**Current Logo:** `easemail-logo.png` (existing file)  
**New Logo:** Your provided image (blue laptop + "easemail" text)

**Visual difference:**

- The new logo has a distinct blue color scheme
- Features a laptop/envelope icon
- Modern, clean typography
- Professional business appearance

---

## Need to Update Dimensions?

If you need me to update the code dimensions, please provide:

1. The actual pixel dimensions of your new logo (e.g., "800 x 200")
2. Or confirm if the aspect ratio is different from current

I can then update all 3 files with the correct dimensions.

---

## Summary

**Quickest method:** Just replace `public/images/easemail-logo.png` with your new logo file!

**File to replace:** `C:\dev\win-email_client\public\images\easemail-logo.png`

**No code changes needed** unless the aspect ratio is significantly different.

---

Let me know if you need help adjusting the dimensions in the code!
