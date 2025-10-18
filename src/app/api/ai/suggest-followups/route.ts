import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, followUpReminders } from '@/db/schema';
import { eq, and, isNull, lt, desc } from 'drizzle-orm';

/**
 * Suggest follow-ups for sent emails with no reply
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { daysWithoutReply = 3, limit = 10 } = body;

    // Find sent emails with no replies after X days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysWithoutReply);

    const sentEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          eq(emails.userId, user.id),
          eq(emails.folder, 'sent'),
          lt(emails.receivedDate, cutoffDate),
          isNull(emails.inReplyTo) // Original emails, not replies
        )
      )
      .orderBy(desc(emails.receivedDate))
      .limit(limit);

    // For each sent email, check if there's a reply
    const suggestions = [];

    for (const email of sentEmails) {
      // Look for replies (emails in inbox from same recipient that reference this email)
      const hasReply = await db
        .select()
        .from(emails)
        .where(
          and(
            eq(emails.userId, user.id),
            eq(emails.senderEmail, email.toRecipients?.[0] || ''),
            // Check if received after sent email
            lt(email.receivedDate, emails.receivedDate)
          )
        )
        .limit(1);

      if (hasReply.length === 0) {
        // No reply found - suggest follow-up
        const daysSinceSent = Math.floor(
          (Date.now() - email.receivedDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        suggestions.push({
          emailId: email.id,
          subject: email.subject,
          recipient: email.toRecipients?.[0] || 'Unknown',
          sentDate: email.receivedDate,
          daysSinceSent,
          reason: `No reply from ${email.toRecipients?.[0] || 'recipient'} for ${daysSinceSent} days`,
          suggestedDate: new Date(),
        });

        // Create follow-up reminder in database
        await db.insert(followUpReminders).values({
          emailId: email.id,
          userId: user.id,
          originalEmailDate: email.receivedDate,
          suggestedFollowUpDate: new Date(),
          reason: `No reply for ${daysSinceSent} days`,
          isDismissed: false,
          isSnoozed: false,
        } as any);
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    console.error('Error in suggest-followups API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



