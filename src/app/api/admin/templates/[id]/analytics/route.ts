import { NextRequest, NextResponse } from 'next/server';
import { getTemplateAnalytics } from '@/lib/notifications/template-service';
import { requireAdmin } from '@/lib/admin/auth';

// GET /api/admin/templates/[id]/analytics - Get template analytics
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireAdmin();

    const analytics = await getTemplateAnalytics(params.id);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('❌ [Template API] Error fetching analytics:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch analytics',
      },
      { status: 500 }
    );
  }
}
