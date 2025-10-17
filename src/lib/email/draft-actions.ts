'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import {
  emailDrafts,
  emailAccounts,
  type EmailDraft,
  type NewEmailDraft,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface DraftData {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string; // HTML
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    data: string; // Base64
  }>;
  mode?: 'compose' | 'reply' | 'forward';
  replyToId?: string;
  accountId?: string;
}

/**
 * Save or update a draft
 */
export async function saveDraft(params: {
  draftId?: string; // If provided, update existing draft
  draftData: DraftData;
}): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get user's first active email account if not provided
    let accountId = params.draftData.accountId;
    if (!accountId) {
      const accounts = await db.query.emailAccounts.findMany({
        where: eq(emailAccounts.userId, user.id),
      });
      const activeAccount = accounts.find((a) => a.status === 'active');
      if (!activeAccount) {
        return { success: false, error: 'No active email account found' };
      }
      accountId = activeAccount.id;
    }

    const now = new Date();

    // Update existing draft
    if (params.draftId) {
      // Verify ownership
      const existingDraft = await db.query.emailDrafts.findFirst({
        where: and(
          eq(emailDrafts.id, params.draftId),
          eq(emailDrafts.userId, user.id)
        ),
      });

      if (!existingDraft) {
        return { success: false, error: 'Draft not found' };
      }

      await db
        .update(emailDrafts)
        .set({
          to: params.draftData.to,
          cc: params.draftData.cc,
          bcc: params.draftData.bcc,
          subject: params.draftData.subject,
          body: params.draftData.body,
          attachments: params.draftData.attachments || [],
          mode: params.draftData.mode || 'compose',
          replyToId: params.draftData.replyToId,
          lastSaved: now,
          updatedAt: now,
        })
        .where(eq(emailDrafts.id, params.draftId));

      return { success: true, draftId: params.draftId };
    }

    // Create new draft
    const [draft] = await db
      .insert(emailDrafts)
      .values({
        userId: user.id,
        accountId,
        to: params.draftData.to,
        cc: params.draftData.cc,
        bcc: params.draftData.bcc,
        subject: params.draftData.subject,
        body: params.draftData.body,
        attachments: params.draftData.attachments || [],
        mode: params.draftData.mode || 'compose',
        replyToId: params.draftData.replyToId,
        lastSaved: now,
      })
      .returning();

    return { success: true, draftId: draft.id };
  } catch (error) {
    console.error('Error saving draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save draft',
    };
  }
}

/**
 * Load a specific draft by ID
 */
export async function loadDraft(draftId: string): Promise<{
  success: boolean;
  draft?: EmailDraft;
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

    const draft = await db.query.emailDrafts.findFirst({
      where: and(eq(emailDrafts.id, draftId), eq(emailDrafts.userId, user.id)),
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    return { success: true, draft };
  } catch (error) {
    console.error('Error loading draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load draft',
    };
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string): Promise<{
  success: boolean;
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

    // Verify ownership
    const draft = await db.query.emailDrafts.findFirst({
      where: and(eq(emailDrafts.id, draftId), eq(emailDrafts.userId, user.id)),
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    await db.delete(emailDrafts).where(eq(emailDrafts.id, draftId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete draft',
    };
  }
}

/**
 * Get all drafts for the current user
 */
export async function getUserDrafts(): Promise<{
  success: boolean;
  drafts?: EmailDraft[];
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

    const drafts = await db.query.emailDrafts.findMany({
      where: eq(emailDrafts.userId, user.id),
      orderBy: [desc(emailDrafts.lastSaved)],
      limit: 20, // Limit to most recent 20 drafts
    });

    return { success: true, drafts };
  } catch (error) {
    console.error('Error getting drafts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get drafts',
    };
  }
}

/**
 * Get the most recent draft (for auto-loading)
 */
export async function getRecentDraft(): Promise<{
  success: boolean;
  draft?: EmailDraft | null;
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

    const draft = await db.query.emailDrafts.findFirst({
      where: eq(emailDrafts.userId, user.id),
      orderBy: [desc(emailDrafts.lastSaved)],
    });

    return { success: true, draft: draft || null };
  } catch (error) {
    console.error('Error getting recent draft:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get recent draft',
    };
  }
}

/**
 * Delete all drafts older than a certain number of days
 */
export async function deleteOldDrafts(daysOld: number = 30): Promise<{
  success: boolean;
  deletedCount?: number;
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

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldDrafts = await db.query.emailDrafts.findMany({
      where: and(
        eq(emailDrafts.userId, user.id)
        // lastSaved < cutoffDate
      ),
      columns: { id: true },
    });

    if (oldDrafts.length > 0) {
      await db.delete(emailDrafts).where(
        and(
          eq(emailDrafts.userId, user.id)
          // lastSaved < cutoffDate
        )
      );
    }

    return { success: true, deletedCount: oldDrafts.length };
  } catch (error) {
    console.error('Error deleting old drafts:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete old drafts',
    };
  }
}
