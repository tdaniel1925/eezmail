import { inngest } from '@/inngest/client';
import { db } from '@/lib/db';
import {
  users,
  emailAccounts,
  emails,
  contacts,
  proactiveAlerts,
  calendarEvents,
} from '@/db/schema';
import { eq, and, gte, lte, desc, sql, or, like } from 'drizzle-orm';
import type { ProactiveAlertType } from '@/db/schema';

/**
 * Proactive Monitoring System
 *
 * Runs every 5 minutes to check for:
 * 1. VIP emails (from important contacts)
 * 2. Overdue responses (emails unread >24 hours)
 * 3. Meeting prep (meetings in next hour with related emails)
 * 4. Urgent keywords (emails with "urgent", "ASAP", etc.)
 * 5. Follow-up needed (emails expecting responses)
 * 6. Deadlines approaching (from email content analysis)
 */
export const proactiveMonitoring = inngest.createFunction(
  {
    id: 'imbox-email-client-proactive-monitoring',
    name: 'Proactive Email Monitoring',
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    console.log(
      '🔍 [Proactive Monitoring] Starting proactive monitoring cycle...'
    );

    // Step 1: Get all active users
    const activeUsers = await step.run('get-active-users', async () => {
      const allUsers = await db.query.users.findMany();
      console.log(
        `📊 [Proactive Monitoring] Found ${allUsers.length} total users`
      );
      return allUsers;
    });

    if (activeUsers.length === 0) {
      console.log('⚠️ [Proactive Monitoring] No users found, skipping');
      return { success: true, message: 'No users to monitor' };
    }

    // Step 2: Monitor each user
    let totalAlertsCreated = 0;

    for (const user of activeUsers) {
      const alertsCreated = await step.run(
        `monitor-user-${user.id}`,
        async () => {
          console.log(`👤 [Proactive Monitoring] Monitoring user: ${user.id}`);

          let userAlertCount = 0;

          try {
            // Get user's email accounts
            const accounts = await db.query.emailAccounts.findMany({
              where: eq(emailAccounts.userId, user.id),
            });

            if (accounts.length === 0) {
              console.log(
                `⚠️ [Proactive Monitoring] No email accounts for user ${user.id}`
              );
              return 0;
            }

            const accountIds = accounts.map((acc) => acc.id);
            console.log(
              `📧 [Proactive Monitoring] User has ${accounts.length} email account(s)`
            );

            // Check 1: VIP Emails (last 5 minutes)
            const vipAlerts = await checkVIPEmails(user.id, accountIds);
            userAlertCount += vipAlerts;

            // Check 2: Overdue Responses (>24 hours unread)
            const overdueAlerts = await checkOverdueResponses(
              user.id,
              accountIds
            );
            userAlertCount += overdueAlerts;

            // Check 3: Urgent Keywords
            const urgentAlerts = await checkUrgentKeywords(user.id, accountIds);
            userAlertCount += urgentAlerts;

            // Check 4: Meeting Prep (next hour)
            const meetingAlerts = await checkUpcomingMeetings(
              user.id,
              accountIds
            );
            userAlertCount += meetingAlerts;

            // Check 5: Follow-up Needed
            const followUpAlerts = await checkFollowUpNeeded(
              user.id,
              accountIds
            );
            userAlertCount += followUpAlerts;

            console.log(
              `✅ [Proactive Monitoring] Created ${userAlertCount} alert(s) for user ${user.id}`
            );
            return userAlertCount;
          } catch (error) {
            console.error(
              `❌ [Proactive Monitoring] Error monitoring user ${user.id}:`,
              error
            );
            return 0;
          }
        }
      );

      totalAlertsCreated += alertsCreated;
    }

    console.log(
      `🎉 [Proactive Monitoring] Cycle complete! Created ${totalAlertsCreated} total alert(s) across ${activeUsers.length} user(s)`
    );

    return {
      success: true,
      usersMonitored: activeUsers.length,
      alertsCreated: totalAlertsCreated,
      timestamp: new Date().toISOString(),
    };
  }
);

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

/**
 * Check for emails from VIP contacts in the last 5 minutes
 */
