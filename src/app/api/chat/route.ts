import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { omniscientSearch, getUserContext } from '@/lib/rag/omniscient-search';
import { inferSearchScope } from '@/lib/rag/search-utils';
import {
  addToConversationHistory,
  storeSearchResults,
} from '@/lib/chat/context-manager';
import { extractEntities } from '@/lib/chat/context-utils';
import { parseAndResolveReferences } from '@/lib/chat/reference-resolver';
import { containsReferences } from '@/lib/chat/reference-utils';
import {
  parseCommand as parseNLU,
  isMultiStepCommand,
  validateDependencies,
  estimateExecutionTime,
} from '@/lib/chat/command-parser';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validation schema for chat request
const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system', 'function']),
      content: z.string(),
      name: z.string().optional(),
    })
  ),
  context: z
    .object({
      currentEmail: z.any().optional(),
      currentFolder: z.string().optional(),
      selectedEmails: z.array(z.any()).optional(),
    })
    .optional(),
});

/**
 * AI Chat API with Comprehensive Function Calling
 * The brain of the omniscient chatbot
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = chatSchema.parse(body);

    // Get the user's last message
    const lastUserMessage =
      validatedData.messages.length > 0
        ? validatedData.messages[validatedData.messages.length - 1].content
        : '';

    console.log(`🤖 [Chat API] User message: "${lastUserMessage}"`);

    // Check for multi-step commands first
    if (isMultiStepCommand(lastUserMessage)) {
      console.log(`🔄 [Chat API] Detected multi-step command, parsing...`);
      const parsedIntent = await parseNLU(lastUserMessage, user.id);

      if (parsedIntent.isMultiStep) {
        // Validate dependencies
        const validation = validateDependencies(parsedIntent);
        if (!validation.valid) {
          return NextResponse.json({
            success: false,
            response: `Multi-step command has errors: ${validation.errors.join(', ')}`,
            timestamp: new Date().toISOString(),
          });
        }

        // Return multi-step execution plan for confirmation
        const estimatedTime = estimateExecutionTime(parsedIntent);
        return NextResponse.json({
          success: true,
          response: `I'll execute this ${parsedIntent.complexity} command in ${parsedIntent.estimatedSteps} steps (estimated ${estimatedTime}s). Proceed?`,
          multiStepCommand: parsedIntent,
          requiresConfirmation: true,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check if message contains references that need resolution
    if (containsReferences(lastUserMessage)) {
      console.log(`🔗 [Chat API] Message contains references, resolving...`);
      const resolved = await parseAndResolveReferences(
        user.id,
        lastUserMessage
      );

      if (resolved.needsClarification) {
        // Return clarification prompt
        return NextResponse.json({
          success: true,
          response: resolved.clarificationPrompt,
          needsClarification: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Update the last message with resolved references
      if (validatedData.messages.length > 0) {
        validatedData.messages[validatedData.messages.length - 1].content =
          resolved.resolvedMessage;
        console.log(
          `✅ [Chat API] Resolved message: "${resolved.resolvedMessage}"`
        );
      }
    }

    // Get comprehensive user context
    const userContext = await getUserContext(user.id);

    // Build enhanced system prompt
    const systemPrompt = buildSystemPrompt(
      user.id,
      userContext,
      validatedData.context
    );

    // Prepare messages with system prompt
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...validatedData.messages.map((m) => ({
        role: m.role as any,
        content: m.content,
      })),
    ];

    console.log(`🤖 [Chat API] Processing request for user: ${user.id}`);

    // Call OpenAI with function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      tools: getFunctionTools(),
      tool_choice: 'auto',
      max_tokens: 1500,
      temperature: 0.7,
    });

    const choice = completion.choices[0];
    const message = choice.message;

    // Check if AI wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      console.log(`📞 [Function Call] ${functionName}:`, functionArgs);

      // Check if function requires confirmation
      const requiresConfirmation = isDestructiveAction(
        functionName,
        functionArgs
      );

      return NextResponse.json({
        success: true,
        response:
          message.content || `I want to ${functionName}. Should I proceed?`,
        functionCall: {
          name: functionName,
          arguments: functionArgs,
        },
        requiresConfirmation,
        timestamp: new Date().toISOString(),
      });
    }

    // Regular text response
    return NextResponse.json({
      success: true,
      response:
        message.content || 'I apologize, but I could not generate a response.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Chat API Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

/**
 * Build comprehensive system prompt with capabilities
 */
