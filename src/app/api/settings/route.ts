import { NextResponse } from 'next/server';
import { getUserSettingsData } from '@/lib/settings/data';

export async function GET() {
  try {
    console.log('[Settings API] Fetching user settings data...');
    const result = await getUserSettingsData();

    console.log('[Settings API] Result:', {
      success: result.success,
      hasData: !!result.data,
      error: result.error,
      dataKeys: result.data ? Object.keys(result.data) : [],
    });

    if (!result.success) {
      console.error('[Settings API] Failed:', result.error);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch settings',
          data: null,
        },
        { status: result.error === 'Not authenticated' ? 401 : 500 }
      );
    }

    // Ensure data structure is correct
    if (!result.data || !result.data.user) {
      console.error('[Settings API] Invalid data structure:', result.data);
      return NextResponse.json(
        { success: false, error: 'Invalid user data structure', data: null },
        { status: 500 }
      );
    }

    console.log('[Settings API] Returning success with data');
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Settings API] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}
