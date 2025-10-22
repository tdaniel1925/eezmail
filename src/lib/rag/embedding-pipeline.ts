'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { generateEmbedding, prepareEmailForEmbedding } from './embeddings';

/**
 * Generate and save embedding for a single email
 */
export async function embedEmail(emailId: string): Promise<{
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

    // Fetch email
    const [email] = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        bodyText: emails.bodyText,
        bodyHtml: emails.bodyHtml,
      })
      .from(emails)
      .where(eq(emails.id, emailId))
      .limit(1);

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Prepare text and generate embedding
    const text = prepareEmailForEmbedding(email);
    const embedding = await generateEmbedding(text);

    // Save embedding to database
    await db
      .update(emails)
      .set({ embedding: JSON.stringify(embedding) as any })
      .where(eq(emails.id, emailId));

    return { success: true };
  } catch (error) {
    console.error('Error embedding email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get count of emails without embeddings for a user
 */
export async function getUnembeddedEmailCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: emails.id })
      .from(emails)
      .where(and(eq(emails.userId, userId), isNull(emails.embedding)));

    return result.length;
  } catch (error) {
    console.error('Error counting unembedded emails:', error);
    return 0;
  }
}

/**
 * Batch embed multiple emails
 * Returns number of successfully embedded emails
 */
export async function batchEmbedEmails(
  emailIds: string[],
  userId: string
): Promise<{
  success: boolean;
  embedded: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let embedded = 0;
  let failed = 0;

  for (const emailId of emailIds) {
    try {
      const result = await embedEmail(emailId);
      if (result.success) {
        embedded++;
      } else {
        failed++;
        if (result.error) errors.push(`${emailId}: ${result.error}`);
      }

      // Rate limiting: wait 100ms between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      errors.push(
        `${emailId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return {
    success: failed === 0,
    embedded,
    failed,
    errors,
  };
}

/**
 * Process embeddings for user's unembedded emails
 * Processes in batches to avoid overwhelming the system
 */
export async function processUnembeddedEmails(
  userId: string,
  batchSize: number = 50
): Promise<{
  success: boolean;
  processed: number;
  remaining: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return {
        success: false,
        processed: 0,
        remaining: 0,
        error: 'Unauthorized',
      };
    }

    // Get batch of unembedded emails
    const unembeddedEmails = await db
      .select({ id: emails.id })
      .from(emails)
      .where(and(eq(emails.userId, userId), isNull(emails.embedding)))
      .limit(batchSize);

    if (unembeddedEmails.length === 0) {
      return { success: true, processed: 0, remaining: 0 };
    }

    // Process batch
    const result = await batchEmbedEmails(
      unembeddedEmails.map((e) => e.id),
      userId
    );

    // Get remaining count
    const remaining = await getUnembeddedEmailCount(userId);

    return {
      success: result.success,
      processed: result.embedded,
      remaining,
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    };
  } catch (error) {
    console.error('Error processing unembedded emails:', error);
    return {
      success: false,
      processed: 0,
      remaining: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