function buildSystemPrompt(
  userId: string,
  userContext: string,
  requestContext: any
): string {
  let prompt = `You are an omniscient AI assistant for an email management application. You have COMPLETE knowledge of the user's:
- Emails (all folders, threads, attachments)
- Contacts (names, companies, communication history)
- Calendar events (past and future)
- Tasks (incomplete and completed)
- Settings, rules, signatures, and folders

## YOUR CAPABILITIES

You can perform ANY of these actions via function calling:

**Email Operations:**
- search_emails: Find emails with advanced filters
- send_email: Compose and send new emails
- reply_to_email: Reply to specific emails
- forward_email: Forward emails
- move_emails: Move emails to folders
- delete_emails: Delete emails (requires confirmation)
- archive_emails: Archive emails
- star_emails: Star/unstar emails
- mark_read_unread: Toggle read status
- snooze_email: Add to reply later
- get_email_details: Get full email content
- summarize_email: Generate AI summary

**Contact Operations:**
- search_contacts: Find contacts
- create_contact: Add new contact
- update_contact: Edit contact details
- delete_contact: Remove contact (requires confirmation)
- get_contact_details: Get full contact info
- get_contact_timeline: See communication history
- send_sms: Send SMS via Twilio
- add_contact_note: Add note to contact
- tag_contact: Add/remove tags

**Calendar Operations:**
- search_calendar: Find events
- create_event: New calendar event
- update_event: Edit event
- delete_event: Remove event (requires confirmation)
- reschedule_event: Change event time
- add_attendee: Add attendee to event
- set_reminder: Set event reminder

**Task Operations:**
- search_tasks: Find tasks
- create_task: New task
- update_task: Edit task
- complete_task: Mark task done
- delete_task: Remove task (requires confirmation)

**Organization:**
- create_folder: New email folder
- rename_folder: Rename folder
- delete_folder: Remove folder (requires confirmation)
- create_rule: Create email rule from natural language
- list_rules: Show all rules
- toggle_rule: Enable/disable rule
- create_signature: New email signature
- list_signatures: Show all signatures

**Settings & Analysis:**
- update_settings: Change user settings
- get_user_stats: Show analytics
- find_pattern: Detect patterns in emails/behavior
- get_thread_summary: Summarize email thread

**Meta:**
- request_confirmation: Ask for confirmation
- undo_action: Undo last action
- get_context: Understand current view

## IMPORTANT RULES

1. **ALWAYS use functions** when the user asks you to DO something (not just answer)
2. **ALWAYS confirm** before destructive actions (delete, bulk operations)
3. **Be conversational** - talk naturally, not like a robot
4. **Be proactive** - suggest helpful actions
5. **Use context** - reference what the user is currently viewing
6. **Handle references** - understand "it", "him", "that email", etc.

## CURRENT CONTEXT

${userContext}

${requestContext?.currentEmail ? `\nCurrently viewing email: ${requestContext.currentEmail.subject}\n` : ''}
${requestContext?.currentFolder ? `Currently in folder: ${requestContext.currentFolder}\n` : ''}
${requestContext?.selectedEmails?.length > 0 ? `Selected ${requestContext.selectedEmails.length} emails\n` : ''}

## RESPONSE STYLE

- Be helpful and friendly
- Use the user's communication style (casual/professional)
- Provide actionable suggestions
- Confirm understanding before acting
- Explain what you're about to do

Now assist the user with their request.`;

  return prompt;
}

/**
 * Check if action requires confirmation
 */
