'use server';

import { db } from '@/lib/db';
import { contactCustomFields, contacts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type { NewContactCustomField } from '@/db/schema';
import { CustomFieldSchema, type CustomFieldInput } from './validation';

// ============================================================================
// ADD CUSTOM FIELD
// ============================================================================

export async function addCustomField(
  contactId: string,
  userId: string,
  fieldData: CustomFieldInput
): Promise<{ success: boolean; fieldId?: string; error?: string }> {
  try {
    // Validate input
    const validated = CustomFieldSchema.parse(fieldData);

    // Verify contact ownership
    const [contact] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Create custom field
    const newField: NewContactCustomField = {
      contactId,
      fieldName: validated.fieldName,
      fieldValue: validated.fieldValue || null,
      fieldType: validated.fieldType,
    };

    const [createdField] = await db
      .insert(contactCustomFields)
      .values(newField)
      .returning();

    revalidatePath('/dashboard/contacts');
    return { success: true, fieldId: createdField.id };
  } catch (error) {
    console.error('Error adding custom field:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add custom field' };
  }
}

// ============================================================================
// UPDATE CUSTOM FIELD
// ============================================================================

export async function updateCustomField(
  fieldId: string,
  userId: string,
  fieldValue: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get field and verify ownership through contact
    const [field] = await db
      .select({
        field: contactCustomFields,
        contact: contacts,
      })
      .from(contactCustomFields)
      .innerJoin(contacts, eq(contactCustomFields.contactId, contacts.id))
      .where(
        and(eq(contactCustomFields.id, fieldId), eq(contacts.userId, userId))
      )
      .limit(1);

    if (!field) {
      return { success: false, error: 'Custom field not found' };
    }

    // Update field
    await db
      .update(contactCustomFields)
      .set({
        fieldValue,
        updatedAt: new Date(),
      })
      .where(eq(contactCustomFields.id, fieldId));

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error updating custom field:', error);
    return { success: false, error: 'Failed to update custom field' };
  }
}

// ============================================================================
// DELETE CUSTOM FIELD
// ============================================================================

export async function deleteCustomField(
  fieldId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get field and verify ownership through contact
    const [field] = await db
      .select({
        field: contactCustomFields,
        contact: contacts,
      })
      .from(contactCustomFields)
      .innerJoin(contacts, eq(contactCustomFields.contactId, contacts.id))
      .where(
        and(eq(contactCustomFields.id, fieldId), eq(contacts.userId, userId))
      )
      .limit(1);

    if (!field) {
      return { success: false, error: 'Custom field not found' };
    }

    // Delete field
    await db
      .delete(contactCustomFields)
      .where(eq(contactCustomFields.id, fieldId));

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting custom field:', error);
    return { success: false, error: 'Failed to delete custom field' };
  }
}

