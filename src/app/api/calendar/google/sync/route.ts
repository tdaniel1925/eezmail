import { NextResponse } from 'next/server';
import { syncFromGoogleCalendar } from '@/lib/calendar/google-calendar';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncFromGoogleCalendar();

    if (result.success) {
      return NextResponse.json({
        success: true,
        synced: result.synced,
        message: `Synced ${result.synced} events from Google Calendar`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in Google Calendar sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

