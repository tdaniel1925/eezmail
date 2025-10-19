import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contacts, contactEmails } from '@/db/schema';
import { eq, or, ilike, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    // Search contacts by name or email
    const results = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        company: contacts.company,
        email: contactEmails.email,
        avatarUrl: contacts.avatarUrl,
      })
      .from(contacts)
      .leftJoin(contactEmails, eq(contactEmails.contactId, contacts.id))
      .where(
        and(
          eq(contacts.userId, user.id),
          or(
            ilike(contacts.firstName, `%${query}%`),
            ilike(contacts.lastName, `%${query}%`),
            ilike(contacts.company, `%${query}%`),
            ilike(contactEmails.email, `%${query}%`)
          )
        )
      )
      .limit(10);

    return NextResponse.json({
      success: true,
      contacts: results,
    });
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to search contacts' },
      { status: 500 }
    );
  }
}

