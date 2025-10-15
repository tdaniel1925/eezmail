'use server';

import { db } from '@/lib/db';
import {
  contacts,
  contactEmails,
  contactPhones,
  contactAddresses,
  contactSocialLinks,
  contactTagAssignments,
  contactNotes,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import type {
  NewContact,
  NewContactEmail,
  NewContactPhone,
  NewContactAddress,
  NewContactSocialLink,
} from '@/db/schema';
import {
  CreateContactSchema,
  UpdateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
  ContactEmailSchema,
  ContactPhoneSchema,
  ContactSocialLinkSchema,
} from './validation';

// ============================================================================
// CREATE CONTACT
// ============================================================================

export async function createContact(
  userId: string,
  data: CreateContactInput
): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    // Validate input
    const validated = CreateContactSchema.parse(data);

    // Create main contact record
    const newContact = {
      userId,
      firstName: validated.firstName || null,
      lastName: validated.lastName || null,
      displayName: validated.displayName || null,
      nickname: validated.nickname || null,
      company: validated.company || null,
      jobTitle: validated.jobTitle || null,
      department: validated.department || null,
      birthday: validated.birthday ? new Date(validated.birthday) : null,
      notes: validated.notes || null,
      avatarUrl: validated.avatarUrl || null,
      avatarProvider: validated.avatarProvider || null,
      isFavorite: validated.isFavorite,
      sourceType: 'manual' as const,
    };

    const [createdContact] = await db
      .insert(contacts)
      .values(newContact as NewContact)
      .returning();

    // Add related data
    const contactId = createdContact.id;

    // Add emails
    if (validated.emails && validated.emails.length > 0) {
      const emailsToInsert: NewContactEmail[] = validated.emails.map(
        (email) => ({
          contactId,
          email: email.email.toLowerCase(),
          type: email.type,
          isPrimary: email.isPrimary,
        })
      );
      await db.insert(contactEmails).values(emailsToInsert);
    }

    // Add phones
    if (validated.phones && validated.phones.length > 0) {
      const phonesToInsert: NewContactPhone[] = validated.phones.map(
        (phone) => ({
          contactId,
          phone: phone.phone,
          type: phone.type,
          isPrimary: phone.isPrimary,
        })
      );
      await db.insert(contactPhones).values(phonesToInsert);
    }

    // Add addresses
    if (validated.addresses && validated.addresses.length > 0) {
      const addressesToInsert: NewContactAddress[] = validated.addresses.map(
        (address) => ({
          contactId,
          street: address.street || null,
          city: address.city || null,
          state: address.state || null,
          zipCode: address.zipCode || null,
          country: address.country || null,
          type: address.type,
          isPrimary: address.isPrimary,
        })
      );
      await db.insert(contactAddresses).values(addressesToInsert);
    }

    // Add social links
    if (validated.socialLinks && validated.socialLinks.length > 0) {
      const linksToInsert: NewContactSocialLink[] = validated.socialLinks.map(
        (link) => ({
          contactId,
          platform: link.platform,
          url: link.url,
        })
      );
      await db.insert(contactSocialLinks).values(linksToInsert);
    }

    // Assign tags
    if (validated.tags && validated.tags.length > 0) {
      const tagAssignments = validated.tags.map((tagId) => ({
        contactId,
        tagId,
      }));
      await db.insert(contactTagAssignments).values(tagAssignments);
    }

    revalidatePath('/dashboard/contacts');
    return { success: true, contactId };
  } catch (error) {
    console.error('Error creating contact:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create contact' };
  }
}

// ============================================================================
// UPDATE CONTACT
// ============================================================================

export async function updateContact(
  contactId: string,
  userId: string,
  data: UpdateContactInput
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validated = UpdateContactSchema.parse(data);

    // Verify ownership
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    // Update contact
    await db
      .update(contacts)
      .set({
        ...validated,
        birthday: validated.birthday ? new Date(validated.birthday) : null,
        updatedAt: new Date(),
      } as Partial<NewContact>)
      .where(eq(contacts.id, contactId));

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error updating contact:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update contact' };
  }
}

// ============================================================================
// DELETE CONTACT
// ============================================================================

export async function deleteContact(
  contactId: string,
  userId: string,
  hardDelete: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify ownership
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    if (hardDelete) {
      // Hard delete - remove from database
      // Related data will be cascade deleted
      await db.delete(contacts).where(eq(contacts.id, contactId));
    } else {
      // Soft delete - mark as archived
      await db
        .update(contacts)
        .set({ isArchived: true, updatedAt: new Date() } as Partial<NewContact>)
        .where(eq(contacts.id, contactId));
    }

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting contact:', error);
    return { success: false, error: 'Failed to delete contact' };
  }
}

