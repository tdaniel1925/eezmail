import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAnalytics } from '@/lib/analytics/email-analytics';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get period from query params (7d, 30d, 90d)
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';

    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period as keyof typeof daysMap] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Generate analytics using existing service
    const analytics = await generateAnalytics(user.id, startDate, endDate);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}
