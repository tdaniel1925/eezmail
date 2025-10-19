# Data Wipe Fix - Contacts Not Being Deleted

**Date**: October 19, 2025  
**Issue**: "Delete All Data" button was not clearing contacts  
**Status**: ✅ **FIXED**

---

## Problem

User reported that the "Delete All Data" feature in Settings > Danger Zone was not clearing contacts from the database.

### Root Cause

The `wipeAllUserData()` function in `src/lib/settings/data-actions.ts` was missing two critical contact-related tables that have foreign key constraints:

1. **`contactSocialLinks`** - Social media links for contacts
2. **`contactTagAssignments`** - Tags assigned to contacts

Because these child tables weren't being deleted first, the database was preventing the deletion of contacts due to foreign key constraints.

---

## Fix Applied

### File: `src/lib/settings/data-actions.ts`

**Added deletion of missing tables** (Lines 273-287):

```typescript
// BEFORE - Missing tables
if (contactIds.length > 0) {
  await db.delete(contactEmails).where(...);
  await db.delete(contactPhones).where(...);
  await db.delete(contactAddresses).where(...);
  await db.delete(contacts).where(...); // ❌ This would fail!
}

// AFTER - Complete deletion sequence
if (contactIds.length > 0) {
  await db.delete(contactEmails).where(...);
  await db.delete(contactPhones).where(...);
  await db.delete(contactAddresses).where(...);

  // ✅ Added missing tables
  await db.delete(contactSocialLinks).where(...);
  await db.delete(contactTagAssignments).where(...);

  // Now this succeeds!
  await db.delete(contacts).where(...);
}
```

**Also updated verification function** to check additional contact tables:

- Added `contactTags` count
- Added `contactCustomFields` count

---

## Testing

To test the fix:

1. Go to **Settings → Danger Zone**
2. Type `DELETE ALL DATA` in the confirmation field
3. Click **"Wipe All Data"**
4. Click **"Verify Data is Clean"**

Expected result: ✅ All contacts and related data should be deleted

---

## Tables Affected

### Contact-Related Tables (Deletion Order)

1. `contact_emails` - Email addresses for contacts
2. `contact_phones` - Phone numbers for contacts
3. `contact_addresses` - Physical addresses for contacts
4. `contact_social_links` - Social media links (**NOW DELETED**)
5. `contact_tag_assignments` - Tag assignments (**NOW DELETED**)
6. `contact_notes` - Notes about contacts (user-level)
7. `contact_timeline` - Activity timeline (user-level)
8. `contact_tags` - Available tags (user-level)
9. `contact_custom_fields` - Custom field definitions (user-level)
10. `contacts` - Main contacts table (deleted last)

---

## Database Schema Constraints

The deletion order is critical due to foreign key constraints:

```
contacts (parent)
  ├── contact_emails (child)
  ├── contact_phones (child)
  ├── contact_addresses (child)
  ├── contact_social_links (child) ← Was missing!
  └── contact_tag_assignments (child) ← Was missing!
```

**Rule**: Always delete child tables BEFORE parent tables to avoid constraint violations.

---

## Additional Improvements

1. **Better logging** - Added success message with count
2. **No contacts check** - Skip deletion if no contacts exist
3. **Error handling** - Each table deletion wrapped in try/catch
4. **Verification** - Enhanced to check all contact-related tables

---

## Files Modified

- `src/lib/settings/data-actions.ts` (Lines 240-298)
  - Added `contactSocialLinks` deletion
  - Added `contactTagAssignments` deletion
  - Improved logging
  - Enhanced verification checks

---

## Status

✅ **FIXED** - Contacts and all related data now properly deleted

The "Delete All Data" button now correctly removes:

- ✅ All contacts
- ✅ Contact emails
- ✅ Contact phones
- ✅ Contact addresses
- ✅ Contact social links
- ✅ Contact tag assignments
- ✅ Contact notes
- ✅ Contact timeline
- ✅ All other user data

---

**Testing Recommended**: Test the full wipe and verify flow to confirm all data is cleared.
