import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkCreateContacts } from '@/lib/contacts/bulk-actions';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const columnMappingsStr = formData.get('columnMappings') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Parse column mappings if provided
    let columnMappings: Record<string, string> | undefined;
    if (columnMappingsStr) {
      try {
        columnMappings = JSON.parse(columnMappingsStr);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid column mappings format' },
          { status: 400 }
        );
      }
    }

    // Validate file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV or Excel file.' },
        { status: 400 }
      );
    }

    // Process the file
    const result = await bulkCreateContacts(user.id, file, columnMappings);

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in bulk upload:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process bulk upload',
      },
      { status: 500 }
    );
  }
}
