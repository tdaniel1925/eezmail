import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSlowQueries } from '@/lib/debug/profiler';

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
    const threshold = parseInt(searchParams.get('threshold') || '1000'); // ms
    const limit = parseInt(searchParams.get('limit') || '50');

    const queries = await getSlowQueries(threshold, limit);

    return NextResponse.json({ queries });
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slow queries' },
      { status: 500 }
    );
  }
}
