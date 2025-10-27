import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { dataExportRequests } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      // Get all export requests
      const requests = await db
        .select()
        .from(dataExportRequests)
        .orderBy(desc(dataExportRequests.requestedAt));

      return NextResponse.json({ requests });
    } catch (dbError: any) {
      // If table doesn't exist, return empty array
      if (
        dbError.message?.includes('does not exist') ||
        dbError.code === '42P01'
      ) {
        console.log(
          '[Admin Privacy Export API] Table not found, returning empty array'
        );
        return NextResponse.json({ requests: [] });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('[Admin Privacy Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export requests' },
      { status: 500 }
    );
  }
}
