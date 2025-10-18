import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  withErrorHandler,
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/error/api-error-handler';
import { EmailSchemas } from '@/lib/validation/request-validator';

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

  // TODO: Implement actual email sending via provider (Nylas/Gmail/Microsoft)
  // For now, log the email details and return success
  console.log('Sending email:', {
    from: account.emailAddress,
    to: validatedData.to,
    cc: validatedData.cc,
    bcc: validatedData.bcc,
    subject: validatedData.subject,
    body: validatedData.body,
    isHtml: validatedData.isHtml,
    attachmentCount: validatedData.attachments?.length || 0,
    scheduledFor: validatedData.scheduledFor,
  });

  // If scheduled, store in scheduledEmails table (to be implemented)
  if (validatedData.scheduledFor) {
    // TODO: Store in scheduledEmails table
    console.log('Email scheduled for:', validatedData.scheduledFor);
  }

  // If there's a draft, delete it after sending
  if (validatedData.draftId) {
    // TODO: Delete draft from emailDrafts table
    console.log('Deleting draft:', validatedData.draftId);
  }

  return createSuccessResponse(
    { messageId: 'mock_message_id' },
    'Email sent successfully'
  );
});
