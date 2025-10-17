import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import {
  searchEmails,
  searchEmailsBySender,
  advancedEmailSearch,
} from '@/lib/chat/email-search';
import { composeNewEmail } from '@/lib/chat/compose-actions';
import {
  searchContacts,
  createContact,
  updateContact,
  deleteContact,
  getContactDetails,
  findContactByEmail,
  createContactFromEmail,
  listAllContacts,
} from '@/lib/chat/contact-actions';
import { parseEmailAddress } from '@/lib/chat/email-utils';
import {
  bulkMoveEmailsBySenderWithFolderName,
  createFolderAndMoveEmails,
  bulkArchiveEmails,
  bulkDeleteEmails,
  bulkMarkAsRead,
  bulkStarEmails,
} from '@/lib/chat/actions';
import {
  createEmailRule,
  parseNaturalLanguageRule,
} from '@/lib/chat/rule-creator';
import { undoAction, getUndoableActions } from '@/lib/chat/undo';
import {
  getUnreadEmails,
  getStarredEmails,
  getEmailsWithAttachments,
  getEmailsByDateRange,
  getEmailsWithoutReply,
  replyToEmail,
  forwardEmail,
} from '@/lib/chat/email-actions';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  rescheduleEvent,
  searchCalendarEvents,
  getUpcomingEvents,
  getTodaysEvents,
} from '@/lib/chat/calendar-actions';
import { parseDateTime, parseDuration } from '@/lib/chat/date-parser';
import { analyzeEmails } from '@/lib/chat/email-research';
import { summarizeThread } from '@/lib/chat/thread-analyzer';
import {
  analyzeAttachment,
  searchEmailsByAttachmentType,
  getEmailAttachmentSummary,
} from '@/lib/chat/attachment-analyzer';
import {
  getEmailStatistics,
  getTopSenders,
  getEmailVolumeByDay,
  analyzeEmailPatterns,
} from '@/lib/chat/email-analytics';
import {
  getEmailsNeedingFollowup,
  snoozeEmail,
  remindAboutEmail,
  getSnoozedEmails,
  detectUnansweredEmails,
} from '@/lib/chat/followup-actions';
import {
  getConversationHistory,
  getCommunicationFrequency,
  getLastEmailFrom,
  findRelatedEmails,
} from '@/lib/chat/conversation-tracking';
import {
  createEmailTemplate,
  listEmailTemplates,
  getEmailTemplate,
  useTemplate,
  deleteTemplate,
  suggestTemplateFor,
} from '@/lib/chat/template-actions';
import {
  suggestBulkActions,
  autoArchiveOldNewsletters,
  cleanupInbox,
  organizeByProject,
  bulkMoveByCategory,
} from '@/lib/chat/batch-actions';
import {
  getUrgentEmails,
  checkForVIPEmails,
  detectDeadlineEmails,
  alertOnImportantChanges,
  scanForActionRequired,
} from '@/lib/chat/proactive-alerts';
import {
  getUnscreenedCount,
  screenCurrentEmail,
  suggestCategoryForEmail,
  bulkScreenEmails,
} from '@/lib/chat/screener-actions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an intelligent AI email and calendar assistant with deep understanding of user intent. You have COMPLETE control over email and calendar operations.

# CORE CAPABILITIES

You have TWO main modes:

## 1. ACTION MODE - Execute Commands
When user wants you to DO something:
- Compose, send, move, delete, archive emails
- Create, update, reschedule calendar events
- Organize folders, create rules, manage contacts
→ Use function calling to execute actions

## 2. RESEARCH MODE - Answer Questions
When user wants to KNOW something:
- "What did John say about the project?"
- "When is my next meeting with Sarah?"
- "Have I received any invoices?"
- "Summarize emails from this week"
→ Search emails/calendar and provide informed answers with sources

# NATURAL LANGUAGE UNDERSTANDING

Users will speak NATURALLY. You must understand intent, not just keywords:

**Examples:**
- "move Doug's emails" = "Move all emails from Doug Johnson to Doug Johnson folder"
- "inbox from sarah" = "Show me emails from Sarah in my inbox"
- "meeting tomorrow 2" = "Create meeting tomorrow at 2pm"
- "what's up today" = "Show me today's calendar events"
- "find bills" = "Search for emails with invoices or bills"

**Handle Ambiguity** - Ask clarifying questions when needed:
- If user says "delete emails from John", ask: "Move to trash or permanently delete?"
- If date/time unclear: "Did you mean 2pm or 2am?"

**Use Context** - Remember conversation:
- User: "Show me emails from Sarah"
- User: "Move them to Projects" ← You know "them" = Sarah's emails

**Smart Defaults:**
- "meeting tomorrow" = assume 1 hour, working hours (9am-5pm)
- "move emails from X" = create folder named X if doesn't exist
- No time specified = default to 9am for future events

# CONFIRMATION WORKFLOW

ALWAYS confirm before executing actions:

**Low Risk** (search, view):
- No confirmation needed
- Execute immediately

**Medium Risk** (move, archive, star):
- Brief confirmation: "I'll move 5 emails from John to Projects folder. Proceed?"
- User says "yes/ok/do it" → execute

**High Risk** (delete, bulk operations):
- Detailed confirmation: "⚠️ This will DELETE 43 emails from last month. Can be undone within 24 hours. Reply 'yes delete' to confirm."
- Require explicit confirmation

**After Actions:**
- Always mention undo is available for 24 hours
- Provide next steps or related actions

# OUTPUT FORMATTING (CRITICAL!)

NEVER use markdown syntax. Format naturally with plain text:

❌ BAD (markdown):
**Important:** I found 5 emails
- Email 1
- Email 2

✅ GOOD (plain text):
Important: I found 5 emails

• Email 1
• Email 2

