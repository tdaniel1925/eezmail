/**
 * Chat Function Handlers
 * Implementation of all 40+ chatbot functions
 */

import { db } from '@/lib/db';
import { emails, emailAccounts, contacts } from '@/db/schema';
import { eq, and, or, like, gte, lte, desc, sql } from 'drizzle-orm';
import { sendEmailAction } from '@/lib/chat/actions';
import { sendContactSMS } from '@/lib/contacts/communication-actions';

// ============================================================================
// EMAIL OPERATIONS
// ============================================================================

/**
 * Search for emails
 */
export async function searchEmailsHandler(
  userId: string,
  args: {
    query?: string;
    from?: string;
    to?: string;
    dateFrom?: string;
    dateTo?: string;
    hasAttachments?: boolean;
    isUnread?: boolean;
    folder?: string;
    limit?: number;
  }
) {
  try {
    console.log(`🔍 [Search Emails] User: ${userId}`, args);

    // Get user's email accounts
    const userAccounts = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));

    if (userAccounts.length === 0) {
      return {
        success: false,
        error: 'No email accounts found',
        message: 'Please connect an email account first.',
      };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Build query conditions
    const conditions = [];

    // Filter by account IDs
    if (accountIds.length === 1) {
      conditions.push(eq(emails.accountId, accountIds[0]));
    } else {
      conditions.push(or(...accountIds.map((id) => eq(emails.accountId, id)))!);
    }

    // Filter by sender - search in both name and email fields of JSONB
    if (args.from) {
      conditions.push(
        or(
          like(sql`${emails.fromAddress}->>'email'`, `%${args.from}%`),
          like(sql`${emails.fromAddress}->>'name'`, `%${args.from}%`)
        )!
      );
    }

    // Filter by recipient - search in JSONB array
    if (args.to) {
      conditions.push(
        like(sql`CAST(${emails.toAddresses} AS TEXT)`, `%${args.to}%`)
      );
    }

    // Filter by date range
    if (args.dateFrom) {
      conditions.push(gte(emails.receivedAt, new Date(args.dateFrom)));
    }
    if (args.dateTo) {
      conditions.push(lte(emails.receivedAt, new Date(args.dateTo)));
    }

    // Filter by attachments
    if (args.hasAttachments) {
      conditions.push(eq(emails.hasAttachments, true));
    }

    // Filter by read status
    if (args.isUnread !== undefined) {
      conditions.push(eq(emails.isRead, !args.isUnread));
    }

    // Filter by folder
    if (args.folder) {
      conditions.push(like(emails.folderName, `%${args.folder}%`));
    }

    // Search in subject and body if query provided
    if (args.query) {
      conditions.push(
        or(
          like(emails.subject, `%${args.query}%`),
          like(emails.bodyText, `%${args.query}%`)
        )!
      );
    }

    // Execute query - use * instead of selecting specific fields
    const results = await db
      .select()
      .from(emails)
      .where(and(...conditions))
      .orderBy(desc(emails.receivedAt))
      .limit(args.limit || 10);

    // Format results with body preview
    const formattedResults = results.map((email) => ({
      id: email.id,
      subject: email.subject,
      fromAddress: email.fromAddress,
      toAddresses: email.toAddresses,
      receivedAt: email.receivedAt,
      isRead: email.isRead,
      hasAttachments: email.hasAttachments,
      folder: email.folderName,
      bodyPreview: email.bodyText ? email.bodyText.substring(0, 150) : '',
    }));

    console.log(`✅ [Search Emails] Found: ${formattedResults.length} emails`);

    return {
      success: true,
      count: formattedResults.length,
      emails: formattedResults,
      message: `Found ${formattedResults.length} email${formattedResults.length !== 1 ? 's' : ''}${args.from ? ` from ${args.from}` : ''}${args.query ? ` matching "${args.query}"` : ''}`,
    };
  } catch (error) {
    console.error('❌ [Search Emails Error]:', error);
    return {
      success: false,
      error: 'Failed to search emails',
      message: 'An error occurred while searching. Please try again.',
    };
  }
}

/**
 * Send a new email
 */
