import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportUserData, createExportZip } from '@/lib/privacy/data-export';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
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

    const { userId } = await params;

    // Export user data
    const data = await exportUserData(userId);

    // Create ZIP file
    const zipData = await createExportZip(data);

    // Return ZIP file
    return new NextResponse(zipData, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="user-data-export-${userId}.zip"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or the user themselves
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin =
      userData?.role === 'super_admin' || userData?.role === 'admin';
    const isOwnData = user.id === (await params).userId;

    if (!isAdmin && !isOwnData) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;

    // TODO: Create export request in database
    // TODO: Queue background job to process export

    return NextResponse.json({
      success: true,
      message: 'Export request created',
      requestId: crypto.randomUUID(),
    });
  } catch (error) {
    console.error('Error creating export request:', error);
    return NextResponse.json(
      { error: 'Failed to create export request' },
      { status: 500 }
    );
  }
}
