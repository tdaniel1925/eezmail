'use server';

import { db } from '@/lib/db';
import { customLabels, labelAssignments } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Create a new custom label
 */
export async function createLabel(params: {
  name: string;
  color: string;
  icon?: string;
}): Promise<{ success: boolean; labelId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get current max sort order
    const maxSortOrder = await db
      .select({ sortOrder: customLabels.sortOrder })
      .from(customLabels)
      .where(eq(customLabels.userId, user.id))
      .orderBy(desc(customLabels.sortOrder))
      .limit(1);

    const nextSortOrder = maxSortOrder[0]?.sortOrder ?? 0 + 1;

    const [newLabel] = await db
      .insert(customLabels)
      .values({
        userId: user.id,
        name: params.name,
        color: params.color,
        icon: params.icon,
        sortOrder: nextSortOrder,
      })
      .returning();

    revalidatePath('/dashboard');
    return { success: true, labelId: newLabel.id };
  } catch (error) {
    console.error('Error creating label:', error);
    return { success: false, error: 'Failed to create label' };
  }
}

/**
 * Update an existing label
 */
export async function updateLabel(
  labelId: string,
  updates: {
    name?: string;
    color?: string;
    icon?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const label = await db.query.customLabels.findFirst({
      where: eq(customLabels.id, labelId),
    });

    if (!label || label.userId !== user.id) {
      return { success: false, error: 'Label not found' };
    }

    await db
      .update(customLabels)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(customLabels.id, labelId));

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error updating label:', error);
    return { success: false, error: 'Failed to update label' };
  }
}

/**
 * Delete a label
 */
export async function deleteLabel(
  labelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ownership
    const label = await db.query.customLabels.findFirst({
      where: eq(customLabels.id, labelId),
    });

    if (!label || label.userId !== user.id) {
      return { success: false, error: 'Label not found' };
    }

    // Delete label (cascade will remove assignments)
    await db.delete(customLabels).where(eq(customLabels.id, labelId));

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error deleting label:', error);
    return { success: false, error: 'Failed to delete label' };
  }
}

/**
 * Reorder labels
 */
export async function reorderLabels(
  labelIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update sort order for each label
    await Promise.all(
      labelIds.map((labelId, index) =>
        db
          .update(customLabels)
          .set({ sortOrder: index })
          .where(
            and(eq(customLabels.id, labelId), eq(customLabels.userId, user.id))
          )
      )
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error reordering labels:', error);
    return { success: false, error: 'Failed to reorder labels' };
  }
}

/**
 * Get all labels for a user
 */
export async function getLabels(): Promise<{
  success: boolean;
  labels?: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    sortOrder: number;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const labels = await db.query.customLabels.findMany({
      where: eq(customLabels.userId, user.id),
      orderBy: [customLabels.sortOrder],
    });

    return { success: true, labels };
  } catch (error) {
    console.error('Error fetching labels:', error);
    return { success: false, error: 'Failed to fetch labels' };
  }
}

/**
 * Add a label to an email
 */
export async function addLabelToEmail(
  emailId: string,
  labelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify label ownership
    const label = await db.query.customLabels.findFirst({
      where: eq(customLabels.id, labelId),
    });

    if (!label || label.userId !== user.id) {
      return { success: false, error: 'Label not found' };
    }

    // Add assignment (ignore if already exists due to unique constraint)
    await db
      .insert(labelAssignments)
      .values({
        emailId,
        labelId,
      })
      .onConflictDoNothing();

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error adding label to email:', error);
    return { success: false, error: 'Failed to add label' };
  }
}

/**
 * Remove a label from an email
 */
export async function removeLabelFromEmail(
  emailId: string,
  labelId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .delete(labelAssignments)
      .where(
        and(
          eq(labelAssignments.emailId, emailId),
          eq(labelAssignments.labelId, labelId)
        )
      );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error removing label from email:', error);
    return { success: false, error: 'Failed to remove label' };
  }
}