export async function sendEmailHandler(
  userId: string,
  args: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }
) {
  try {
    console.log(`📧 [Send Email] User: ${userId}`, args);

    // Get user's active email account
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
    });

    const activeAccount = accounts.find((a) => a.status === 'active');
    if (!activeAccount) {
      return {
        success: false,
        error: 'No active email account',
        message:
          'Please connect an email account before sending. Go to Settings > Email Accounts.',
      };
    }

    // Call existing sendEmailAction
    const result = await sendEmailAction({
      to: args.to,
      subject: args.subject,
      body: args.body,
      cc: args.cc,
      bcc: args.bcc,
      accountId: activeAccount.id,
      isHtml: true,
    });

    if (result.success) {
      console.log(`✅ [Send Email] Email sent successfully to ${args.to}`);
      return {
        success: true,
        message: `Email sent successfully to ${args.to}! 📧`,
      };
    } else {
      console.error(`❌ [Send Email] Failed:`, result.error);
      return {
        success: false,
        error: result.error,
        message: `Failed to send email: ${result.error}`,
      };
    }
  } catch (error) {
    console.error('❌ [Send Email Error]:', error);
    return {
      success: false,
      error: 'Failed to send email',
      message: 'An error occurred while sending the email. Please try again.',
    };
  }
}

/**
 * Generate an email draft for user review
 */
export async function generateDraftHandler(
  userId: string,
  args: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
  }
) {
  try {
    console.log(`📝 [Generate Draft] User: ${userId}`, args);

    // Get user's active email account
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
    });

    const activeAccount = accounts.find((a) => a.status === 'active');
    if (!activeAccount) {
      return {
        success: false,
        error: 'No active email account',
        message:
          'Please connect an email account before creating drafts. Go to Settings > Email Accounts.',
      };
    }

    // Return draft data for the composer
    return {
      success: true,
      message: 'Draft generated successfully',
      draft: {
        to: args.to,
        subject: args.subject,
        body: args.body,
        cc: args.cc || '',
        bcc: args.bcc || '',
        accountId: activeAccount.id,
        fromEmail: activeAccount.emailAddress,
      },
    };
  } catch (error) {
    console.error('❌ [Generate Draft Error]:', error);
    return {
      success: false,
      error: 'Failed to generate draft',
      message:
        'An error occurred while generating the draft. Please try again.',
    };
  }
}

/**
 * Reply to an email
 */
export async function replyToEmailHandler(
  userId: string,
  args: {
    emailId: string;
    body: string;
    replyAll?: boolean;
  }
) {
  // TODO: Implement email reply
  return {
    success: false,
    error: 'Not yet implemented',
    message: 'Email replies are coming soon! Use the reply button for now.',
  };
}

/**
 * Move emails to a folder
 */
export async function moveEmailsHandler(
  userId: string,
  args: {
    emailIds: string[];
    folder: string;
  }
) {
  // TODO: Implement move emails
  return {
    success: false,
    error: 'Not yet implemented',
    message: 'Moving emails is coming soon! Use drag-and-drop for now.',
  };
}

/**
 * Delete emails
 */
export async function deleteEmailsHandler(
  userId: string,
  args: {
    emailIds: string[];
  }
) {
  // TODO: Implement delete emails
  return {
    success: false,
    error: 'Not yet implemented',
    message: 'Deleting emails is coming soon! Use the delete button for now.',
  };
}

/**
 * Archive emails
 */
export async function archiveEmailsHandler(
  userId: string,
  args: {
    emailIds: string[];
  }
) {
  // TODO: Implement archive emails
  return {
    success: false,
    error: 'Not yet implemented',
    message: 'Archiving emails is coming soon! Use the archive button for now.',
  };
}

/**
 * Star/unstar emails
 */
export async function starEmailsHandler(
  userId: string,
  args: {
    emailIds: string[];
    star: boolean;
  }
) {
  // TODO: Implement star emails
  return {
    success: false,
    error: 'Not yet implemented',
    message: 'Starring emails is coming soon! Use the star button for now.',
  };
}