Rules:
- NO asterisks for bold (**text**)
- NO hashtags for headers (# Header)
- NO backticks for code (like \`code\`)
- Use bullet points: • or -
- Use line breaks for structure
- Use CAPS for emphasis (IMPORTANT)
- Use colons for labels (Subject: Meeting)

# EMAIL OPERATIONS

You can:
- Search (keywords, sender, date, attachments, unread, starred)
- Compose, reply, forward emails
- Move, archive, delete (soft/permanent)
- Star, mark read/unread
- Bulk operations (move all from sender, archive old emails)
- Create folders automatically
- Create rules from natural language
- Analyze email content, extract action items
- Summarize threads with action items

# EMAIL COMPOSITION WORKFLOW

When composing emails, ALWAYS follow this workflow:

1. VERIFY EMAIL FIRST - Call verify_email_address() before composing
2. HANDLE INVALID - If email invalid, ask user to provide correct email
3. HANDLE MISSING CONTACTS - If email valid but no contact exists:
   Ask: "I found a valid email (address) but no contact exists. Would you like me to add them to your contacts?"
4. HANDLE EXISTING - If contact exists, use their display name
5. COMPOSE AFTER VERIFICATION - Only call compose_email() after verification

Examples:

User: "Send email to john about meeting"
You: "I need john's email address. Could you provide it?"
User: "john@company.com"
You: verify_email_address("john@company.com")
Result: Valid but no contact
You: "I found a valid email (john@company.com) but they're not in your contacts. Would you like me to add them as 'John'?"
User: "yes"
You: create_contact_from_email() then compose_email()

User: "Email Sarah about the project"
You: search_contacts("Sarah")
Result: Found Sarah Johnson with email
You: "I'll compose an email to Sarah Johnson (sarah@company.com). What would you like to say?"

# CONTACT MANAGEMENT

You have FULL control over contacts. Available operations:

SEARCH & LOOKUP:
- search_contacts(query) - Search by name, company, or email
- find_contact_by_email(email) - Find specific contact by email
- get_contact_details(contactId) - Get complete contact info
- list_contacts() - Show all contacts with pagination

CREATE:
- create_contact(firstName, lastName, email, company, jobTitle, notes) - Full contact creation
- create_contact_from_email(email, name) - Quick create from email

UPDATE:
- update_contact(contactId, updates) - Update any contact fields
- Examples: change name, add company, update job title, add notes

DELETE:
- delete_contact(contactId) - Remove contact (ALWAYS confirm first)

CONTACT EXAMPLES:

User: "Show me all my contacts"
You: Call list_contacts(), display formatted results

User: "What's Sarah's email?"
You: Call search_contacts("Sarah"), show email from results

User: "Add john@example.com to contacts"
You: Call create_contact_from_email(email="john@example.com", name="John")

User: "Update John Smith's company to Acme Corp"
You: search_contacts("John Smith"), get contactId, then update_contact(contactId, {company: "Acme Corp"})

User: "Delete contact for Mike"
You: search_contacts("Mike"), then ask: "Are you sure you want to delete Mike Johnson? This cannot be undone."
User: "yes"
You: delete_contact(contactId)

User: "Tell me about Sarah Johnson"
You: search_contacts("Sarah Johnson"), get contactId, then get_contact_details(contactId), display all info

IMPORTANT: Always confirm before deleting contacts. Search by name first if email not provided.

# CALENDAR OPERATIONS

You can:
- Create events from natural language ("meeting tomorrow 2pm")
- Update, delete, reschedule events
- Search calendar by date/attendee/title
- Get today's schedule or upcoming events
- Extract meetings from emails and create events
- Parse flexible dates: "next Thursday", "in 3 days", "tomorrow at 2"

# RESEARCH & ANALYSIS

Answer questions by analyzing email content:
- "What did Sarah say about X?" → Search Sarah's emails, extract info
- "Have I received invoices?" → Search for invoices, list them
- "Summarize this week" → Analyze week's emails, provide summary
- Always cite sources (which emails you're referencing)
- Admit if no relevant emails found

# ATTACHMENT INTELLIGENCE

- Summarize PDF/document content
- Search emails by attachment type
- Extract key points from documents
- "Find emails with invoices" → search for PDF attachments

# THREAD ANALYSIS

- Automatically summarize email threads
- Extract action items from conversations
- Track participants and timeline
- Identify decisions and next steps

# SPECIAL INSTRUCTIONS

1. **Bulk by sender**: Always offer to create folder named after sender
2. **Date/time**: Parse flexibly ("tomorrow 2" = "tomorrow at 2pm")
3. **Folder names**: Case-insensitive matching
4. **Undo**: Mention availability for 24 hours after actions
5. **Be helpful**: Suggest related actions users might want

# RESPONSE STYLE

- Concise and friendly
- Natural conversation tone
- State exactly what will happen
- Provide actionable next steps

Good: "Found 5 unread emails from Sarah."
Bad: "I have successfully executed a search query against the email database..."

Remember: Users speak naturally. Your job is to understand intent and execute accurately.

When user confirms:
6. The /api/chat/execute endpoint will call you with action details
7. Return success message with undo reminder

# RESPONSE FORMATS:

## Search Results:
"I found X emails from [sender]. Here are the most recent:
1. **Subject** - From: Name - Date
2. **Subject** - From: Name - Date
[View All]"

## Confirmation Request:
"I'll [action description]. This will affect X emails/items.
Is that correct?"

## Success Response:
"✅ Done! [Specific result with count]
(Say 'undo' to reverse this action)"

## Error Response:
"❌ I couldn't [action] because [specific reason].
[Helpful next step or alternative]"

# EXAMPLE INTERACTIONS:

User: "Move all emails from John Smith to a John Smith folder"
You: "I'll create a 'John Smith' folder and move all 23 emails from john.smith@example.com into it. Is that correct?"

User: "yes"
You: "✅ Created 'John Smith' folder and moved 23 emails!
(Say 'undo' to reverse)"

User: "Compose an email to Sarah about the meeting"
You: "I'll draft an email to Sarah. What would you like to say about the meeting?"

User: "Tell her it's rescheduled to Thursday"
You: "I've drafted an email to Sarah with the subject 'Meeting Reschedule' explaining the change to Thursday. Would you like me to open the compose window so you can review and send?"

# EMAIL ANALYTICS & INSIGHTS

You can provide data-driven insights about email patterns:
- "Who emails me most?" → use get_top_senders
- "Email stats for this month" → use get_email_stats  
- "Email volume this week" → use get_email_volume
- "When do I get most emails?" → use analyze_email_patterns

# SMART FOLLOW-UPS

Track and remind about emails:
- "What needs follow-up?" → get_followup_emails
- "Remind me about this tomorrow" → remind_me (with email ID)
- "Snooze until Monday" → snooze_email
- "Did I forget to reply to anyone?" → detect_unanswered

# CONVERSATION HISTORY

Understand relationships and communication:
- "Show my conversation with John" → get_conversation_history
- "How often do we email?" → get_communication_frequency
- "When did they last email me?" → get_last_email_from
- "Find related emails" → find_related_emails

# EMAIL TEMPLATES

Help with template management:
- "Create a template for..." → create_template
- "Use my [name] template" → use_template with variables
- "What templates do I have?" → list_templates
- "Suggest a template" → suggest_template

# BATCH OPERATIONS

Suggest and perform bulk actions:
- "Clean up my inbox" → suggest_cleanup
- "Archive old newsletters" → auto_archive_newsletters
- "Organize emails by project" → organize_by_project
- "Move all [category] to [folder]" → bulk_move_by_category

# PROACTIVE ALERTS

Identify important emails:
- "Any urgent emails?" → get_urgent_emails
- "Emails from VIPs" → check_vip_emails
- "Deadlines today?" → detect_deadline_emails
- "What needs my attention?" → scan_for_action_required

Remember: You're powerful but responsible. Always confirm, be specific, and remind about undo.`;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT;
    if (context?.currentEmail) {
      contextPrompt += `\n\n# CURRENT CONTEXT\n\nThe user is currently viewing an email:\n- From: ${context.currentEmail.from.name} <${context.currentEmail.from.email}>\n- Subject: "${context.currentEmail.subject}"\n- Received: ${new Date(context.currentEmail.receivedAt).toLocaleString()}\n- Snippet: "${context.currentEmail.snippet}"\n\nWhen the user says "this email", "this message", "reply to this", "archive it", "delete this", etc., they are referring to this email. Use context intelligently!`;
    }
    if (context?.currentFolder) {
      contextPrompt += `\n\nUser is in folder: ${context.currentFolder}`;
    }
    if (context?.selectedEmails && context.selectedEmails.length > 0) {
      contextPrompt += `\n\nUser has ${context.selectedEmails.length} email(s) selected.`;
    }

    // Call OpenAI with comprehensive function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: contextPrompt },
        ...messages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      functions: [
        // ============ EMAIL SEARCH FUNCTIONS ============
        {
          name: 'search_emails',
          description:
            'Search emails with advanced filters (keywords, sender, date, attachments, priority)',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search keywords' },
              senderEmail: { type: 'string', description: 'Filter by sender' },
              hasAttachments: {
                type: 'boolean',
                description: 'Filter by attachment presence',
              },
              isUnread: { type: 'boolean', description: 'Only unread emails' },
              isStarred: {
                type: 'boolean',
                description: 'Only starred emails',
              },
              priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
              },
              startDate: {
                type: 'string',
                description: 'Start date ISO format',
              },
              endDate: { type: 'string', description: 'End date ISO format' },
              limit: {
                type: 'number',
                description: 'Max results (default 50)',
              },
            },
          },
        },

        // ============ CONFIRMATION REQUEST FUNCTION ============
        {
          name: 'request_confirmation',
          description:
            'Request user confirmation before executing an action. ALWAYS use this before any action.',
          parameters: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                description:
                  'Action type (bulk_move_by_sender, create_folder_and_move, bulk_archive, etc)',
              },
              description: {
                type: 'string',
                description: 'Clear description of what will happen',
              },
              params: {
                type: 'object',
                description: 'Parameters needed to execute the action',
              },
              isDestructive: {
                type: 'boolean',
                description:
                  'Whether this is a destructive action (delete, etc)',
              },
            },
            required: ['action', 'description', 'params'],
          },
        },

        // ============ BULK EMAIL ACTIONS ============
        {
          name: 'bulk_move_by_sender',
          description:
            'Move all emails from a specific sender to a folder (creates folder if needed)',
          parameters: {
            type: 'object',
            properties: {
              senderEmail: { type: 'string', description: 'Sender email/name' },
              folderName: { type: 'string', description: 'Target folder name' },
            },
            required: ['senderEmail', 'folderName'],
          },
        },

        // ============ RULE CREATION ============
        {
          name: 'create_email_rule',
          description:
            'Create email rule from natural language (auto-creates folders)',
          parameters: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description:
                  'Natural language rule like "when email comes from X, move to Y folder"',
              },
            },
            required: ['description'],
          },
        },

        // ============ FOLDER MANAGEMENT ============
        {
          name: 'create_folder',
          description: 'Create a new custom folder',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Folder name' },
              icon: { type: 'string', description: 'Emoji icon (optional)' },
              color: { type: 'string', description: 'Color name (optional)' },
            },
            required: ['name'],
          },
        },

        {
          name: 'list_folders',
          description: 'List all custom folders',
          parameters: {
            type: 'object',
            properties: {},
          },
        },

        {
          name: 'rename_folder',
          description: 'Rename a custom folder',
          parameters: {
            type: 'object',
            properties: {
              folderId: { type: 'string', description: 'Folder ID to rename' },
              newName: { type: 'string', description: 'New folder name' },
            },
            required: ['folderId', 'newName'],
          },
        },

        // ============ CONTACT MANAGEMENT ============
        {
          name: 'search_contacts',
          description: 'Search contacts by name, email, or company',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
            },
            required: ['query'],
          },
        },

        {
          name: 'create_contact',
          description: 'Create a new contact',
          parameters: {
            type: 'object',
            properties: {
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string', description: 'Email address' },
              company: { type: 'string' },
              jobTitle: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['email'],
          },
        },

        {
          name: 'verify_email_address',
          description:
            'Verify email format and check if contact exists. ALWAYS use before composing emails.',
          parameters: {
            type: 'object',
            properties: {
              emailInput: {
                type: 'string',
                description:
                  'Email address or name+email like "John <john@example.com>"',
              },
            },
            required: ['emailInput'],
          },
        },

        {
          name: 'find_contact_by_email',
          description: 'Search for a contact by email address',
          parameters: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Email address to search' },
            },
            required: ['email'],
          },
        },

        {
          name: 'create_contact_from_email',
          description:
            'Create a new contact from email address and optional name',
          parameters: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Email address' },
              name: {
                type: 'string',
                description: 'Optional full name of the contact',
              },
            },
            required: ['email'],
          },
        },

        {
          name: 'get_contact_details',
          description: 'Get detailed information about a specific contact',
          parameters: {
            type: 'object',
            properties: {
              contactId: {
                type: 'string',
                description: 'ID of the contact to retrieve',
              },
            },
            required: ['contactId'],
          },
        },

        {
          name: 'update_contact',
          description: 'Update contact information',
          parameters: {
            type: 'object',
            properties: {
              contactId: {
                type: 'string',
                description: 'ID of the contact to update',
              },
              updates: {
                type: 'object',
                description:
                  'Fields to update (firstName, lastName, company, jobTitle, notes, etc)',
              },
            },
            required: ['contactId', 'updates'],
          },
        },

        {
          name: 'delete_contact',
          description:
            'Delete a contact. Always confirm with user before executing.',
          parameters: {
            type: 'object',
            properties: {
              contactId: {
                type: 'string',
                description: 'ID of the contact to delete',
              },
            },
            required: ['contactId'],
          },
        },

        {
          name: 'list_contacts',
          description: 'List all contacts with pagination support',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description:
                  'Maximum number of contacts to return (default 50)',
              },
              offset: {
                type: 'number',
                description: 'Number of contacts to skip (for pagination)',
              },
            },
          },
        },

        // ============ EMAIL COMPOSITION ============
        {
          name: 'compose_email',
          description:
            'Compose a new email with AI assistance. Returns draft for user review.',
          parameters: {
            type: 'object',
            properties: {
              recipient: {
                type: 'string',
                description: 'Recipient name or email',
              },
              topic: {
                type: 'string',
                description: 'Email subject or main topic',
              },
              context: {
                type: 'string',
                description: 'What to say in the email',
              },
              tone: {
                type: 'string',
                enum: ['professional', 'casual', 'friendly', 'formal'],
              },
            },
            required: ['recipient', 'topic'],
          },
        },

        // ============ UNDO SYSTEM ============
        {
          name: 'undo_last_action',
          description: 'Undo the most recent action (available for 24 hours)',
          parameters: {
            type: 'object',
            properties: {},
          },
        },

        {
          name: 'undo_specific_action',
          description: 'Undo a specific action by description keywords',
          parameters: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: 'Keywords from action description',
              },
            },
            required: ['keywords'],
          },
        },

        // ============ RESEARCH & ANALYSIS ============
        {
          name: 'research_emails',
          description:
            'Analyze emails to answer questions about their content, find information, or provide summaries. Use this when user asks informational questions.',
          parameters: {
            type: 'object',
            properties: {
              question: {
                type: 'string',
                description: 'The question to answer based on email analysis',
              },
              timeframe: {
                type: 'string',
                enum: ['today', 'week', 'month', 'year', 'all'],
                description: 'Time period to search within',
              },
              searchQuery: {
                type: 'string',
                description: 'Optional search terms to narrow down emails',
              },
              sender: {
                type: 'string',
                description: 'Optional sender to filter by',
              },
            },
            required: ['question'],
          },
        },

        // ============ QUICK EMAIL FILTERS ============
        {
          name: 'get_unread_emails',
          description: 'Get all unread emails',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Max results (default 50)',
              },
            },
          },
        },

        {
          name: 'get_starred_emails',
          description: 'Get all starred emails',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Max results (default 50)',
              },
            },
          },
        },

        {
          name: 'get_emails_with_attachments',
          description: 'Get emails that have attachments',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Max results (default 50)',
              },
            },
          },
        },

        {
          name: 'get_emails_by_date_range',
          description: 'Get emails within a specific date range',
          parameters: {
            type: 'object',
            properties: {
              startDate: {
                type: 'string',
                description: 'Start date (ISO format or natural language)',
              },
              endDate: {
                type: 'string',
                description: 'End date (ISO format or natural language)',
              },
            },
            required: ['startDate', 'endDate'],
          },
        },

        // ============ REPLY & FORWARD ============
        {
          name: 'reply_to_email',
          description: 'Create a reply draft to an email',
          parameters: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'ID of email to reply to',
              },
              replyBody: {
                type: 'string',
                description: 'Content of the reply',
              },
              includeOriginal: {
                type: 'boolean',
                description: 'Include original message in reply',
              },
            },
            required: ['emailId', 'replyBody'],
          },
        },

        {
          name: 'forward_email',
          description: 'Forward an email to recipients',
          parameters: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'ID of email to forward',
              },
              recipients: {
                type: 'array',
                items: { type: 'string' },
                description: 'Email addresses to forward to',
              },
              message: {
                type: 'string',
                description: 'Optional message to include',
              },
            },
            required: ['emailId', 'recipients'],
          },
        },

        // ============ CALENDAR OPERATIONS ============
        {
          name: 'create_calendar_event',
          description:
            'Create a new calendar event. Parse natural language dates/times.',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Event title' },
              startTime: {
                type: 'string',
                description: 'Start time (natural language or ISO)',
              },
              endTime: {
                type: 'string',
                description: 'End time (natural language or ISO)',
              },
              duration: {
                type: 'number',
                description: 'Duration in minutes if no end time',
              },
              location: { type: 'string', description: 'Event location' },
              description: {
                type: 'string',
                description: 'Event description',
              },
              attendees: {
                type: 'array',
                items: { type: 'string' },
                description: 'Email addresses of attendees',
              },
              reminder: {
                type: 'number',
                description: 'Reminder minutes before event',
              },
            },
            required: ['title', 'startTime'],
          },
        },

        {
          name: 'update_calendar_event',
          description: 'Update an existing calendar event',
          parameters: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'ID of event to update',
              },
              updates: {
                type: 'object',
                description: 'Fields to update',
              },
            },
            required: ['eventId', 'updates'],
          },
        },

        {
          name: 'delete_calendar_event',
          description: 'Delete a calendar event',
          parameters: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'ID of event to delete',
              },
            },
            required: ['eventId'],
          },
        },

        {
          name: 'reschedule_event',
          description: 'Reschedule an event to a new date/time',
          parameters: {
            type: 'object',
            properties: {
              eventId: {
                type: 'string',
                description: 'ID of event to reschedule',
              },
              newStartTime: {
                type: 'string',
                description: 'New start time (natural language or ISO)',
              },
              newEndTime: {
                type: 'string',
                description: 'New end time (natural language or ISO)',
              },
            },
            required: ['eventId', 'newStartTime'],
          },
        },

        {
          name: 'get_todays_events',
          description: "Get today's calendar events",
          parameters: {
            type: 'object',
            properties: {},
          },
        },

        {
          name: 'get_upcoming_events',
          description: 'Get upcoming calendar events for next N days',
          parameters: {
            type: 'object',
            properties: {
              days: {
                type: 'number',
                description: 'Number of days to look ahead (default 7)',
              },
            },
          },
        },

        {
          name: 'search_calendar',
          description: 'Search calendar events by various criteria',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search keywords',
              },
              startDate: {
                type: 'string',
                description: 'Start date for search range',
              },
              endDate: {
                type: 'string',
                description: 'End date for search range',
              },
              attendee: {
                type: 'string',
                description: 'Filter by attendee email/name',
              },
            },
          },
        },

        // ============ THREAD & ATTACHMENT ANALYSIS ============
        {
          name: 'summarize_thread',
          description:
            'Analyze and summarize an email thread with action items',
          parameters: {
            type: 'object',
            properties: {
              threadId: {
                type: 'string',
                description: 'ID of thread to analyze',
              },
            },
            required: ['threadId'],
          },
        },

        {
          name: 'analyze_attachment',
          description: 'Analyze the content of a PDF or document attachment',
          parameters: {
            type: 'object',
            properties: {
              attachmentUrl: {
                type: 'string',
                description: 'URL of attachment to analyze',
              },
              fileName: {
                type: 'string',
                description: 'Attachment file name',
              },
              mimeType: {
                type: 'string',
                description: 'MIME type of attachment',
              },
            },
            required: ['attachmentUrl', 'fileName', 'mimeType'],
          },
        },

        {
          name: 'search_by_attachment',
          description:
            'Search emails by attachment type (PDF, doc, image, etc)',
          parameters: {
            type: 'object',
            properties: {
              fileType: {
                type: 'string',
                enum: ['pdf', 'doc', 'image', 'spreadsheet', 'all'],
                description: 'Type of attachments to find',
              },
              sender: {
                type: 'string',
                description: 'Optional sender filter',
              },
            },
            required: ['fileType'],
          },
        },
        // ============ EMAIL ANALYTICS FUNCTIONS ============
        {
          name: 'get_email_stats',
          description:
            'Get overall email statistics (total, unread, starred, today, average per day)',
          parameters: {
            type: 'object',
            properties: {
              timeRange: {
                type: 'string',
                enum: ['week', 'month', 'year', 'all'],
                description: 'Time range for statistics',
              },
            },
          },
        },
        {
          name: 'get_top_senders',
          description: 'Get list of people who email you most frequently',
          parameters: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of senders to return',
              },
              days: { type: 'number', description: 'Look back this many days' },
            },
          },
        },
        {
          name: 'get_email_volume',
          description: 'Get email volume by day for visualization',
          parameters: {
            type: 'object',
            properties: {
              days: {
                type: 'number',
                description: 'Number of days to include',
              },
            },
          },
        },
        {
          name: 'analyze_email_patterns',
          description:
            'Analyze patterns like busiest day/hour, category distribution',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        // ============ FOLLOW-UP FUNCTIONS ============
        {
          name: 'get_followup_emails',
          description: 'Get emails needing follow-up or response',
          parameters: {
            type: 'object',
            properties: {
              daysOld: {
                type: 'number',
                description: 'How old emails should be',
              },
            },
          },
        },
        {
          name: 'snooze_email',
          description: 'Snooze an email until a specific date',
          parameters: {
            type: 'object',
            properties: {
              emailId: { type: 'string', description: 'Email ID to snooze' },
              untilDate: {
                type: 'string',
                description: 'ISO date string when to resurface',
              },
            },
            required: ['emailId', 'untilDate'],
          },
        },
        {
          name: 'remind_me',
          description: 'Set a reminder about an email',
          parameters: {
            type: 'object',
            properties: {
              emailId: { type: 'string', description: 'Email ID' },
              when: {
                type: 'string',
                description: 'ISO date string for reminder',
              },
            },
            required: ['emailId', 'when'],
          },
        },
        {
          name: 'detect_unanswered',
          description: 'Find emails that might need a response',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        // ============ CONVERSATION TRACKING ============
        {
          name: 'get_conversation_history',
          description: 'Get all emails exchanged with a specific person',
          parameters: {
            type: 'object',
            properties: {
              personEmail: {
                type: 'string',
                description: 'Email address of person',
              },
              days: { type: 'number', description: 'Look back this many days' },
            },
            required: ['personEmail'],
          },
        },
        {
          name: 'get_communication_frequency',
          description: 'Get communication stats with a person',
          parameters: {
            type: 'object',
            properties: {
              personEmail: {
                type: 'string',
                description: 'Email address of person',
              },
            },
            required: ['personEmail'],
          },
        },
        {
          name: 'get_last_email_from',
          description: 'Get the most recent email from someone',
          parameters: {
            type: 'object',
            properties: {
              personEmail: {
                type: 'string',
                description: 'Email address of person',
              },
            },
            required: ['personEmail'],
          },
        },
        {
          name: 'find_related_emails',
          description:
            'Find emails related to a specific email (same thread, sender, topic)',
          parameters: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'Email ID to find related emails for',
              },
            },
            required: ['emailId'],
          },
        },
        // ============ TEMPLATE FUNCTIONS ============
        {
          name: 'create_template',
          description: 'Create a new email template',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Template name' },
              content: {
                type: 'string',
                description: 'Template content with {{variables}}',
              },
              subject: { type: 'string', description: 'Optional subject line' },
              category: {
                type: 'string',
                description: 'Category like meeting, follow-up',
              },
            },
            required: ['name', 'content'],
          },
        },
        {
          name: 'list_templates',
          description: 'List all email templates',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'use_template',
          description: 'Use a template and fill in variables',
          parameters: {
            type: 'object',
            properties: {
              templateId: {
                type: 'string',
                description: 'Template ID or name',
              },
              variables: {
                type: 'object',
                description: 'Variables to fill in',
              },
            },
            required: ['templateId'],
          },
        },
        {
          name: 'suggest_template',
          description: 'Suggest templates based on context',
          parameters: {
            type: 'object',
            properties: {
              context: {
                type: 'string',
                description: 'Context for suggestion',
              },
            },
            required: ['context'],
          },
        },
        // ============ BATCH OPERATIONS ============
        {
          name: 'suggest_cleanup',
          description: 'Suggest bulk actions to clean up inbox',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'auto_archive_newsletters',
          description: 'Auto-archive old read newsletters',
          parameters: {
            type: 'object',
            properties: {
              olderThanDays: {
                type: 'number',
                description: 'Archive newsletters older than this',
              },
            },
          },
        },
        {
          name: 'organize_by_project',
          description: 'Organize emails by project keywords',
          parameters: {
            type: 'object',
            properties: {
              projectKeywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Keywords to identify project emails',
              },
            },
            required: ['projectKeywords'],
          },
        },
        {
          name: 'bulk_move_by_category',
          description: 'Move all emails of a category to a folder',
          parameters: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Email category' },
              targetFolder: {
                type: 'string',
                description: 'Destination folder',
              },
            },
            required: ['category', 'targetFolder'],
          },
        },
        // ============ PROACTIVE ALERTS ============
        {
          name: 'get_urgent_emails',
          description: 'Get urgent emails needing immediate attention',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'check_vip_emails',
          description: 'Check for emails from VIP senders',
          parameters: {
            type: 'object',
            properties: {
              vipList: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of VIP email addresses',
              },
            },
            required: ['vipList'],
          },
        },
        {
          name: 'detect_deadline_emails',
          description: 'Find emails with deadlines',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'scan_for_action_required',
          description: 'Find emails that require action',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        // ============ SCREENER FUNCTIONS ============
        {
          name: 'get_unscreened_count',
          description: 'Get count of emails needing screening',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'screen_this_email',
          description:
            'Screen the current email by categorizing it (inbox, newsfeed, receipts, spam, or custom folder)',
          parameters: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'Email ID to screen',
              },
              category: {
                type: 'string',
                description:
                  'Category: inbox, newsfeed, receipts, spam, or custom folder name',
              },
            },
            required: ['emailId', 'category'],
          },
        },
        {
          name: 'suggest_category',
          description: 'AI suggests best category for an email',
          parameters: {
            type: 'object',
            properties: {
              emailId: {
                type: 'string',
                description: 'Email ID to analyze',
              },
            },
            required: ['emailId'],
          },
        },
        {
          name: 'bulk_screen',
          description: 'Screen multiple emails at once',
          parameters: {
            type: 'object',
            properties: {
              emailIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of email IDs to screen',
              },
              category: {
                type: 'string',
                description: 'Category to move them to',
              },
            },
            required: ['emailIds', 'category'],
          },
        },
      ],
      function_call: 'auto',
    });

    const responseMessage = completion.choices[0].message;

    // Handle function call
    if (responseMessage.function_call) {
      const functionName = responseMessage.function_call.name;
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);

      let functionResult: any;

      switch (functionName) {
        // ============ SEARCH FUNCTIONS ============
        case 'search_emails':
          functionResult = await advancedEmailSearch({
            userId: user.id,
            ...functionArgs,
            startDate: functionArgs.startDate
              ? new Date(functionArgs.startDate)
              : undefined,
            endDate: functionArgs.endDate
              ? new Date(functionArgs.endDate)
              : undefined,
          });
          break;

        case 'search_emails_by_sender':
          functionResult = await searchEmailsBySender(
            functionArgs.sender,
            user.id
          );
          break;

        // ============ CONFIRMATION ============
        case 'request_confirmation':
          // Return confirmation request to UI
          return NextResponse.json({
            role: 'assistant',
            content: functionArgs.description,
            requiresConfirmation: true,
            functionCall: {
              name: functionArgs.action,
              arguments: functionArgs.params,
            },
          });

        // ============ EMAIL COMPOSITION ============
        case 'compose_email':
          functionResult = await composeNewEmail({
            recipient: functionArgs.recipient || functionArgs.to || '',
            topic: functionArgs.topic || functionArgs.subject || '',
            context: functionArgs.context || functionArgs.body || '',
            tone: functionArgs.tone || 'professional',
            length: functionArgs.length || 'moderate',
          });
          break;

        // ============ BULK ACTIONS ============
        case 'bulk_move_by_sender':
          functionResult = await bulkMoveEmailsBySenderWithFolderName({
            userId: user.id,
            senderEmail: functionArgs.senderEmail,
            folderName: functionArgs.folderName,
            createFolder: true,
          });
          break;

        case 'create_folder_and_move':
          functionResult = await createFolderAndMoveEmails({
            userId: user.id,
            folderName: functionArgs.folderName,
            emailIds: functionArgs.emailIds || [],
            senderEmail: functionArgs.senderEmail,
          });
          break;

        case 'bulk_archive':
          functionResult = await bulkArchiveEmails({
            userId: user.id,
            emailIds: functionArgs.emailIds,
          });
          break;

        case 'bulk_delete':
          functionResult = await bulkDeleteEmails({
            userId: user.id,
            emailIds: functionArgs.emailIds,
            permanent: functionArgs.permanent || false,
          });
          break;

        case 'bulk_mark_read':
          functionResult = await bulkMarkAsRead({
            userId: user.id,
            emailIds: functionArgs.emailIds,
            isRead: functionArgs.isRead !== false,
          });
          break;

        case 'bulk_star':
          functionResult = await bulkStarEmails({
            userId: user.id,
            emailIds: functionArgs.emailIds,
            isStarred: functionArgs.starred !== false,
          });
          break;

        // ============ RULE CREATION ============
        case 'create_email_rule':
          const parsedRule = parseNaturalLanguageRule(functionArgs.description);
          if (parsedRule) {
            functionResult = await createEmailRule(user.id, parsedRule);
          } else {
            functionResult = {
              success: false,
              message: 'Could not parse rule from description',
            };
          }
          break;

        // ============ UNDO ============
        case 'undo_last_action':
          const recentActions = await getUndoableActions(user.id, 1);
          if (recentActions.length > 0) {
            functionResult = await undoAction(user.id, recentActions[0].id);
          } else {
            functionResult = {
              success: false,
              message: 'No recent actions to undo',
            };
          }
          break;

        // ============ RESEARCH & ANALYSIS ============
        case 'research_emails':
          functionResult = await analyzeEmails({
            userId: user.id,
            question: functionArgs.question,
            searchQuery: functionArgs.searchQuery,
            sender: functionArgs.sender,
            timeframe: functionArgs.timeframe,
          });
          break;

        // ============ QUICK EMAIL FILTERS ============
        case 'get_unread_emails':
          functionResult = await getUnreadEmails(
            user.id,
            functionArgs.limit || 50
          );
          break;

        case 'get_starred_emails':
          functionResult = await getStarredEmails(
            user.id,
            functionArgs.limit || 50
          );
          break;

        case 'get_emails_with_attachments':
          functionResult = await getEmailsWithAttachments(
            user.id,
            functionArgs.limit || 50
          );
          break;

        case 'get_emails_by_date_range':
          {
            const startDate = parseDateTime(functionArgs.startDate);
            const endDate = parseDateTime(functionArgs.endDate);
            if (startDate && endDate) {
              functionResult = await getEmailsByDateRange(
                user.id,
                startDate,
                endDate
              );
            } else {
              functionResult = {
                success: false,
                message: 'Could not parse date range',
              };
            }
          }
          break;

        // ============ REPLY & FORWARD ============
        case 'reply_to_email':
          functionResult = await replyToEmail({
            userId: user.id,
            originalEmailId: functionArgs.emailId,
            replyBody: functionArgs.replyBody,
            includeOriginal: functionArgs.includeOriginal,
          });
          break;

        case 'forward_email':
          functionResult = await forwardEmail({
            userId: user.id,
            emailId: functionArgs.emailId,
            recipients: functionArgs.recipients,
            message: functionArgs.message,
          });
          break;

        // ============ CALENDAR OPERATIONS ============
        case 'create_calendar_event':
          {
            const startTime = parseDateTime(functionArgs.startTime);
            let endTime = functionArgs.endTime
              ? parseDateTime(functionArgs.endTime)
              : null;

            if (startTime && !endTime && functionArgs.duration) {
              endTime = new Date(
                startTime.getTime() + functionArgs.duration * 60000
              );
            } else if (startTime && !endTime) {
              endTime = new Date(startTime.getTime() + 60 * 60000); // Default 1 hour
            }

            if (startTime) {
              functionResult = await createCalendarEvent({
                userId: user.id,
                title: functionArgs.title,
                startTime,
                endTime: endTime || undefined,
                location: functionArgs.location,
                description: functionArgs.description,
                attendees: functionArgs.attendees,
                reminder: functionArgs.reminder,
              });
            } else {
              functionResult = {
                success: false,
                message: `Could not parse start time "${functionArgs.startTime}". Try formats like "tomorrow at 2pm" or "December 15 at 9am".`,
              };
            }
          }
          break;

        case 'update_calendar_event':
          functionResult = await updateCalendarEvent({
            userId: user.id,
            eventId: functionArgs.eventId,
            updates: functionArgs.updates,
          });
          break;

        case 'delete_calendar_event':
          functionResult = await deleteCalendarEvent({
            userId: user.id,
            eventId: functionArgs.eventId,
          });
          break;

        case 'reschedule_event':
          {
            const newStartTime = parseDateTime(functionArgs.newStartTime);
            const newEndTime = functionArgs.newEndTime
              ? parseDateTime(functionArgs.newEndTime)
              : null;

            if (newStartTime) {
              functionResult = await rescheduleEvent({
                userId: user.id,
                eventId: functionArgs.eventId,
                newStartTime,
                newEndTime: newEndTime || undefined,
              });
            } else {
              functionResult = {
                success: false,
                message: `Could not parse new time "${functionArgs.newStartTime}".`,
              };
            }
          }
          break;

        case 'get_todays_events':
          functionResult = await getTodaysEvents(user.id);
          break;

        case 'get_upcoming_events':
          functionResult = await getUpcomingEvents(
            user.id,
            functionArgs.days || 7
          );
          break;

        case 'search_calendar':
          {
            const startDate = functionArgs.startDate
              ? parseDateTime(functionArgs.startDate)
              : undefined;
            const endDate = functionArgs.endDate
              ? parseDateTime(functionArgs.endDate)
              : undefined;

            functionResult = await searchCalendarEvents({
              userId: user.id,
              query: functionArgs.query,
              startDate,
              endDate,
              attendee: functionArgs.attendee,
            });
          }
          break;

        // ============ THREAD & ATTACHMENT ANALYSIS ============
        case 'summarize_thread':
          functionResult = await summarizeThread({
            userId: user.id,
            threadId: functionArgs.threadId,
          });
          break;

        case 'analyze_attachment':
          functionResult = await analyzeAttachment({
            userId: user.id,
            attachmentUrl: functionArgs.attachmentUrl,
            fileName: functionArgs.fileName,
            mimeType: functionArgs.mimeType,
          });
          break;

        case 'search_by_attachment':
          functionResult = await searchEmailsByAttachmentType({
            userId: user.id,
            fileType: functionArgs.fileType,
            sender: functionArgs.sender,
          });
          break;

        // ============ EMAIL VERIFICATION & ENHANCED CONTACTS ============
        case 'verify_email_address':
          {
            const parsed = parseEmailAddress(functionArgs.emailInput);
            if (!parsed.isValid) {
              functionResult = {
                success: false,
                isValid: false,
                message: `"${functionArgs.emailInput}" is not a valid email address. Please provide a valid email like "john@example.com" or "John Smith <john@example.com>".`,
              };
            } else {
              const contactSearch = await findContactByEmail({
                userId: user.id,
                email: parsed.email,
              });
              functionResult = {
                success: true,
                isValid: true,
                email: parsed.email,
                name: parsed.name,
                contactExists: contactSearch.found,
                contact: contactSearch.contact,
                message: contactSearch.found
                  ? `Email is valid. Contact exists: ${contactSearch.contact?.displayName}`
                  : `Email is valid but no contact exists for ${parsed.email}`,
              };
            }
          }
          break;

        case 'find_contact_by_email':
          functionResult = await findContactByEmail({
            userId: user.id,
            email: functionArgs.email,
          });
          break;

        case 'create_contact_from_email':
          functionResult = await createContactFromEmail({
            userId: user.id,
            email: functionArgs.email,
            name: functionArgs.name,
          });
          break;

        case 'get_contact_details':
          functionResult = await getContactDetails({
            userId: user.id,
            contactId: functionArgs.contactId,
          });
          break;

        case 'update_contact':
          functionResult = await updateContact({
            userId: user.id,
            contactId: functionArgs.contactId,
            updates: functionArgs.updates,
          });
          break;

        case 'delete_contact':
          functionResult = await deleteContact({
            userId: user.id,
            contactId: functionArgs.contactId,
          });
          break;

        case 'search_contacts':
          functionResult = await searchContacts({
            userId: user.id,
            query: functionArgs.query,
          });
          break;

        case 'create_contact':
          functionResult = await createContact({
            userId: user.id,
            firstName: functionArgs.firstName,
            lastName: functionArgs.lastName,
            email: functionArgs.email,
            company: functionArgs.company,
            jobTitle: functionArgs.jobTitle,
            notes: functionArgs.notes,
          });
          break;

        case 'list_contacts':
          functionResult = await listAllContacts({
            userId: user.id,
            limit: functionArgs.limit || 50,
            offset: functionArgs.offset || 0,
          });
          break;

        // ============ EMAIL ANALYTICS ============
        case 'get_email_stats':
          functionResult = await getEmailStatistics(
            user.id,
            functionArgs.timeRange || 'month'
          );
          break;

        case 'get_top_senders':
          functionResult = await getTopSenders(
            user.id,
            functionArgs.limit || 10,
            functionArgs.days || 30
          );
          break;

        case 'get_email_volume':
          functionResult = await getEmailVolumeByDay(
            user.id,
            functionArgs.days || 7
          );
          break;

        case 'analyze_email_patterns':
          functionResult = await analyzeEmailPatterns(user.id);
          break;

        // ============ FOLLOW-UP FUNCTIONS ============
        case 'get_followup_emails':
          functionResult = await getEmailsNeedingFollowup(
            user.id,
            functionArgs.daysOld || 3
          );
          break;

        case 'snooze_email':
          functionResult = await snoozeEmail(
            functionArgs.emailId,
            new Date(functionArgs.untilDate)
          );
          break;

        case 'remind_me':
          functionResult = await remindAboutEmail(
            functionArgs.emailId,
            new Date(functionArgs.when)
          );
          break;

        case 'detect_unanswered':
          functionResult = await detectUnansweredEmails(user.id);
          break;

        // ============ CONVERSATION TRACKING ============
        case 'get_conversation_history':
          functionResult = await getConversationHistory(
            user.id,
            functionArgs.personEmail,
            functionArgs.days || 90
          );
          break;

        case 'get_communication_frequency':
          functionResult = await getCommunicationFrequency(
            user.id,
            functionArgs.personEmail
          );
          break;

        case 'get_last_email_from':
          functionResult = await getLastEmailFrom(
            user.id,
            functionArgs.personEmail
          );
          break;

        case 'find_related_emails':
          functionResult = await findRelatedEmails(functionArgs.emailId);
          break;

        // ============ TEMPLATE FUNCTIONS ============
        case 'create_template':
          functionResult = await createEmailTemplate(
            user.id,
            functionArgs.name,
            functionArgs.content,
            functionArgs.subject,
            functionArgs.variables,
            functionArgs.category
          );
          break;

        case 'list_templates':
          functionResult = await listEmailTemplates(user.id);
          break;

        case 'use_template':
          functionResult = await useTemplate(
            functionArgs.templateId,
            functionArgs.variables
          );
          break;

        case 'suggest_template':
          functionResult = await suggestTemplateFor(
            user.id,
            functionArgs.context
          );
          break;

        // ============ BATCH OPERATIONS ============
        case 'suggest_cleanup':
          functionResult = await suggestBulkActions(user.id);
          break;

        case 'auto_archive_newsletters':
          functionResult = await autoArchiveOldNewsletters(
            user.id,
            functionArgs.olderThanDays || 30
          );
          break;

        case 'organize_by_project':
          functionResult = await organizeByProject(
            user.id,
            functionArgs.projectKeywords
          );
          break;

        case 'bulk_move_by_category':
          functionResult = await bulkMoveByCategory(
            user.id,
            functionArgs.category,
            functionArgs.targetFolder
          );
          break;

        // ============ PROACTIVE ALERTS ============
        case 'get_urgent_emails':
          functionResult = await getUrgentEmails(user.id);
          break;

        case 'check_vip_emails':
          functionResult = await checkForVIPEmails(
            user.id,
            functionArgs.vipList
          );
          break;

        case 'detect_deadline_emails':
          functionResult = await detectDeadlineEmails(user.id);
          break;

        case 'scan_for_action_required':
          functionResult = await scanForActionRequired(user.id);
          break;

        default:
          // For unimplemented actions
          functionResult = {
            message: `Function ${functionName} is defined but not yet implemented. Available functions: search, compose, move, archive, delete, mark_read, star, create_rule, undo, calendar operations, research, thread analysis, and more.`,
          };
      }

      // Generate response with function result
      const secondCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({
            role: m.role,
            content: m.content,
          })),
          responseMessage,
          {
            role: 'function',
            name: functionName,
            content: JSON.stringify(functionResult),
          },
        ],
      });

      const finalResponse = secondCompletion.choices[0].message.content;

      return NextResponse.json({
        role: 'assistant',
        content: finalResponse,
        functionResult,
        functionName: functionName, // Include function name for UI loading states
      });
    }

    // No function call, return direct response
    return NextResponse.json({
      role: 'assistant',
      content: responseMessage.content,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
