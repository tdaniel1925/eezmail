import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  bulkMoveEmailsBySender,
  createFolderAndMoveEmails,
  bulkArchiveEmails,
  bulkDeleteEmails,
  bulkMarkAsRead,
  bulkStarEmails,
} from '@/lib/chat/actions';
import { createEmailRule } from '@/lib/chat/rule-creator';

/**
 * Execute confirmed chatbot actions
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
    let result;
    let message = 'Action completed successfully!';

    // Execute the function based on name
    switch (name) {
      case 'move_emails_by_sender':
        result = await bulkMoveEmailsBySender(
          user.id,
          args.senderEmail,
          args.targetFolder,
          args.createFolder || false
        );
        message = `Moved ${result.movedCount} emails from ${args.senderEmail} to ${args.targetFolder}`;
        break;

      case 'create_folder_and_move':
        result = await createFolderAndMoveEmails(
          user.id,
          args.folderName,
          args.emailIds
        );
        message = `Created folder "${args.folderName}" and moved ${args.emailIds.length} emails`;
        break;

      case 'archive_emails':
        result = await bulkArchiveEmails(user.id, args.emailIds);
        message = `Archived ${args.emailIds.length} emails`;
        break;

      case 'delete_emails':
        result = await bulkDeleteEmails(user.id, args.emailIds);
        message = `Deleted ${args.emailIds.length} emails`;
        break;

      case 'mark_as_read':
        result = await bulkMarkAsRead(user.id, args.emailIds);
        message = `Marked ${args.emailIds.length} emails as read`;
        break;

      case 'star_emails':
        result = await bulkStarEmails(user.id, args.emailIds, args.starred);
        message = args.starred
          ? `Starred ${args.emailIds.length} emails`
          : `Unstarred ${args.emailIds.length} emails`;
        break;

      case 'create_email_rule':
        result = await createEmailRule(user.id, args);
        message = `Created email rule: "${args.name || 'New Rule'}"`;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown function: ${name}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      result,
    });
  } catch (error) {
    console.error('Error executing action:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
