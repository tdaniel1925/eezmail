import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSyncJobs } from '@/lib/debug/sync-tracer';

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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { jobs, total } = await getSyncJobs({
      status: status === 'all' ? undefined : status || undefined,
      limit,
      offset,
    });

    // Filter by search if provided
    let filteredJobs = jobs;
    if (search) {
      filteredJobs = jobs.filter((job) =>
        job.accountEmail.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      jobs: filteredJobs,
      total: search ? filteredJobs.length : total,
    });
  } catch (error) {
    console.error('Error fetching sync jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync jobs' },
      { status: 500 }
    );
  }
}
