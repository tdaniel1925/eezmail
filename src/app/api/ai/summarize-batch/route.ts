import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Clean email body by removing signatures, inline images, and metadata
 */
function cleanEmailBody(body: string): string {
  if (!body) return '';

  let cleaned = body;

  // Remove HTML tags if present
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Remove common signature patterns
  const signaturePatterns = [
    /^--\s*$/gm,
    /_{3,}/g,
    /={3,}/g,
    /-{3,}/g,
    /\n\s*Best regards,?\s*\n[\s\S]*$/i,
    /\n\s*Regards,?\s*\n[\s\S]*$/i,
    /\n\s*Sincerely,?\s*\n[\s\S]*$/i,
    /\n\s*Thanks,?\s*\n[\s\S]*$/i,
    /\n\s*Thank you,?\s*\n[\s\S]*$/i,
    /\n\s*Cheers,?\s*\n[\s\S]*$/i,
    /\n\s*Best,?\s*\n[\s\S]*$/i,
    /\n\s*Sent from my .*/i,
  ];

  for (const pattern of signaturePatterns) {
    cleaned = cleaned.replace(pattern, '\n');
  }

  // Remove inline image references
  cleaned = cleaned.replace(/\[image:.*?\]/gi, '');
  cleaned = cleaned.replace(/\[cid:.*?\]/gi, '');
  cleaned = cleaned.replace(/data:image\/[^;]+;base64,[^\s]+/g, '');

  // Remove email metadata patterns
  cleaned = cleaned.replace(/^From:.*$/gm, '');
  cleaned = cleaned.replace(/^To:.*$/gm, '');
  cleaned = cleaned.replace(/^Subject:.*$/gm, '');
  cleaned = cleaned.replace(/^Date:.*$/gm, '');
  cleaned = cleaned.replace(/^Cc:.*$/gm, '');
  cleaned = cleaned.replace(/^Bcc:.*$/gm, '');

  // Remove quoted/forwarded email sections
  cleaned = cleaned.replace(/^>+.*$/gm, '');
  cleaned = cleaned.replace(/^On .* wrote:[\s\S]*$/gm, '');
  cleaned = cleaned.replace(/^-+ Forwarded message -+[\s\S]*$/gm, '');
  cleaned = cleaned.replace(/^-+ Original message -+[\s\S]*$/gm, '');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Summarize multiple emails in parallel (batch processing)
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { emailIds } = body;

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json(
        { error: 'Email IDs array is required' },
        { status: 400 }
      );
    }

    // Limit to 10 emails per batch for performance
    const limitedEmailIds = emailIds.slice(0, 10);

    // Get all emails from database
    const emailRecords = await db.query.emails.findMany({
      where: inArray(emails.id, limitedEmailIds),
    });

    if (emailRecords.length === 0) {
      return NextResponse.json({ error: 'No emails found' }, { status: 404 });
    }

    // Filter emails that need summarization
    const emailsToSummarize = emailRecords.filter((email) => {
      // Skip if already has summary
      if (email.summary) return false;

      const rawBody = email.bodyText || email.bodyHtml || '';
      // Skip if too short
      if (rawBody.length < 50) return false;

      return true;
    });

    // Process all summaries in parallel
    const summaryPromises = emailsToSummarize.map(async (email) => {
      try {
        const rawEmailBody = email.bodyText || email.bodyHtml || '';
        const emailSubject = email.subject;
        const emailBody = cleanEmailBody(rawEmailBody);

        if (!emailBody || emailBody.length < 50) {
          // Return subject as fallback
          return {
            emailId: email.id,
            summary: emailSubject || 'No content',
            cached: false,
          };
        }

        // Call OpenAI
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Summarize in 1 sentence. Be concise.`,
            },
            {
              role: 'user',
              content: `Subject: ${emailSubject}\n\n${emailBody.substring(0, 800)}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 60,
          top_p: 0.8,
        });

        const summary =
          response.choices[0]?.message?.content?.trim() ||
          emailSubject ||
          'Unable to summarize';

        // Cache in database (async, don't wait)
        db.update(emails)
          .set({
            summary: summary,
            updatedAt: new Date(),
          } as any)
          .where(eq(emails.id, email.id))
          .catch((err) =>
            console.error(`Failed to cache summary for ${email.id}:`, err)
          );

        return {
          emailId: email.id,
          summary: summary,
          cached: false,
        };
      } catch (error) {
        console.error(`Failed to summarize email ${email.id}:`, error);
        return {
          emailId: email.id,
          summary: email.subject || 'Summarization failed',
          cached: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Wait for all summaries to complete
    const results = await Promise.all(summaryPromises);

    // Add cached summaries for emails that already had them
    const cachedSummaries = emailRecords
      .filter(
        (email) =>
          email.summary && !emailsToSummarize.find((e) => e.id === email.id)
      )
      .map((email) => ({
        emailId: email.id,
        summary: email.summary!,
        cached: true,
      }));

    return NextResponse.json({
      success: true,
      summaries: [...results, ...cachedSummaries],
      totalProcessed: results.length,
      totalCached: cachedSummaries.length,
    });
  } catch (error) {
    console.error('Error in batch summarize API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
