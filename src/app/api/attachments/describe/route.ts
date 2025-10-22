import { NextResponse } from 'next/server';
import { generateAttachmentDescription } from '@/lib/attachments/actions';

/**
 * POST /api/attachments/describe
 * Generate AI description for an attachment
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { attachmentId } = body;

    if (!attachmentId) {
      return NextResponse.json(
        { success: false, error: 'Missing attachmentId' },
        { status: 400 }
      );
    }

    const result = await generateAttachmentDescription(attachmentId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      description: result.description,
    });
  } catch (error) {
    console.error('Error in describe API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}

