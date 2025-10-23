import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { omniscientSearch } from '@/lib/rag/omniscient-search';

// Email actions
import {
  getUnreadEmails,
  getStarredEmails,
  getEmailsByFolder,
} from '@/lib/chat/email-actions';

// Contact actions
import {
  createContact,
  searchContacts,
  getContactById,
} from '@/lib/chat/contact-actions';

// Calendar actions (will wire real functions)
import {
  createCalendarEvent,
  searchCalendarEvents,
} from '@/lib/chat/calendar-actions';

// Task actions
import {
  createTask,
  updateTask,
  deleteTask,
  getTasks,
} from '@/lib/tasks/actions';

// Folder actions
import {
  createCustomFolder,
  renameCustomFolder,
  deleteCustomFolder,
} from '@/lib/folders/actions';

// Rule creation
import {
  createEmailRule,
  parseNaturalLanguageRule,
} from '@/lib/chat/rule-creator';

// Undo system
import { undoAction } from '@/lib/chat/undo';

// Database
import { db } from '@/lib/db';
import { emails, contacts as contactsTable } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Execute confirmed chatbot function calls
 * This is where natural language becomes action
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
    const { functionCall } = body;

    if (!functionCall || !functionCall.name) {
      return NextResponse.json(
        { error: 'Function call data required' },
        { status: 400 }
      );
    }

    const { name, arguments: args } = functionCall;
    console.log(`⚡ [Execute] Function: ${name}`, args);

    let result: any;
    let message = 'Action completed successfully!';

    // ========== EMAIL OPERATIONS ==========
    switch (name) {
      case 'search_emails':
        const searchResult = await omniscientSearch(args.query, user.id, {
          includeEmails: true,
          includeContacts: false,
          includeCalendar: false,
          includeTasks: false,
          includeSettings: false,
          emailLimit: args.limit || 10,
        });
        result = searchResult.emails;
        message = searchResult.emails.summary;
        break;

      case 'send_email':
        // TODO: Integrate with actual email sending service
        message = `Email would be sent to ${args.to} with subject "${args.subject}"`;
        result = { success: true, emailId: 'mock-id' };
        break;

      case 'reply_to_email':
        // TODO: Integrate with actual email reply service
        message = `Reply would be sent to email ${args.emailId}`;
        result = { success: true };
        break;

      case 'move_emails':
        await db
          .update(emails)
          .set({ folderName: args.folder.toLowerCase() })
          .where(
            and(eq(emails.userId, user.id), inArray(emails.id, args.emailIds))
          );
        message = `Moved ${args.emailIds.length} email(s) to ${args.folder}`;
        result = { success: true, count: args.emailIds.length };
        break;

      case 'delete_emails':
        await db
          .update(emails)
          .set({ folderName: 'trash', deletedAt: new Date() })
          .where(
            and(eq(emails.userId, user.id), inArray(emails.id, args.emailIds))
          );
        message = `Deleted ${args.emailIds.length} email(s)`;
        result = { success: true, count: args.emailIds.length };
        break;

      case 'archive_emails':
        await db
          .update(emails)
          .set({ folderName: 'archive' })
          .where(
            and(eq(emails.userId, user.id), inArray(emails.id, args.emailIds))
          );
        message = `Archived ${args.emailIds.length} email(s)`;
        result = { success: true, count: args.emailIds.length };
        break;

      case 'star_emails':
        await db
          .update(emails)
          .set({ isStarred: args.star })
          .where(
            and(eq(emails.userId, user.id), inArray(emails.id, args.emailIds))
          );
        message = `${args.star ? 'Starred' : 'Unstarred'} ${args.emailIds.length} email(s)`;
        result = { success: true, count: args.emailIds.length };
        break;

      case 'mark_read_unread':
        await db
          .update(emails)
          .set({ isRead: args.read })
          .where(
            and(eq(emails.userId, user.id), inArray(emails.id, args.emailIds))
          );
        message = `Marked ${args.emailIds.length} email(s) as ${args.read ? 'read' : 'unread'}`;
        result = { success: true, count: args.emailIds.length };
        break;

      // ========== CONTACT OPERATIONS ==========
      case 'search_contacts':
        const contactSearchResult = await omniscientSearch(
          args.query,
          user.id,
          {
            includeEmails: false,
            includeContacts: true,
            includeCalendar: false,
            includeTasks: false,
            includeSettings: false,
            contactLimit: args.limit || 10,
          }
        );
        result = contactSearchResult.contacts;
        message = contactSearchResult.contacts.summary;
        break;

      case 'create_contact':
        const contactResult = await createContact({
          userId: user.id,
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          phone: args.phone,
          company: args.company,
          jobTitle: args.jobTitle,
          notes: args.notes,
        });
        result = contactResult;
        message = contactResult.success
          ? `Contact created: ${args.firstName || ''} ${args.lastName || ''} (${args.email})`
          : contactResult.message;
        break;

      case 'get_contact_details':
        const contact = await getContactById(args.contactId, user.id);
        result = contact;
        message = contact
          ? `Retrieved contact: ${contact.displayName}`
          : 'Contact not found';
        break;

      // ========== CALENDAR OPERATIONS ==========
      case 'search_calendar':
        const calendarSearchResult = await omniscientSearch(
          args.query,
          user.id,
          {
            includeEmails: false,
            includeContacts: false,
            includeCalendar: true,
            includeTasks: false,
            includeSettings: false,
            calendarLimit: args.limit || 10,
          }
        );
        result = calendarSearchResult.calendar;
        message = calendarSearchResult.calendar.summary;
        break;

      case 'create_event':
        const eventResult = await createCalendarEvent({
          userId: user.id,
          title: args.title,
          startTime: new Date(args.startTime),
          endTime: args.endTime ? new Date(args.endTime) : undefined,
          location: args.location,
          description: args.description,
          attendees: args.attendees,
        });
        result = eventResult;
        message = eventResult.success
          ? `Created event: ${args.title}`
          : eventResult.message;
        break;

      // ========== TASK OPERATIONS ==========
      case 'search_tasks':
        const taskSearchResult = await omniscientSearch(args.query, user.id, {
          includeEmails: false,
          includeContacts: false,
          includeCalendar: false,
          includeTasks: true,
          includeSettings: false,
          taskLimit: args.limit || 10,
        });
        result = taskSearchResult.tasks;
        message = taskSearchResult.tasks.summary;
        break;

      case 'create_task':
        const taskResult = await createTask({
          userId: user.id,
          title: args.title,
          description: args.description,
          dueDate: args.dueDate ? new Date(args.dueDate) : undefined,
          priority: args.priority || 'medium',
        });
        result = taskResult;
        message = taskResult.success
          ? `Task created: ${args.title}`
          : taskResult.error || 'Failed to create task';
        break;

      // ========== ORGANIZATION ==========
      case 'create_folder':
        const folderResult = await createCustomFolder({
          userId: user.id,
          name: args.name,
          description: args.description,
        });
        result = folderResult;
        message = folderResult.success
          ? `Folder created: ${args.name}`
          : folderResult.error || 'Failed to create folder';
        break;

      case 'create_rule':
        const parsedRule = await parseNaturalLanguageRule(args.description);
        const ruleResult = await createEmailRule({
          userId: user.id,
          name: parsedRule.name,
          conditions: parsedRule.conditions,
          actions: parsedRule.actions,
        });
        result = ruleResult;
        message = ruleResult.success
          ? `Rule created: ${parsedRule.name}`
          : ruleResult.error || 'Failed to create rule';
        break;

      // ========== META FUNCTIONS ==========
      case 'request_confirmation':
        result = { requiresConfirmation: true, action: args.action };
        message = `Please confirm: ${args.details}`;
        break;

      case 'undo_action':
        const undoResult = await undoAction(user.id);
        result = undoResult;
        message = undoResult.success
          ? undoResult.message
          : undoResult.error || 'Nothing to undo';
        break;

      default:
        return NextResponse.json(
          { error: `Unknown function: ${name}` },
          { status: 400 }
        );
    }

    console.log(`✅ [Execute] Success: ${name} - ${message}`);

    return NextResponse.json({
      success: true,
      message,
      result,
      functionName: name,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Execute] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to execute action',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
