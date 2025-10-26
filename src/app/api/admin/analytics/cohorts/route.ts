import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCohortAnalysis } from '@/lib/analytics/cohort-analysis';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '12');

    const cohorts = await getCohortAnalysis(months);

    return NextResponse.json({ cohorts });
  } catch (error) {
    console.error('Error fetching cohort analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cohort analysis' },
      { status: 500 }
    );
  }
}
