'use server';

import { db } from '@/lib/db';
import { emails, emailContacts, customFolders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface ScreenerDecision {
  emailId: string;
  senderEmail: string;
  decision: 'imbox' | 'feed' | 'paper_trail' | 'block' | string;
  userId: string;
}

export async function processScreenerDecision(
  decision: ScreenerDecision
): Promise<{ success: boolean; error?: string }> {
  try {
    const { emailId, senderEmail, decision: dest, userId } = decision;

    // Determine if this is a custom folder or a default destination
    const isCustomFolder = dest.length > 20; // UUIDs are longer than 20 chars

    // Update the email contact record to save the decision for future emails
    await db
      .insert(emailContacts)
      .values({
        userId, // User ID
        accountId: userId, // In production, get from email's accountId
        emailAddress: senderEmail,
        screeningStatus: 'screened',
        assignedFolder: isCustomFolder ? dest : null,
        heyView: isCustomFolder
          ? null
          : (dest as 'imbox' | 'feed' | 'paper_trail'),
        contactStatus: dest === 'block' ? 'blocked' : 'approved',
      })
      .onConflictDoUpdate({
        target: [emailContacts.accountId, emailContacts.emailAddress],
        set: {
          screeningStatus: 'screened',
          assignedFolder: isCustomFolder ? dest : null,
          heyView: isCustomFolder
            ? null
            : (dest as 'imbox' | 'feed' | 'paper_trail'),
          contactStatus: dest === 'block' ? 'blocked' : 'approved',
          updatedAt: new Date(),
        },
      });

    // Update the current email based on the decision
    if (dest === 'block') {
      // Move to trash
      await db
        .update(emails)
        .set({
          folderName: 'trash',
          screeningStatus: 'screened',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId));
    } else if (isCustomFolder) {
      // Verify the custom folder exists and belongs to the user
      const [folder] = await db
        .select()
        .from(customFolders)
        .where(
          and(eq(customFolders.id, dest), eq(customFolders.userId, userId))
        )
        .limit(1);

      if (!folder) {
        return { success: false, error: 'Custom folder not found' };
      }

      // Assign to custom folder
      await db
        .update(emails)
        .set({
          customFolderId: dest,
          screeningStatus: 'screened',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId));
    } else {
      // Assign to Hey View (imbox, feed, or paper_trail)
      await db
        .update(emails)
        .set({
          heyView: dest as 'imbox' | 'feed' | 'paper_trail',
          screeningStatus: 'screened',
          updatedAt: new Date(),
        })
        .where(eq(emails.id, emailId));
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing screener decision:', error);
    return { success: false, error: 'Failed to process decision' };
  }
}

export async function applyContactRule(
  accountId: string,
  senderEmail: string
): Promise<{
  shouldScreen: boolean;
  destination?: 'imbox' | 'feed' | 'paper_trail' | string;
  blocked: boolean;
}> {
  try {
    // Check if there's an existing contact record for this sender
    const [contact] = await db
      .select()
      .from(emailContacts)
      .where(
        and(
          eq(emailContacts.accountId, accountId),
          eq(emailContacts.emailAddress, senderEmail)
        )
      )
      .limit(1);

    if (!contact) {
      // No record found, needs screening
      return { shouldScreen: true, blocked: false };
    }

    if (contact.contactStatus === 'blocked') {
      return { shouldScreen: false, blocked: true };
    }

    if (contact.screeningStatus === 'screened') {
      // Has been screened, apply the saved rule
      const destination = contact.assignedFolder || contact.heyView;
      return {
        shouldScreen: false,
        destination: destination || undefined,
        blocked: false,
      };
    }

    // Unknown status, needs screening
    return { shouldScreen: true, blocked: false };
  } catch (error) {
    console.error('Error checking contact rule:', error);
    return { shouldScreen: true, blocked: false };
  }
}