async function checkVIPEmails(
  userId: string,
  accountIds: string[]
): Promise<number> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find VIP contacts (those marked as VIP or with high relationship score)
    const accountConditions =
      accountIds.length === 1
        ? eq(contacts.accountId, accountIds[0])
        : or(...accountIds.map((id) => eq(contacts.accountId, id)));

    const vipContacts = await db.query.contacts.findMany({
      where: and(
        accountConditions!,
        or(
          eq(contacts.isVip, true),
          gte(contacts.relationshipScore, 80) // High relationship score
        )
      ),
    });

    if (vipContacts.length === 0) {
      return 0;
    }

    const vipEmails = vipContacts.map((c) => c.email.toLowerCase());
    console.log(`⭐ [VIP Check] Monitoring ${vipEmails.length} VIP contact(s)`);

    // Find recent emails from VIP contacts
    const emailAccountConditions =
      accountIds.length === 1
        ? eq(emails.accountId, accountIds[0])
        : or(...accountIds.map((id) => eq(emails.accountId, id)));

    const recentVIPEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          emailAccountConditions!,
          gte(emails.receivedAt, fiveMinutesAgo),
          eq(emails.isRead, false) // Only unread
        )
      )
      .orderBy(desc(emails.receivedAt))
      .limit(50);

    // Filter for VIP senders
    const vipInbox = recentVIPEmails.filter((email) => {
      const fromAddress =
        typeof email.fromAddress === 'string'
          ? email.fromAddress
          : email.fromAddress?.email || '';
      return vipEmails.some((vipEmail) =>
        fromAddress.toLowerCase().includes(vipEmail)
      );
    });

    console.log(
      `📬 [VIP Check] Found ${vipInbox.length} recent email(s) from VIPs`
    );

    let alertsCreated = 0;

    for (const email of vipInbox) {
      // Check if alert already exists for this email
      const existingAlert = await db.query.proactiveAlerts.findFirst({
        where: and(
          eq(proactiveAlerts.userId, userId),
          eq(proactiveAlerts.emailId, email.id),
          eq(proactiveAlerts.type, 'vip_email'),
          eq(proactiveAlerts.dismissed, false)
        ),
      });

      if (existingAlert) {
        continue; // Skip if alert already exists
      }

      // Get sender name
      const fromAddress =
        typeof email.fromAddress === 'string'
          ? email.fromAddress
          : email.fromAddress?.name ||
            email.fromAddress?.email ||
            'Unknown Sender';

      // Create alert
      await db.insert(proactiveAlerts).values({
        userId,
        type: 'vip_email' as ProactiveAlertType,
        priority: 'high',
        title: `VIP Email from ${fromAddress}`,
        message: email.subject || 'No subject',
        emailId: email.id,
        actionUrl: `/dashboard/inbox?emailId=${email.id}`,
        actionLabel: 'View Email',
        metadata: {
          sender: fromAddress,
          receivedAt: email.receivedAt,
        },
      });

      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error('❌ [VIP Check] Error:', error);
    return 0;
  }
}

/**
 * Check for emails unread for more than 24 hours
 */
async function checkOverdueResponses(
  userId: string,
  accountIds: string[]
): Promise<number> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find emails unread for >24 hours in inbox
    const accountConditions =
      accountIds.length === 1
        ? eq(emails.accountId, accountIds[0])
        : or(...accountIds.map((id) => eq(emails.accountId, id)));

    const overdueEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          accountConditions!,
          lte(emails.receivedAt, twentyFourHoursAgo),
          eq(emails.isRead, false),
          eq(emails.folderName, 'INBOX')
        )
      )
      .orderBy(emails.receivedAt)
      .limit(10); // Only alert for top 10 oldest

    console.log(
      `⏰ [Overdue Check] Found ${overdueEmails.length} overdue email(s)`
    );

    let alertsCreated = 0;

    for (const email of overdueEmails) {
      // Check if alert already exists
      const existingAlert = await db.query.proactiveAlerts.findFirst({
        where: and(
          eq(proactiveAlerts.userId, userId),
          eq(proactiveAlerts.emailId, email.id),
          eq(proactiveAlerts.type, 'overdue_response'),
          eq(proactiveAlerts.dismissed, false)
        ),
      });

      if (existingAlert) {
        continue;
      }

      const hoursAgo = Math.floor(
        (Date.now() - email.receivedAt.getTime()) / (1000 * 60 * 60)
      );

      const fromAddress =
        typeof email.fromAddress === 'string'
          ? email.fromAddress
          : email.fromAddress?.name ||
            email.fromAddress?.email ||
            'Unknown Sender';

      await db.insert(proactiveAlerts).values({
        userId,
        type: 'overdue_response' as ProactiveAlertType,
        priority: hoursAgo > 48 ? 'high' : 'medium',
        title: `Email unread for ${hoursAgo} hours`,
        message: `From ${fromAddress}: ${email.subject || 'No subject'}`,
        emailId: email.id,
        actionUrl: `/dashboard/inbox?emailId=${email.id}`,
        actionLabel: 'View Email',
        metadata: {
          hoursOverdue: hoursAgo,
          sender: fromAddress,
        },
      });

      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error('❌ [Overdue Check] Error:', error);
    return 0;
  }
}

