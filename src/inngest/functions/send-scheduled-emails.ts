import { inngest } from '../client';
import { db } from '@/lib/db';
import { scheduledEmails, emailAccounts } from '@/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { sendEmail } from '@/lib/email/send-email';

/**
 * Inngest Function: Send Scheduled Emails
 * Runs every minute to check for emails that need to be sent
 */
export const sendScheduledEmails = inngest.createFunction(
  {
    id: 'send-scheduled-emails',
    name: 'Send Scheduled Emails',
  },
  { cron: '* * * * *' }, // Every minute
  async ({ step, logger }) => {
    const now = new Date();

    // Step 1: Find pending scheduled emails that are due
    const dueEmails = await step.run('find-due-emails', async () => {
      logger.info('🔍 Looking for scheduled emails due to send...');

      const emails = await db
        .select()
        .from(scheduledEmails)
        .where(
          and(
            eq(scheduledEmails.status, 'pending'),
            lte(scheduledEmails.scheduledFor, now)
          )
        )
        .limit(50); // Process max 50 emails per run

      logger.info(`📧 Found ${emails.length} scheduled email(s) to send`);
      return emails;
    });

    if (dueEmails.length === 0) {
      logger.info('✅ No scheduled emails to send at this time');
      return { processed: 0 };
    }

    // Step 2: Send each email
    let successCount = 0;
    let failureCount = 0;

    for (const scheduledEmail of dueEmails) {
      await step.run(`send-email-${scheduledEmail.id}`, async () => {
        try {
          logger.info(`📤 Sending scheduled email ${scheduledEmail.id}...`);

          // Get account details
          const account = await db.query.emailAccounts.findFirst({
            where: eq(emailAccounts.id, scheduledEmail.accountId),
          });

          if (!account) {
            throw new Error(`Account ${scheduledEmail.accountId} not found`);
          }

          if (account.status !== 'active') {
            throw new Error(
              `Account ${scheduledEmail.accountId} is not active`
            );
          }

          // Send the email
          const result = await sendEmail({
            accountId: scheduledEmail.accountId,
            to: scheduledEmail.to.split(',').map((e) => e.trim()),
            cc: scheduledEmail.cc?.split(',').map((e) => e.trim()),
            bcc: scheduledEmail.bcc?.split(',').map((e) => e.trim()),
            subject: scheduledEmail.subject,
            body: scheduledEmail.body,
            isHtml: scheduledEmail.isHtml,
            attachments: scheduledEmail.attachments as any,
            replyToMessageId: undefined,
          });

          if (result.success) {
            // Update status to sent
            await db
              .update(scheduledEmails)
              .set({
                status: 'sent',
                sentAt: new Date(),
                providerMessageId: result.messageId,
                updatedAt: new Date(),
              })
              .where(eq(scheduledEmails.id, scheduledEmail.id));

            logger.info(
              `✅ Successfully sent scheduled email ${scheduledEmail.id}`
            );
            successCount++;
          } else {
            throw new Error(result.error || 'Unknown error');
          }
        } catch (error) {
          logger.error(
            `❌ Failed to send scheduled email ${scheduledEmail.id}:`,
            error
          );

          // Update status to failed and increment retry count
          const newRetryCount = scheduledEmail.retryCount + 1;
          const shouldRetry = newRetryCount < 3; // Max 3 retries

          await db
            .update(scheduledEmails)
            .set({
              status: shouldRetry ? 'pending' : 'failed',
              errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
              retryCount: newRetryCount,
              updatedAt: new Date(),
            })
            .where(eq(scheduledEmails.id, scheduledEmail.id));

          failureCount++;
        }
      });
    }

    logger.info(
      `📊 Processed ${dueEmails.length} scheduled emails: ${successCount} sent, ${failureCount} failed`
    );

    return {
      processed: dueEmails.length,
      succeeded: successCount,
      failed: failureCount,
    };
  }
);
