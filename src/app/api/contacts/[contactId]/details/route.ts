import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contacts, contactEmails, contactPhones, contactAddresses, contactSocialLinks } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/contacts/[contactId]/details
 * Fetch complete contact details including emails, phones, addresses, etc.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { contactId: string } }
): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = params.contactId;

    // Verify contact belongs to user
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });

    if (!contact || contact.userId !== user.id) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Fetch all related data in parallel
    const [emails, phones, addresses, socialLinks] = await Promise.all([
      db.query.contactEmails.findMany({
        where: eq(contactEmails.contactId, contactId),
      }),
      db.query.contactPhones.findMany({
        where: eq(contactPhones.contactId, contactId),
      }),
      db.query.contactAddresses.findMany({
        where: eq(contactAddresses.contactId, contactId),
      }),
      db.query.contactSocialLinks.findMany({
        where: eq(contactSocialLinks.contactId, contactId),
      }),
    ]);

    return NextResponse.json({
      emails: emails.map((e) => ({
        email: e.email,
        type: e.type,
        isPrimary: e.isPrimary,
      })),
      phones: phones.map((p) => ({
        phone: p.phone,
        type: p.type,
        isPrimary: p.isPrimary,
      })),
      addresses: addresses.map((a) => ({
        street: a.street,
        city: a.city,
        state: a.state,
        zipCode: a.zipCode,
        country: a.country,
        type: a.type,
      })),
      socialLinks: socialLinks.map((s) => ({
        platform: s.platform,
        url: s.url,
      })),
    });
  } catch (error) {
    console.error('Error fetching contact details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact details' },
      { status: 500 }
    );
  }
}