/**
 * Check for emails with urgent keywords
 */
async function checkUrgentKeywords(
  userId: string,
  accountIds: string[]
): Promise<number> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Urgent keywords to search for
    const urgentKeywords = [
      'urgent',
      'asap',
      'immediately',
      'critical',
      'emergency',
      'deadline',
      'time sensitive',
      'action required',
      'high priority',
    ];

    // Find recent emails with urgent keywords in subject or body
    const accountConditions =
      accountIds.length === 1
        ? eq(emails.accountId, accountIds[0])
        : or(...accountIds.map((id) => eq(emails.accountId, id)));

    const recentEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          accountConditions!,
          gte(emails.receivedAt, fiveMinutesAgo),
          eq(emails.isRead, false)
        )
      )
      .limit(100);

    // Filter for urgent keywords
    const urgentEmails = recentEmails.filter((email) => {
      const searchText =
        `${email.subject || ''} ${email.bodyText || ''}`.toLowerCase();
      return urgentKeywords.some((keyword) => searchText.includes(keyword));
    });

    console.log(
      `🚨 [Urgent Check] Found ${urgentEmails.length} email(s) with urgent keywords`
    );

    let alertsCreated = 0;

    for (const email of urgentEmails) {
      // Check if alert already exists
      const existingAlert = await db.query.proactiveAlerts.findFirst({
        where: and(
          eq(proactiveAlerts.userId, userId),
          eq(proactiveAlerts.emailId, email.id),
          eq(proactiveAlerts.type, 'urgent_keyword'),
          eq(proactiveAlerts.dismissed, false)
        ),
      });

      if (existingAlert) {
        continue;
      }

      const fromAddress =
        typeof email.fromAddress === 'string'
          ? email.fromAddress
          : email.fromAddress?.name ||
            email.fromAddress?.email ||
            'Unknown Sender';

      await db.insert(proactiveAlerts).values({
        userId,
        type: 'urgent_keyword' as ProactiveAlertType,
        priority: 'high',
        title: `Urgent Email from ${fromAddress}`,
        message: email.subject || 'No subject',
        emailId: email.id,
        actionUrl: `/dashboard/inbox?emailId=${email.id}`,
        actionLabel: 'View Email',
        metadata: {
          sender: fromAddress,
          urgencyReason: 'Contains urgent keywords',
        },
      });

      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error('❌ [Urgent Check] Error:', error);
    return 0;
  }
}

/**
 * Check for meetings in the next hour with unread related emails
 */
async function checkUpcomingMeetings(
  userId: string,
  accountIds: string[]
): Promise<number> {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find calendar events in the next hour
    const accountConditions =
      accountIds.length === 1
        ? eq(calendarEvents.accountId, accountIds[0])
        : or(...accountIds.map((id) => eq(calendarEvents.accountId, id)));

    const upcomingMeetings = await db.query.calendarEvents.findMany({
      where: and(
        accountConditions!,
        gte(calendarEvents.startTime, now),
        lte(calendarEvents.startTime, oneHourFromNow)
      ),
    });

    console.log(
      `📅 [Meeting Check] Found ${upcomingMeetings.length} upcoming meeting(s)`
    );

    let alertsCreated = 0;

    for (const meeting of upcomingMeetings) {
      // Check if alert already exists
      const existingAlert = await db.query.proactiveAlerts.findFirst({
        where: and(
          eq(proactiveAlerts.userId, userId),
          eq(proactiveAlerts.calendarEventId, meeting.id),
          eq(proactiveAlerts.type, 'meeting_prep'),
          eq(proactiveAlerts.dismissed, false)
        ),
      });

      if (existingAlert) {
        continue;
      }

      // Search for related emails (by subject/participants)
      const searchTerm = meeting.summary || '';
      const accountConditions =
        accountIds.length === 1
          ? eq(emails.accountId, accountIds[0])
          : or(...accountIds.map((id) => eq(emails.accountId, id)));

      const relatedEmails = searchTerm
        ? await db
            .select()
            .from(emails)
            .where(
              and(
                accountConditions!,
                or(
                  like(emails.subject, `%${searchTerm}%`),
                  like(emails.bodyText, `%${searchTerm}%`)
                )
              )
            )
            .limit(5)
        : [];

      const minutesUntil = Math.floor(
        (meeting.startTime.getTime() - now.getTime()) / (1000 * 60)
      );

      await db.insert(proactiveAlerts).values({
        userId,
        type: 'meeting_prep' as ProactiveAlertType,
        priority: 'medium',
        title: `Meeting in ${minutesUntil} minutes`,
        message: meeting.summary || 'No meeting title',
        calendarEventId: meeting.id,
        actionUrl: `/dashboard/calendar?eventId=${meeting.id}`,
        actionLabel: 'View Meeting',
        metadata: {
          meetingTime: meeting.startTime,
          relatedEmailsCount: relatedEmails.length,
          minutesUntil,
        },
      });

      alertsCreated++;
    }

    return alertsCreated;
  } catch (error) {
    console.error('❌ [Meeting Check] Error:', error);
    return 0;
  }
}

