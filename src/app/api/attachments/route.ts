import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAttachments, emails, emailAccounts } from '@/db/schema';
import { eq, inArray, desc, sql } from 'drizzle-orm';
import { isQualifiedAttachment } from '@/lib/attachments/filter';

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Get user's email accounts
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (accounts.length === 0) {
      return NextResponse.json({
        success: true,
        attachments: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    const accountIds = accounts.map((acc) => acc.id);

    // Get all emails for user's accounts
    const userEmails = await db.query.emails.findMany({
      where: inArray(emails.accountId, accountIds),
      columns: { id: true },
    });

    if (userEmails.length === 0) {
      return NextResponse.json({
        success: true,
        attachments: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }

    const emailIds = userEmails.map((e) => e.id);

    // Get all attachments with email info using a proper join
    const allAttachmentsRaw = await db
      .select({
        id: emailAttachments.id,
        emailId: emailAttachments.emailId,
        providerAttachmentId: emailAttachments.providerAttachmentId,
        contentId: emailAttachments.contentId,
        filename: emailAttachments.filename,
        contentType: emailAttachments.contentType,
        size: emailAttachments.size,
        storageUrl: emailAttachments.storageUrl,
        storageKey: emailAttachments.storageKey,
        isInline: emailAttachments.isInline,
        downloadCount: emailAttachments.downloadCount,
        lastDownloadedAt: emailAttachments.lastDownloadedAt,
        aiDescription: emailAttachments.aiDescription,
        aiDescriptionGeneratedAt: emailAttachments.aiDescriptionGeneratedAt,
        createdAt: emailAttachments.createdAt,
        emailFromAddress: emails.fromAddress,
        emailSubject: emails.subject,
      })
      .from(emailAttachments)
      .leftJoin(emails, eq(emailAttachments.emailId, emails.id))
      .where(inArray(emailAttachments.emailId, emailIds))
      .orderBy(desc(emailAttachments.createdAt));

    // Transform the data to include email relationship
    const allAttachments = allAttachmentsRaw.map((att) => ({
      id: att.id,
      emailId: att.emailId,
      providerAttachmentId: att.providerAttachmentId,
      contentId: att.contentId,
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
      storageUrl: att.storageUrl,
      storageKey: att.storageKey,
      isInline: att.isInline,
      downloadCount: att.downloadCount,
      lastDownloadedAt: att.lastDownloadedAt,
      aiDescription: att.aiDescription,
      aiDescriptionGeneratedAt: att.aiDescriptionGeneratedAt,
      createdAt: att.createdAt,
      email: {
        fromAddress: att.emailFromAddress,
        subject: att.emailSubject,
      },
    }));

    // Filter out non-qualified attachments (calendar invites, vcards, etc.)
    const qualifiedAttachments = allAttachments.filter((att) =>
      isQualifiedAttachment(att.contentType)
    );

    const total = qualifiedAttachments.length;
    const totalPages = Math.ceil(total / limit);

    // Paginate the filtered results
    const paginatedAttachments = qualifiedAttachments.slice(
      offset,
      offset + limit
    );

    return NextResponse.json({
      success: true,
      attachments: paginatedAttachments,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}