/**
 * Mark emails as read/unread
 */
export async function markReadUnreadHandler(
  userId: string,
  args: {
    emailIds: string[];
    read: boolean;
  }
) {
  // TODO: Implement mark read/unread
  return {
    success: false,
    error: 'Not yet implemented',
    message:
      'Marking emails as read/unread is coming soon! Use the mark button for now.',
  };
}

// ============================================================================
// CONTACT OPERATIONS
// ============================================================================

/**
 * Search for contacts
 */
export async function searchContactsHandler(
  userId: string,
  args: {
    query?: string;
    email?: string;
    name?: string;
    limit?: number;
  }
) {
  try {
    console.log(`🔍 [Search Contacts] User: ${userId}`, args);

    // Get user's email accounts
    const userAccounts = await db
      .select()
      .from(emailAccounts)
      .where(eq(emailAccounts.userId, userId));

    if (userAccounts.length === 0) {
      return {
        success: false,
        error: 'No email accounts found',
        message: 'Please connect an email account first.',
      };
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Build query conditions
    const conditions = [];

    // Filter by account IDs
    if (accountIds.length === 1) {
      conditions.push(eq(contacts.accountId, accountIds[0]));
    } else {
      conditions.push(
        or(...accountIds.map((id) => eq(contacts.accountId, id)))!
      );
    }

    // Search by query (name or email)
    if (args.query) {
      conditions.push(
        or(
          like(contacts.name, `%${args.query}%`),
          like(contacts.email, `%${args.query}%`)
        )!
      );
    }

    // Search by specific email
    if (args.email) {
      conditions.push(like(contacts.email, `%${args.email}%`));
    }

    // Search by specific name
    if (args.name) {
      conditions.push(like(contacts.name, `%${args.name}%`));
    }

    // Execute query
    const results = await db
      .select()
      .from(contacts)
      .where(and(...conditions))
      .limit(args.limit || 10);

    console.log(`✅ [Search Contacts] Found: ${results.length} contacts`);

    return {
      success: true,
      count: results.length,
      contacts: results.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        lastContactedAt: contact.lastContactedAt,
      })),
      message: `Found ${results.length} contact${results.length !== 1 ? 's' : ''}${args.query ? ` matching "${args.query}"` : ''}`,
    };
  } catch (error) {
    console.error('❌ [Search Contacts Error]:', error);
    return {
      success: false,
      error: 'Failed to search contacts',
      message: 'An error occurred while searching contacts. Please try again.',
    };
  }
}

export async function createContactHandler(userId: string, args: any) {
  return {
    success: false,
    error: 'Not yet implemented',
    message: 'Creating contacts is coming soon!',
  };
}

// ============================================================================
// COMMUNICATION OPERATIONS
// ============================================================================

/**
 * Send SMS to a contact
 */
export async function sendSMSHandler(
  userId: string,
  args: {
    recipient: string; // contact name, email, or phone number
    message: string;
  }
) {
  try {
    console.log(`📱 [Send SMS] User: ${userId}`, args);

    // First, try to find the contact by name or email
    const contact = await db.query.contacts.findFirst({
      where: or(
        like(contacts.name, `%${args.recipient}%`),
        like(contacts.email, `%${args.recipient}%`)
      ),
    });

    if (!contact) {
      return {
        success: false,
        error: 'Contact not found',
        message: `I couldn't find a contact matching "${args.recipient}". Please check the name and try again, or add them as a contact first.`,
      };
    }

    // Use the existing sendContactSMS function
    const result = await sendContactSMS(contact.id, args.message);

    if (result.success) {
      return {
        success: true,
        message: `✅ SMS sent successfully to ${contact.name || args.recipient}!`,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
        },
      };
    } else {
      return {
        success: false,
        error: result.error,
        message: `❌ Failed to send SMS: ${result.error}`,
      };
    }
  } catch (error) {
    console.error('❌ [Send SMS Error]:', error);
    return {
      success: false,
      error: 'Failed to send SMS',
      message:
        'An error occurred while sending the SMS. Please try again or use the contact card.',
    };
  }
}

// ... Add more handlers as needed