/**
 * Check for emails that need follow-up (questions expecting responses)
 */
async function checkFollowUpNeeded(
  userId: string,
  accountIds: string[]
): Promise<number> {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Find sent emails with questions (containing "?") that haven't been replied to
    const accountConditions =
      accountIds.length === 1
        ? eq(emails.accountId, accountIds[0])
        : or(...accountIds.map((id) => eq(emails.accountId, id)));

    const sentEmails = await db
      .select()
      .from(emails)
      .where(
        and(
          accountConditions!,
          gte(emails.sentAt, threeDaysAgo),
          eq(emails.folderName, 'SENT')
        )
      )
      .limit(50);

    // Filter for emails with questions
    const emailsWithQuestions = sentEmails.filter((email) => {
      const text = `${email.subject || ''} ${email.bodyText || ''}`;
      return text.includes('?');
    });

    console.log(
      `❓ [Follow-up Check] Found ${emailsWithQuestions.length} sent email(s) with questions`
    );

    let alertsCreated = 0;

    for (const email of emailsWithQuestions) {
      // Check if there's a reply (same threadId, received after sent)
      const replies = email.threadId
        ? await db
            .select()
            .from(emails)
            .where(
              and(
                eq(emails.threadId, email.threadId),
                gte(emails.receivedAt, email.sentAt || email.receivedAt)
              )
            )
            .limit(1)
        : [];

      if (replies.length > 0) {
        continue; // Has reply, no follow-up needed
      }

      // Check if alert already exists
      const existingAlert = await db.query.proactiveAlerts.findFirst({
        where: and(
          eq(proactiveAlerts.userId, userId),
          eq(proactiveAlerts.emailId, email.id),
          eq(proactiveAlerts.type, 'follow_up_needed'),
          eq(proactiveAlerts.dismissed, false)
        ),
      });

      if (existingAlert) {
        continue;
      }

      const daysAgo = Math.floor(
        (Date.now() - (email.sentAt?.getTime() || Date.now())) /
          (1000 * 60 * 60 * 24)
      );

      const toAddress =
        typeof email.toAddresses === 'string'
          ? email.toAddresses
          : Array.isArray(email.toAddresses)
            ? email.toAddresses[0]?.email || 'Unknown'
            : 'Unknown';

      await db.insert(proactiveAlerts).values({
        userId,
        type: 'follow_up_needed' as ProactiveAlertType,
        priority: daysAgo > 2 ? 'medium' : 'low',
        title: `No response from ${toAddress}`,
        message: `Sent ${daysAgo} day(s) ago: ${email.subject || 'No subject'}`,
        emailId: email.id,
        actionUrl: `/dashboard/inbox?emailId=${email.id}`,
        actionLabel: 'Follow Up',
        metadata: {
          recipient: toAddress,
          daysAgo,
        },
      });

      alertsCreated++;

      // Limit follow-up alerts to 5 per cycle
      if (alertsCreated >= 5) {
        break;
      }
    }

    return alertsCreated;
  } catch (error) {
    console.error('❌ [Follow-up Check] Error:', error);
    return 0;
  }
}
