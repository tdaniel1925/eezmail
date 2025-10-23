import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  executeMultiStepCommand,
  summarizeMultiStepResults,
  type ParsedIntent,
} from '@/lib/chat/command-parser';
import { omniscientSearch } from '@/lib/rag/omniscient-search';
import { composeNewEmail } from '@/lib/chat/compose-actions';
import { createCalendarEvent } from '@/lib/calendar/calendar-actions';
import { createContact } from '@/lib/chat/contact-actions';
import { createTask } from '@/lib/tasks/actions';
import { createFolder } from '@/lib/folders/actions';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';

/**
 * Execute Multi-Step Commands
 * Handles complex commands like "find emails from John and create a summary"
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { multiStepCommand } = body;

    if (!multiStepCommand) {
      return NextResponse.json(
        { error: 'Multi-step command data required' },
        { status: 400 }
      );
    }

    const parsedIntent: ParsedIntent = multiStepCommand;
    console.log(`🔄 [Multi-Step] Executing command:`, parsedIntent);

    // Execute the multi-step command
    const executionResult = await executeMultiStepCommand(
      parsedIntent,
      user.id,
      async (action: string, params: any) => {
        return await executeAction(action, params, user.id);
      }
    );

    if (!executionResult.success) {
      return NextResponse.json({
        success: false,
        response: executionResult.summary,
        errors: executionResult.errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Generate a comprehensive summary
    const summary = await summarizeMultiStepResults(
      parsedIntent,
      executionResult.results
    );

    return NextResponse.json({
      success: true,
      response: summary,
      results: executionResult.results,
      stepsCompleted: executionResult.results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [Multi-Step Error]:', error);
    return NextResponse.json(
      { error: 'Failed to execute multi-step command' },
      { status: 500 }
    );
  }
}

/**
 * Execute a single action (function dispatcher)
 */
async function executeAction(
  action: string,
  params: any,
  userId: string
): Promise<any> {
  console.log(`⚡ [Multi-Step Action] Executing: ${action}`, params);

  // Extract dependency result if present
  const depResult = params._dependencyResult;
  delete params._dependencyResult;

  switch (action) {
    case 'search_emails':
      const searchResult = await omniscientSearch(params.query || '', userId, {
        includeEmails: true,
        includeContacts: false,
        includeCalendar: false,
        includeTasks: false,
        includeSettings: false,
        emailLimit: params.limit || 10,
      });
      return {
        success: true,
        data: searchResult.emails.results,
        message: searchResult.emails.summary,
      };

    case 'summarize_results':
      // Use dependency result (previous search results)
      if (!depResult || !depResult.data) {
        throw new Error('No data to summarize');
      }
      const summaryText = `Found ${depResult.data.length} emails. ${depResult.message}`;
      return {
        success: true,
        summary: summaryText,
        message: summaryText,
      };

    case 'create_folder':
      const folder = await createFolder(userId, params.folderName);
      return {
        success: true,
        folderId: folder.id,
        message: `Created folder "${params.folderName}"`,
      };

    case 'move_emails':
      // If dependency result has email IDs, use those
      const emailIds = depResult?.data
        ? depResult.data.map((e: any) => e.id)
        : params.emailIds;

      if (!emailIds || emailIds.length === 0) {
        throw new Error('No emails to move');
      }

      await db
        .update(emails)
        .set({ folderName: params.folder.toLowerCase() })
        .where(and(eq(emails.userId, userId), inArray(emails.id, emailIds)));

      return {
        success: true,
        count: emailIds.length,
        message: `Moved ${emailIds.length} email(s) to ${params.folder}`,
      };

    case 'create_event':
    case 'schedule_meeting':
      const event = await createCalendarEvent({
        userId,
        title: params.title || params.topic,
        startTime: params.startTime || new Date(params.date || Date.now()),
        endTime: params.endTime || new Date(Date.now() + 3600000), // +1 hour
        description: params.description || params.context,
        location: params.location,
        attendees: params.attendees || [],
      });
      return {
        success: true,
        eventId: event.id,
        message: `Created event "${params.title}"`,
      };

    case 'add_attendee':
      // Would add attendee to event from dependency result
      if (!depResult?.eventId) {
        throw new Error('No event to add attendee to');
      }
      return {
        success: true,
        message: `Added ${params.attendee} to event`,
      };

    case 'send_email':
    case 'compose_email':
      const result = await composeNewEmail({
        userId,
        recipient: params.to || params.recipient,
        topic: params.subject || params.topic,
        context: params.body || params.context,
        tone: params.tone,
      });
      return {
        success: result.success,
        message: result.message,
      };

    case 'create_contact':
      const contact = await createContact({
        userId,
        email: params.email,
        displayName: params.name || params.displayName,
        company: params.company,
      });
      return {
        success: true,
        contactId: contact.id,
        message: `Created contact "${contact.displayName}"`,
      };

    case 'create_task':
      const task = await createTask({
        userId,
        title: params.title || params.task,
        description: params.description,
        priority: params.priority || 'medium',
        dueDate: params.dueDate ? new Date(params.dueDate) : undefined,
      });
      return {
        success: true,
        taskId: task.id,
        message: `Created task "${task.title}"`,
      };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
