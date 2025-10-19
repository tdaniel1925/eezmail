import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts, scheduledEmails, emailDrafts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  withErrorHandler,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/error/api-error-handler';
import { EmailSchemas } from '@/lib/validation/request-validator';
import { sendEmail } from '@/lib/email/send-email';

// Use the centralized validation schema
const sendEmailSchema = EmailSchemas.sendEmail;

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse('Unauthorized', 401, 'UNAUTHORIZED');
  }

  // Parse and validate request body
  const body = await request.json();
  const validatedData = sendEmailSchema.parse(body);

  // Get user's email account
  let account;
  if (validatedData.accountId) {
    account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, validatedData.accountId),
    });
  } else {
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });
    account = accounts.find((a) => a.status === 'active');
  }

  if (!account) {
    return createErrorResponse(
      'No active email account found',
      400,
      'NO_ACCOUNT'
    );
  }

  // If scheduled, store in scheduledEmails table
  if (validatedData.scheduledFor) {
    try {
      await db.insert(scheduledEmails).values({
        userId: user.id,
        accountId: account.id,
        to: validatedData.to,
        cc: validatedData.cc,
        bcc: validatedData.bcc,
        subject: validatedData.subject,
        body: validatedData.body,
        isHtml: validatedData.isHtml || false,
        scheduledFor: new Date(validatedData.scheduledFor),
        status: 'pending',
      });

      return createSuccessResponse(
        { scheduled: true },
        'Email scheduled successfully'
      );
    } catch (error) {
      console.error('Error scheduling email:', error);
      return createErrorResponse(
        'Failed to schedule email',
        500,
        'SCHEDULE_FAILED'
      );
    }
  }

  // Send email immediately via the unified send service
  const result = await sendEmail({
    accountId: account.id,
    to: validatedData.to,
    cc: validatedData.cc,
    bcc: validatedData.bcc,
    subject: validatedData.subject,
    body: validatedData.body,
    isHtml: validatedData.isHtml || false,
    attachments: validatedData.attachments,
    replyToMessageId: validatedData.replyToMessageId,
    threadId: validatedData.threadId,
  });

  if (!result.success) {
    return createErrorResponse(
      result.error || 'Failed to send email',
      500,
      'SEND_FAILED'
    );
  }

  // If there's a draft, delete it after sending
  if (validatedData.draftId) {
    try {
      await db.delete(emailDrafts).where(eq(emailDrafts.id, validatedData.draftId));
    } catch (error) {
      console.error('Error deleting draft:', error);
      // Don't fail the send if we can't delete the draft
    }
  }

  return createSuccessResponse(
    { messageId: result.messageId },
    'Email sent successfully'
  );
});