// ============================================================================
// TOGGLE FAVORITE
// ============================================================================

export async function toggleFavorite(
  contactId: string,
  userId: string
): Promise<{ success: boolean; isFavorite?: boolean; error?: string }> {
  try {
    // Verify ownership and get current state
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    const newFavoriteState = !existing.isFavorite;

    await db
      .update(contacts)
      .set({
        isFavorite: newFavoriteState,
        updatedAt: new Date(),
      } as Partial<NewContact>)
      .where(eq(contacts.id, contactId));

    revalidatePath('/dashboard/contacts');
    return { success: true, isFavorite: newFavoriteState };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { success: false, error: 'Failed to toggle favorite' };
  }
}

// ============================================================================
// ADD CONTACT EMAIL
// ============================================================================

export async function addContactEmail(
  contactId: string,
  userId: string,
  emailData: {
    email: string;
    type?: 'work' | 'personal' | 'other';
    isPrimary?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate
    const validated = ContactEmailSchema.parse(emailData);

    // Verify contact ownership
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    // If setting as primary, unset other primary emails
    if (validated.isPrimary) {
      await db
        .update(contactEmails)
        .set({ isPrimary: false })
        .where(eq(contactEmails.contactId, contactId));
    }

    // Add email
    await db.insert(contactEmails).values({
      contactId,
      email: validated.email.toLowerCase(),
      type: validated.type,
      isPrimary: validated.isPrimary,
    } as NewContactEmail);

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error adding email:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add email' };
  }
}

// ============================================================================
// ADD CONTACT PHONE
// ============================================================================

export async function addContactPhone(
  contactId: string,
  userId: string,
  phoneData: {
    phone: string;
    type?: 'mobile' | 'work' | 'home' | 'other';
    isPrimary?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate
    const validated = ContactPhoneSchema.parse(phoneData);

    // Verify contact ownership
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    // If setting as primary, unset other primary phones
    if (validated.isPrimary) {
      await db
        .update(contactPhones)
        .set({ isPrimary: false })
        .where(eq(contactPhones.contactId, contactId));
    }

    // Add phone
    await db.insert(contactPhones).values({
      contactId,
      phone: validated.phone,
      type: validated.type,
      isPrimary: validated.isPrimary,
    } as NewContactPhone);

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error adding phone:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add phone' };
  }
}

// ============================================================================
// ADD SOCIAL LINK
// ============================================================================

export async function addContactSocialLink(
  contactId: string,
  userId: string,
  linkData: { platform: string; url: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate
    const validated = ContactSocialLinkSchema.parse(linkData);

    // Verify contact ownership
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    // Add social link
    await db.insert(contactSocialLinks).values({
      contactId,
      platform: validated.platform,
      url: validated.url,
    });

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error adding social link:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to add social link' };
  }
}

// ============================================================================
// ADD CONTACT NOTE
// ============================================================================

export async function addContactNote(
  contactId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Note content is required' };
    }

    // Verify contact ownership
    const [existing] = await db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Contact not found' };
    }

    // Add note
    await db.insert(contactNotes).values({
      contactId,
      userId,
      content: content.trim(),
    });

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error adding note:', error);
    return { success: false, error: 'Failed to add note' };
  }
}

// ============================================================================
// UPDATE CONTACT NOTE
// ============================================================================

export async function updateContactNote(
  noteId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!content || content.trim().length === 0) {
      return { success: false, error: 'Note content is required' };
    }

    // Verify note ownership
    const [existing] = await db
      .select()
      .from(contactNotes)
      .where(and(eq(contactNotes.id, noteId), eq(contactNotes.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Note not found' };
    }

    // Update note
    await db
      .update(contactNotes)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      } as Partial<NewContactNote>)
      .where(eq(contactNotes.id, noteId));

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error updating note:', error);
    return { success: false, error: 'Failed to update note' };
  }
}

// ============================================================================
// DELETE CONTACT NOTE
// ============================================================================

export async function deleteContactNote(
  noteId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify note ownership
    const [existing] = await db
      .select()
      .from(contactNotes)
      .where(and(eq(contactNotes.id, noteId), eq(contactNotes.userId, userId)))
      .limit(1);

    if (!existing) {
      return { success: false, error: 'Note not found' };
    }

    // Delete note
    await db.delete(contactNotes).where(eq(contactNotes.id, noteId));

    revalidatePath('/dashboard/contacts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