function isDestructiveAction(functionName: string, args: any): boolean {
  const destructiveActions = [
    'delete_emails',
    'delete_contact',
    'delete_event',
    'delete_task',
    'delete_folder',
  ];

  if (destructiveActions.includes(functionName)) {
    return true;
  }

  // Bulk operations (>5 items)
  if (
    (functionName === 'move_emails' ||
      functionName === 'archive_emails' ||
      functionName === 'star_emails') &&
    args.emailIds &&
    args.emailIds.length > 5
  ) {
    return true;
  }

  return false;
}

/**
 * Get all function tool definitions for OpenAI
 * This is where we define the 40+ capabilities
 */
function getFunctionTools(): OpenAI.Chat.ChatCompletionTool[] {
  return [
    // ==== EMAIL OPERATIONS ====
    {
      type: 'function',
      function: {
        name: 'search_emails',
        description:
          'Search for emails using semantic search. Supports filters like from, to, date range, has attachments, etc. When searching by sender, use the "from" parameter with partial matches (e.g., "stripe" instead of guessing the email address).',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query to match in subject or body' },
            from: { type: 'string', description: 'Filter by sender name or email (partial match). Use "stripe" instead of "noreply@stripe.com"' },
            to: { type: 'string', description: 'Filter by recipient email' },
            dateFrom: {
              type: 'string',
              description: 'Start date (ISO string)',
            },
            dateTo: { type: 'string', description: 'End date (ISO string)' },
            hasAttachments: {
              type: 'boolean',
              description: 'Only emails with attachments',
            },
            isUnread: { type: 'boolean', description: 'Only unread emails' },
            folder: { type: 'string', description: 'Specific folder name' },
            limit: { type: 'number', description: 'Max results', default: 10 },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_email',
        description: 'Compose and send a new email',
        parameters: {
          type: 'object',
          properties: {
            to: { type: 'string', description: 'Recipient email address' },
            subject: { type: 'string', description: 'Email subject' },
            body: { type: 'string', description: 'Email body (HTML or text)' },
            cc: {
              type: 'string',
              description: 'CC email addresses (comma-separated)',
            },
            bcc: {
              type: 'string',
              description: 'BCC email addresses (comma-separated)',
            },
          },
          required: ['to', 'subject', 'body'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reply_to_email',
        description: 'Reply to a specific email',
        parameters: {
          type: 'object',
          properties: {
            emailId: { type: 'string', description: 'ID of email to reply to' },
            body: { type: 'string', description: 'Reply body' },
            replyAll: {
              type: 'boolean',
              description: 'Reply to all recipients',
              default: false,
            },
          },
          required: ['emailId', 'body'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'move_emails',
        description: 'Move emails to a folder',
        parameters: {
          type: 'object',
          properties: {
            emailIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of email IDs',
            },
            folder: { type: 'string', description: 'Target folder name' },
          },
          required: ['emailIds', 'folder'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_emails',
        description: 'Delete emails (soft delete to trash)',
        parameters: {
          type: 'object',
          properties: {
            emailIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of email IDs to delete',
            },
          },
          required: ['emailIds'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'archive_emails',
        description: 'Archive emails',
        parameters: {
          type: 'object',
          properties: {
            emailIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of email IDs to archive',
            },
          },
          required: ['emailIds'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'star_emails',
        description: 'Star or unstar emails',
        parameters: {
          type: 'object',
          properties: {
            emailIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of email IDs',
            },
            star: {
              type: 'boolean',
              description: 'true to star, false to unstar',
            },
          },
          required: ['emailIds', 'star'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'mark_read_unread',
        description: 'Mark emails as read or unread',
        parameters: {
          type: 'object',
          properties: {
            emailIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of email IDs',
            },
            read: {
              type: 'boolean',
              description: 'true for read, false for unread',
            },
          },
          required: ['emailIds', 'read'],
        },
      },
    },

    // ==== CONTACT OPERATIONS ====
    {
      type: 'function',
      function: {
        name: 'search_contacts',
        description:
          'Search for contacts by name, email, company, or other fields',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            limit: { type: 'number', description: 'Max results', default: 10 },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_contact',
        description: 'Create a new contact',
        parameters: {
          type: 'object',
          properties: {
            firstName: { type: 'string', description: 'First name' },
            lastName: { type: 'string', description: 'Last name' },
            email: { type: 'string', description: 'Email address' },
            phone: { type: 'string', description: 'Phone number' },
            company: { type: 'string', description: 'Company name' },
            jobTitle: { type: 'string', description: 'Job title' },
            notes: { type: 'string', description: 'Additional notes' },
          },
          required: ['email'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_contact_details',
        description:
          'Get full details of a contact including communication history',
        parameters: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
          },
          required: ['contactId'],
        },
      },
    },

    // ==== CALENDAR OPERATIONS ====
    {
      type: 'function',
      function: {
        name: 'search_calendar',
        description: 'Search for calendar events',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            startDate: {
              type: 'string',
              description: 'Start date (ISO string)',
            },
            endDate: { type: 'string', description: 'End date (ISO string)' },
            limit: { type: 'number', description: 'Max results', default: 10 },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_event',
        description: 'Create a new calendar event',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Event title' },
            startTime: {
              type: 'string',
              description: 'Start time (ISO string)',
            },
            endTime: { type: 'string', description: 'End time (ISO string)' },
            location: { type: 'string', description: 'Event location' },
            description: { type: 'string', description: 'Event description' },
            attendees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Attendee email addresses',
            },
          },
          required: ['title', 'startTime'],
        },
      },
    },

    // ==== TASK OPERATIONS ====
    {
      type: 'function',
      function: {
        name: 'search_tasks',
        description: 'Search for tasks',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' },
            includeCompleted: {
              type: 'boolean',
              description: 'Include completed tasks',
              default: false,
            },
            limit: { type: 'number', description: 'Max results', default: 10 },
          },
          required: ['query'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_task',
        description: 'Create a new task',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' },
            dueDate: { type: 'string', description: 'Due date (ISO string)' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority',
            },
          },
          required: ['title'],
        },
      },
    },

    // ==== ORGANIZATION ====
    {
      type: 'function',
      function: {
        name: 'create_folder',
        description: 'Create a new email folder',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Folder name' },
            description: { type: 'string', description: 'Folder description' },
          },
          required: ['name'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_rule',
        description: 'Create an email rule from natural language description',
        parameters: {
          type: 'object',
          properties: {
            description: {
              type: 'string',
              description:
                'Natural language rule description (e.g., "move all newsletters to Reading folder")',
            },
          },
          required: ['description'],
        },
      },
    },

    // ==== META FUNCTIONS ====
    {
      type: 'function',
      function: {
        name: 'request_confirmation',
        description: 'Request user confirmation before performing an action',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'Action to confirm' },
            details: { type: 'string', description: 'Action details' },
          },
          required: ['action', 'details'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'undo_action',
        description: 'Undo the last action performed',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },

    // ==== ADDITIONAL 20 TOOLS ====
    {
      type: 'function',
      function: {
        name: 'forward_email',
        description: 'Forward an email to someone',
        parameters: {
          type: 'object',
          properties: {
            emailId: { type: 'string', description: 'Email ID to forward' },
            to: { type: 'string', description: 'Recipient email address' },
            note: {
              type: 'string',
              description: 'Optional note to include',
            },
          },
          required: ['emailId', 'to'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_contact',
        description: 'Update contact details',
        parameters: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
            displayName: { type: 'string', description: 'Display name' },
            email: { type: 'string', description: 'Email address' },
            phone: { type: 'string', description: 'Phone number' },
            company: { type: 'string', description: 'Company name' },
            notes: { type: 'string', description: 'Notes' },
          },
          required: ['contactId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_contact',
        description: 'Delete a contact (requires confirmation)',
        parameters: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID to delete' },
          },
          required: ['contactId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_contact_timeline',
        description: 'Get communication history with a contact',
        parameters: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
            limit: { type: 'number', description: 'Max events', default: 20 },
          },
          required: ['contactId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'send_sms_to_contact',
        description: 'Send SMS to a contact via Twilio',
        parameters: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
            message: { type: 'string', description: 'SMS message' },
          },
          required: ['contactId', 'message'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'add_contact_note',
        description: 'Add a note to a contact',
        parameters: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
            note: { type: 'string', description: 'Note text' },
          },
          required: ['contactId', 'note'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'tag_contact',
        description: 'Add or remove tags from a contact',
        parameters: {
          type: 'object',
          properties: {
            contactId: { type: 'string', description: 'Contact ID' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags to add/remove',
            },
            action: {
              type: 'string',
              enum: ['add', 'remove'],
              description: 'Add or remove tags',
            },
          },
          required: ['contactId', 'tags', 'action'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'reschedule_event',
        description: 'Change event time',
        parameters: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'Event ID' },
            newStartTime: {
              type: 'string',
              description: 'New start time (ISO string)',
            },
            newEndTime: {
              type: 'string',
              description: 'New end time (ISO string)',
            },
          },
          required: ['eventId', 'newStartTime'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'add_attendee',
        description: 'Add attendee to calendar event',
        parameters: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'Event ID' },
            attendeeEmail: { type: 'string', description: 'Attendee email' },
            attendeeName: {
              type: 'string',
              description: 'Attendee name (optional)',
            },
          },
          required: ['eventId', 'attendeeEmail'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'set_reminder',
        description: 'Set reminder for calendar event',
        parameters: {
          type: 'object',
          properties: {
            eventId: { type: 'string', description: 'Event ID' },
            minutesBefore: {
              type: 'number',
              description: 'Minutes before event',
            },
            method: {
              type: 'string',
              enum: ['email', 'notification'],
              description: 'Reminder method',
            },
          },
          required: ['eventId', 'minutesBefore'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'complete_task',
        description: 'Mark task as completed',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID' },
          },
          required: ['taskId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_task',
        description: 'Update task details',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID' },
            title: { type: 'string', description: 'Task title' },
            description: { type: 'string', description: 'Task description' },
            dueDate: { type: 'string', description: 'Due date (ISO string)' },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: 'Task priority',
            },
          },
          required: ['taskId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'delete_task',
        description: 'Delete a task (requires confirmation)',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: 'Task ID to delete' },
          },
          required: ['taskId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_rules',
        description: 'Show all email rules',
        parameters: {
          type: 'object',
          properties: {
            includeDisabled: {
              type: 'boolean',
              description: 'Include disabled rules',
              default: false,
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'toggle_rule',
        description: 'Enable or disable an email rule',
        parameters: {
          type: 'object',
          properties: {
            ruleId: { type: 'string', description: 'Rule ID' },
            enabled: { type: 'boolean', description: 'Enable or disable' },
          },
          required: ['ruleId', 'enabled'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'update_settings',
        description: 'Update user settings',
        parameters: {
          type: 'object',
          properties: {
            settingKey: { type: 'string', description: 'Setting key' },
            settingValue: { type: 'string', description: 'Setting value' },
          },
          required: ['settingKey', 'settingValue'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_user_stats',
        description: 'Get user analytics and statistics',
        parameters: {
          type: 'object',
          properties: {
            timeRange: {
              type: 'string',
              enum: ['day', 'week', 'month', 'year', 'all'],
              description: 'Time range for stats',
              default: 'month',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_pattern',
        description: 'Detect patterns in emails or user behavior',
        parameters: {
          type: 'object',
          properties: {
            patternType: {
              type: 'string',
              enum: [
                'email_frequency',
                'response_time',
                'common_senders',
                'topics',
              ],
              description: 'Type of pattern to find',
            },
            timeRange: {
              type: 'string',
              description: 'Time range to analyze',
              default: '30days',
            },
          },
          required: ['patternType'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_proactive_suggestions',
        description: 'Get AI-generated proactive suggestions',
        parameters: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Max suggestions',
              default: 5,
            },
            actionableOnly: {
              type: 'boolean',
              description: 'Only actionable suggestions',
              default: true,
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'snooze_email',
        description: 'Add email to reply later list',
        parameters: {
          type: 'object',
          properties: {
            emailId: { type: 'string', description: 'Email ID' },
            until: {
              type: 'string',
              description: 'Snooze until (ISO string)',
            },
          },
          required: ['emailId'],
        },
      },
    },
  ];
}
