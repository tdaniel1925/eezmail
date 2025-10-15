/**
 * Email Signature Actions
 * Server actions for managing email signatures
 */

'use server';

import { db } from '@/lib/db';
import { emailSignatures, emailAccounts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SignatureData {
  name: string;
  htmlContent: string;
  textContent?: string;
  isDefault?: boolean;
  isEnabled?: boolean;
  accountId?: string | null;
}

/**
 * Get all signatures for the current user
 */
export async function getSignatures() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const signatures = await db.query.emailSignatures.findMany({
      where: (signatures, { eq }) => eq(signatures.userId, user.id),
      orderBy: [
        desc(emailSignatures.isDefault),
        desc(emailSignatures.createdAt),
      ],
    });

    return { success: true, signatures };
  } catch (error) {
    console.error('Error fetching signatures:', error);
    return { success: false, error: 'Failed to fetch signatures' };
  }
}

/**
 * Get a single signature by ID
 */
export async function getSignature(signatureId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const signature = await db.query.emailSignatures.findFirst({
      where: (signatures, { and, eq }) =>
        and(eq(signatures.id, signatureId), eq(signatures.userId, user.id)),
    });

    if (!signature) {
      return { success: false, error: 'Signature not found' };
    }

    return { success: true, signature };
  } catch (error) {
    console.error('Error fetching signature:', error);
    return { success: false, error: 'Failed to fetch signature' };
  }
}

/**
 * Create a new signature
 */
export async function createSignature(data: SignatureData) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(emailSignatures)
        .set({ isDefault: false } as Partial<
          typeof emailSignatures.$inferInsert
        >)
        .where(eq(emailSignatures.userId, user.id));
    }

    // Validate account ownership if accountId is provided
    if (data.accountId) {
      const account = await db.query.emailAccounts.findFirst({
        where: (accounts, { and, eq }) =>
          and(eq(accounts.id, data.accountId!), eq(accounts.userId, user.id)),
      });

      if (!account) {
        return { success: false, error: 'Invalid account ID' };
      }
    }

    const [signature] = await db
      .insert(emailSignatures)
      .values({
        userId: user.id,
        name: data.name,
        htmlContent: data.htmlContent,
        textContent:
          data.textContent || data.htmlContent.replace(/<[^>]*>/g, ''),
        isDefault: data.isDefault || false,
        isEnabled: data.isEnabled !== false,
        accountId: data.accountId || null,
      })
      .returning();

    revalidatePath('/dashboard/settings');

    return { success: true, signature };
  } catch (error) {
    console.error('Error creating signature:', error);
    return { success: false, error: 'Failed to create signature' };
  }
}

/**
 * Update an existing signature
 */
export async function updateSignature(
  signatureId: string,
  data: Partial<SignatureData>
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify ownership
    const existing = await db.query.emailSignatures.findFirst({
      where: (signatures, { and, eq }) =>
        and(eq(signatures.id, signatureId), eq(signatures.userId, user.id)),
    });

    if (!existing) {
      return { success: false, error: 'Signature not found' };
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(emailSignatures)
        .set({ isDefault: false } as Partial<
          typeof emailSignatures.$inferInsert
        >)
        .where(
          and(
            eq(emailSignatures.userId, user.id),
            eq(emailSignatures.id, signatureId)
          )
        );
    }

    // Validate account ownership if accountId is being updated
    if (data.accountId !== undefined && data.accountId !== null) {
      const account = await db.query.emailAccounts.findFirst({
        where: (accounts, { and, eq }) =>
          and(eq(accounts.id, data.accountId!), eq(accounts.userId, user.id)),
      });

      if (!account) {
        return { success: false, error: 'Invalid account ID' };
      }
    }

    const [signature] = await db
      .update(emailSignatures)
      .set({
        ...data,
        textContent: data.htmlContent
          ? data.htmlContent.replace(/<[^>]*>/g, '')
          : undefined,
        updatedAt: new Date(),
      } as Partial<typeof emailSignatures.$inferInsert>)
      .where(
        and(
          eq(emailSignatures.id, signatureId),
          eq(emailSignatures.userId, user.id)
        )
      )
      .returning();

    revalidatePath('/dashboard/settings');

    return { success: true, signature };
  } catch (error) {
    console.error('Error updating signature:', error);
    return { success: false, error: 'Failed to update signature' };
  }
}

/**
 * Delete a signature
 */
export async function deleteSignature(signatureId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    await db
      .delete(emailSignatures)
      .where(
        and(
          eq(emailSignatures.id, signatureId),
          eq(emailSignatures.userId, user.id)
        )
      );

    revalidatePath('/dashboard/settings');

    return { success: true, message: 'Signature deleted successfully' };
  } catch (error) {
    console.error('Error deleting signature:', error);
    return { success: false, error: 'Failed to delete signature' };
  }
}

/**
 * Set a signature as default
 */
export async function setDefaultSignature(signatureId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Unset all defaults
    await db
      .update(emailSignatures)
      .set({ isDefault: false } as Partial<typeof emailSignatures.$inferInsert>)
      .where(eq(emailSignatures.userId, user.id));

    // Set this one as default
    const [signature] = await db
      .update(emailSignatures)
      .set({ isDefault: true, updatedAt: new Date() } as Partial<
        typeof emailSignatures.$inferInsert
      >)
      .where(
        and(
          eq(emailSignatures.id, signatureId),
          eq(emailSignatures.userId, user.id)
        )
      )
      .returning();

    if (!signature) {
      return { success: false, error: 'Signature not found' };
    }

    revalidatePath('/dashboard/settings');

    return { success: true, signature };
  } catch (error) {
    console.error('Error setting default signature:', error);
    return { success: false, error: 'Failed to set default signature' };
  }
}

/**
 * Toggle signature enabled/disabled
 */
export async function toggleSignature(signatureId: string, isEnabled: boolean) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const [signature] = await db
      .update(emailSignatures)
      .set({ isEnabled, updatedAt: new Date() } as Partial<
        typeof emailSignatures.$inferInsert
      >)
      .where(
        and(
          eq(emailSignatures.id, signatureId),
          eq(emailSignatures.userId, user.id)
        )
      )
      .returning();

    if (!signature) {
      return { success: false, error: 'Signature not found' };
    }

    revalidatePath('/dashboard/settings');

    return { success: true, signature };
  } catch (error) {
    console.error('Error toggling signature:', error);
    return { success: false, error: 'Failed to toggle signature' };
  }
}
