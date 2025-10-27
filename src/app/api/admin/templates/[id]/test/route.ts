import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendTestEmail } from '@/lib/notifications/template-service';
import { requireAdmin } from '@/lib/admin/auth';

const testEmailSchema = z.object({
  testEmail: z.string().email(),
  variables: z.record(z.string()),
});

// POST /api/admin/templates/[id]/test - Send test email
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const body = await req.json();
    const { testEmail, variables } = testEmailSchema.parse(body);

    const result = await sendTestEmail(params.id, testEmail, variables);

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Test email sent successfully'
        : 'Failed to send test email',
      error: result.error,
    });
  } catch (error) {
    console.error('❌ [Template API] Error sending test email:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}
