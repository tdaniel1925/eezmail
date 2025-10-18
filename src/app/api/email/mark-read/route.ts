import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for mark read request
const markReadSchema = z.object({
  emailIds: z.array(z.string()).min(1, 'At least one email ID is required'),
  read: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = markReadSchema.parse(body);

    // Update email read status
    const updatePromises = validatedData.emailIds.map(async (emailId) => {
      return db
        .update(emails)
        .set({
          isRead: validatedData.read,
          updatedAt: new Date(),
        })
        .where(and(eq(emails.id, emailId), eq(emails.userId, user.id)));
    });

    await Promise.all(updatePromises);

    // TODO: Also update via provider (Nylas/Gmail/Microsoft) if needed
    console.log('Marked emails as read:', {
      emailIds: validatedData.emailIds,
      read: validatedData.read,
    });

    return NextResponse.json({
      success: true,
      message: `Emails marked as ${validatedData.read ? 'read' : 'unread'}`,
      count: validatedData.emailIds.length,
    });
  } catch (error) {
    console.error('Error marking emails as read:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to mark emails as read' },
      { status: 500 }
    );
  }
}
