import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRevenueAttribution } from '@/lib/analytics/cohort-analysis';

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

    const revenue = await getRevenueAttribution();

    return NextResponse.json({ revenue });
  } catch (error) {
    console.error('Error fetching revenue attribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue attribution' },
      { status: 500 }
    );
  }
}
