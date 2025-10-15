'use server';

import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface ScreenEmailResult {
  success: boolean;
  error?: string;
}

/**
 * Screen an email and move it to the specified folder/category
 */
export async function screenEmail(
  emailId: string,
  decision: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | string
): Promise<ScreenEmailResult> {
  try {
    // Map decision to folder name
    let folderName = decision;

    // Normalize folder names
    if (decision === 'inbox') folderName = 'inbox';
    else if (decision === 'newsfeed') folderName = 'newsfeed';
    else if (decision === 'receipts') folderName = 'receipts';
    else if (decision === 'spam') folderName = 'spam';
    // If it's a custom folder ID, it will be used as-is

    // Update the email's folder
    await db
      .update(emails)
      .set({
        folderName: folderName,
        screenedAt: new Date(),
        screenedBy: 'user',
      } as Partial<typeof emails.$inferInsert>)
      .where(eq(emails.id, emailId));

    // Revalidate relevant pages
    revalidatePath('/dashboard/screener');
    revalidatePath('/dashboard/inbox');
    revalidatePath('/dashboard/newsfeed');
    revalidatePath('/dashboard/receipts');

    return { success: true };
  } catch (error) {
    console.error('Error screening email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to screen email',
    };
  }
}

/**
 * Bulk screen multiple emails at once
 */
export async function bulkScreenEmails(
  emailIds: string[],
  decision: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | string
): Promise<ScreenEmailResult> {
  try {
    let folderName = decision;

    if (decision === 'inbox') folderName = 'inbox';
    else if (decision === 'newsfeed') folderName = 'newsfeed';
    else if (decision === 'receipts') folderName = 'receipts';
    else if (decision === 'spam') folderName = 'spam';

    // Update all emails
    for (const emailId of emailIds) {
      await db
        .update(emails)
        .set({
          folderName: folderName,
          screenedAt: new Date(),
          screenedBy: 'user',
        })
        .where(eq(emails.id, emailId));
    }

    // Revalidate pages
    revalidatePath('/dashboard/screener');
    revalidatePath('/dashboard/inbox');
    revalidatePath('/dashboard/newsfeed');
    revalidatePath('/dashboard/receipts');

    return { success: true };
  } catch (error) {
    console.error('Error bulk screening emails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to screen emails',
    };
  }
}
