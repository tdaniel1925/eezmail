'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contactNotes } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface ContactNote {
  id: string;
  contactId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all notes for a specific contact
 */
export async function getContactNotes(
  contactId: string
): Promise<{ success: boolean; notes?: ContactNote[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const notes = await db.query.contactNotes.findMany({
      where: and(
        eq(contactNotes.contactId, contactId),
        eq(contactNotes.userId, user.id)
      ),
      orderBy: [desc(contactNotes.createdAt)],
    });

    return {
      success: true,
      notes: notes.map((note) => ({
        id: note.id,
        contactId: note.contactId,
        userId: note.userId,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    };
  } catch (error) {
    console.error('Error fetching contact notes:', error);
    return { success: false, error: 'Failed to fetch notes' };
  }
}

/**
 * Create a new note for a contact
 */
export async function createContactNote(
  contactId: string,
  content: string
): Promise<{ success: boolean; note?: ContactNote; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!content.trim()) {
      return { success: false, error: 'Note content cannot be empty' };
    }

    const [newNote] = await db
      .insert(contactNotes)
      .values({
        contactId,
        userId: user.id,
        content: content.trim(),
      })
      .returning();

    // Revalidate the contact page
    revalidatePath(`/dashboard/contacts/${contactId}`);

    return {
      success: true,
      note: {
        id: newNote.id,
        contactId: newNote.contactId,
        userId: newNote.userId,
        content: newNote.content,
        createdAt: newNote.createdAt,
        updatedAt: newNote.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error creating contact note:', error);
    return { success: false, error: 'Failed to create note' };
  }
}

/**
 * Update an existing note
 */
export async function updateContactNote(
  noteId: string,
  content: string
): Promise<{ success: boolean; note?: ContactNote; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!content.trim()) {
      return { success: false, error: 'Note content cannot be empty' };
    }

    // First verify the note belongs to the user
    const existingNote = await db.query.contactNotes.findFirst({
      where: and(eq(contactNotes.id, noteId), eq(contactNotes.userId, user.id)),
    });

    if (!existingNote) {
      return { success: false, error: 'Note not found or unauthorized' };
    }

    const [updatedNote] = await db
      .update(contactNotes)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(contactNotes.id, noteId))
      .returning();

    // Revalidate the contact page
    revalidatePath(`/dashboard/contacts/${updatedNote.contactId}`);

    return {
      success: true,
      note: {
        id: updatedNote.id,
        contactId: updatedNote.contactId,
        userId: updatedNote.userId,
        content: updatedNote.content,
        createdAt: updatedNote.createdAt,
        updatedAt: updatedNote.updatedAt,
      },
    };
  } catch (error) {
    console.error('Error updating contact note:', error);
    return { success: false, error: 'Failed to update note' };
  }
}

/**
 * Delete a note
 */
export async function deleteContactNote(
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // First verify the note belongs to the user
    const existingNote = await db.query.contactNotes.findFirst({
      where: and(eq(contactNotes.id, noteId), eq(contactNotes.userId, user.id)),
    });

    if (!existingNote) {
      return { success: false, error: 'Note not found or unauthorized' };
    }

    await db.delete(contactNotes).where(eq(contactNotes.id, noteId));

    // Revalidate the contact page
    revalidatePath(`/dashboard/contacts/${existingNote.contactId}`);

    return { success: true };
  } catch (error) {
    console.error('Error deleting contact note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
