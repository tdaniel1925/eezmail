import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, contacts, contactEmails } from '@/db/schema';
import { eq, or, and, isNotNull } from 'drizzle-orm';

export interface ContactDocument {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  emailSubject: string;
  emailDate: Date;
  emailId: string;
  downloadUrl?: string;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = params.contactId;

    // Get contact's email addresses
    const contactEmailAddresses = await db.query.contactEmails.findMany({
      where: eq(contactEmails.contactId, contactId),
    });

    if (contactEmailAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        documents: [],
      });
    }

    // Get emails from/to this contact that have attachments
    // Note: This assumes you have an 'attachments' or 'hasAttachments' field
    // Adjust based on your actual schema
    const emailAddresses = contactEmailAddresses.map((ce) => ce.email);

    const emailsWithAttachments = await db.query.emails.findMany({
      where: and(
        // Emails where from or to matches contact
        or(
          ...emailAddresses.flatMap((addr) => [
            eq(emails.fromAddress, { name: '', email: addr }),
            // Note: toAddresses is an array, you may need to adjust this query
          ])
        ),
        // Has attachments
        eq(emails.hasAttachments, true)
      ),
      limit: 50,
    });

    // Transform emails with attachments into document list
    // Note: You'll need to parse the attachments field based on your schema
    const documents: ContactDocument[] = [];

    for (const email of emailsWithAttachments) {
      // Parse attachments - adjust based on your actual schema
      // This assumes attachments is stored as JSONB array
      const attachments = (email.attachments as any[]) || [];

      for (const attachment of attachments) {
        documents.push({
          id: `${email.id}-${attachment.id || attachment.filename}`,
          fileName: attachment.filename || attachment.name || 'Unnamed',
          fileSize: attachment.size || 0,
          contentType:
            attachment.contentType ||
            attachment.mimeType ||
            'application/octet-stream',
          emailSubject: email.subject,
          emailDate: email.receivedAt || email.createdAt,
          emailId: email.id,
          downloadUrl: attachment.url || undefined,
        });
      }
    }

    // Sort by date (newest first)
    documents.sort((a, b) => b.emailDate.getTime() - a.emailDate.getTime());

    return NextResponse.json({
      success: true,
      documents,
    });
  } catch (error) {
    console.error('Error fetching contact documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
