import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getContactsList } from '@/lib/contacts/data';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contactsData = await getContactsList(user.id, {
      sortBy: 'name_asc',
      page: 1,
      perPage: 100,
    });

    return NextResponse.json({
      success: true,
      contacts: contactsData.contacts,
      total: contactsData.total,
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
