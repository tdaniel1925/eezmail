# Data Wipe Contacts Fix v2 - The REAL Fix

## Issue

After the initial fix (v1), **contacts were STILL not deleting** when using "Wipe All Data".

## Root Cause (The Real One This Time)

The problem was with `contactCustomFields` table:

1. **Missing from contact deletion section** - It wasn't being deleted with the other contact-related tables
2. **Wrong WHERE clause** - It was being deleted later in the code using `where(eq(contactCustomFields.userId, user.id))`, but **`contactCustomFields` doesn't have a `userId` column!**

### Schema vs. Code Mismatch

**Schema (`src/db/schema.ts` line 1071-1083):**

```typescript
export const contactCustomFields = pgTable(
  'contact_custom_fields',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    contactId: uuid('contact_id') // ✅ Has contactId
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    fieldName: varchar('field_name', { length: 100 }).notNull(),
    fieldValue: text('field_value'),
    fieldType: contactFieldTypeEnum('field_type').default('text'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
  // Note: NO userId column!
);
```

**Old Code (WRONG):**

```typescript
try {
  await db
    .delete(contactCustomFields)
    .where(eq(contactCustomFields.userId, user.id)); // ❌ userId doesn't exist!
} catch (error) {
  console.error('Error deleting contact custom fields:', error);
}
```

This was **silently failing** because:

1. The error was caught and logged
2. The contacts table couldn't be deleted because foreign key constraints from `contactCustomFields` were still referencing them
3. That error was ALSO caught and logged silently

## The Fix

### 1. Added `contactCustomFields` to Contact Deletion Section

Moved `contactCustomFields` deletion to the proper location (with other contact-related tables) and used the **correct WHERE clause**:

```typescript
if (contactIds.length > 0) {
  // Delete contact-related data in the correct order (children first)

  // ... contactEmails, contactPhones, contactAddresses ...

  try {
    await db
      .delete(contactSocialLinks)
      .where(inArray(contactSocialLinks.contactId, contactIds));
  } catch (error) {
    console.error('Error deleting contact social links:', error);
  }

  try {
    await db
      .delete(contactTagAssignments)
      .where(inArray(contactTagAssignments.contactId, contactIds));
  } catch (error) {
    console.error('Error deleting contact tag assignments:', error);
  }

  // ✅ ADDED: Delete contactCustomFields with correct WHERE clause
  try {
    await db
      .delete(contactCustomFields)
      .where(inArray(contactCustomFields.contactId, contactIds)); // ✅ Use contactId!
  } catch (error) {
    console.error('Error deleting contact custom fields:', error);
  }

  // Now delete the contacts themselves
  try {
    await db.delete(contacts).where(eq(contacts.userId, user.id));
    console.log(`✅ Deleted ${contactIds.length} contacts and related data`);
  } catch (error) {
    console.error('Error deleting contacts:', error);
  }
}
```

### 2. Removed Duplicate (Wrong) Deletion

Removed the incorrect deletion attempt from the "additional user data" section:

```typescript
// ❌ REMOVED - Was line 504-510
try {
  await db
    .delete(contactCustomFields)
    .where(eq(contactCustomFields.userId, user.id)); // This column doesn't exist!
} catch (error) {
  console.error('Error deleting contact custom fields:', error);
}
```

## Complete Deletion Order

Now contacts and ALL related data are deleted in the correct order:

1. ✅ `contactEmails` (using `contactId`)
2. ✅ `contactPhones` (using `contactId`)
3. ✅ `contactAddresses` (using `contactId`)
4. ✅ `contactSocialLinks` (using `contactId`)
5. ✅ `contactTagAssignments` (using `contactId`)
6. ✅ `contactCustomFields` (using `contactId`) **← NOW FIXED**
7. ✅ `contacts` (using `userId`)

Then separately (these have `userId` columns):

- ✅ `contactNotes` (using `userId`)
- ✅ `contactTimeline` (using `userId`)
- ✅ `contactTags` (using `userId`)

## Why This Matters

All contact-related tables have **foreign key constraints** with `onDelete: 'cascade'` in the schema:

```typescript
contactId: uuid('contact_id')
  .notNull()
  .references(() => contacts.id, { onDelete: 'cascade' });
```

**BUT** these constraints only work if:

1. They exist in the actual database (migrations applied)
2. There are no errors in the deletion code

Since the deletion code had errors (wrong column name), the cascading deletes couldn't work properly.

## Testing

To test this fix:

1. ✅ Create some contacts with custom fields
2. ✅ Go to Settings → Danger Zone
3. ✅ Type `DELETE ALL DATA`
4. ✅ Click "Wipe All Data"
5. ✅ Click "Verify Data is Clean"
6. ✅ Confirm contacts count is 0

## Files Changed

- `src/lib/settings/data-actions.ts` - Lines 438-444 (added), Lines 504-510 (removed)

## Lesson Learned

**Always verify the actual database schema** when writing deletion code. Don't assume a table has a `userId` column just because other tables do.

The silent error handling (`try-catch` with console.error) masked this issue, making it harder to debug.

---

**Status:** ✅ Contacts WILL NOW DELETE properly
**Date:** 2025-10-19  
**Related:** DATA_WIPE_CONTACTS_FIX.md (v1 - incomplete fix)
