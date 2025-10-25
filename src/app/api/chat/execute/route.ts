import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import {
  searchEmailsHandler,
  sendEmailHandler,
  replyToEmailHandler,
  moveEmailsHandler,
  deleteEmailsHandler,
  archiveEmailsHandler,
  starEmailsHandler,
  markReadUnreadHandler,
} from '@/lib/chat/function-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Validation schema for function execution request
const executeSchema = z.object({
  functionName: z.string(),
  arguments: z.record(z.any()),
});

/**
 * Chat Function Execution API
 * Executes the function calls requested by the AI chatbot
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
    const { functionName, arguments: args } = executeSchema.parse(body);

    console.log(`⚡ [Execute] Function: ${functionName}`, args);

    // Route to appropriate handler
    let result;
    switch (functionName) {
      // Email Operations
      case 'search_emails':
        result = await searchEmailsHandler(user.id, args);
        break;
      case 'send_email':
        result = await sendEmailHandler(user.id, args);
        break;
      case 'reply_to_email':
        result = await replyToEmailHandler(user.id, args);
        break;
      case 'move_emails':
        result = await moveEmailsHandler(user.id, args);
        break;
      case 'delete_emails':
        result = await deleteEmailsHandler(user.id, args);
        break;
      case 'archive_emails':
        result = await archiveEmailsHandler(user.id, args);
        break;
      case 'star_emails':
        result = await starEmailsHandler(user.id, args);
        break;
      case 'mark_read_unread':
        result = await markReadUnreadHandler(user.id, args);
        break;

      // Add more handlers as needed...

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Function "${functionName}" not yet implemented`,
            message: `The "${functionName}" function is planned but hasn't been implemented yet. Please use the UI to perform this action.`,
          },
          { status: 501 }
        );
    }

    console.log(`✅ [Execute] Result:`, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ [Execute Error]:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to execute function' },
      { status: 500 }
    );
  }
}
