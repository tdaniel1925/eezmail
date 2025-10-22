import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    /^--\s*$/gm, // Standard -- separator
    /_{3,}/g, // Multiple underscores
    /={3,}/g, // Multiple equals
    /-{3,}/g, // Multiple dashes (but not standard --)
    /\n\s*Best regards,?\s*\n[\s\S]*$/i,
    /\n\s*Regards,?\s*\n[\s\S]*$/i,
    /\n\s*Sincerely,?\s*\n[\s\S]*$/i,
    /\n\s*Thanks,?\s*\n[\s\S]*$/i,
    /\n\s*Thank you,?\s*\n[\s\S]*$/i,
    /\n\s*Cheers,?\s*\n[\s\S]*$/i,
    /\n\s*Best,?\s*\n[\s\S]*$/i,
    /\n\s*Sent from my .*/i, // "Sent from my iPhone" etc
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
  cleaned = cleaned.replace(/^>+.*$/gm, ''); // Lines starting with >
  cleaned = cleaned.replace(/^On .* wrote:[\s\S]*$/gm, ''); // "On Date, Person wrote:"
  cleaned = cleaned.replace(/^-+ Forwarded message -+[\s\S]*$/gm, '');
  cleaned = cleaned.replace(/^-+ Original message -+[\s\S]*$/gm, '');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Summarize an email into 2-3 sentences
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
    const { emailId, forceRegenerate } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    // Get email from database
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Check if summary already exists (unless force regenerate)
    if (email.summary && !forceRegenerate) {
      return NextResponse.json({
        success: true,
        summary: email.summary,
        cached: true,
      });
    }

    const rawEmailBody = email.bodyText || email.bodyHtml || '';
    const emailSubject = email.subject;

    if (!rawEmailBody || rawEmailBody.length < 50) {
      return NextResponse.json({
        success: true,
        summary: `📧 ${emailSubject}` || 'Short email - check full message for details',
        message: 'Email too short to summarize',
      });
    }

    // Clean the email body to remove signatures, inline images, and metadata
    const emailBody = cleanEmailBody(rawEmailBody);

    if (!emailBody || emailBody.length < 50) {
      // Try to use the raw body if cleaning removed too much
      const fallbackBody = rawEmailBody.substring(0, 200).trim();
      if (fallbackBody.length > 20) {
        return NextResponse.json({
          success: true,
          summary: `${emailSubject}: ${fallbackBody}...`,
          message: 'Using email preview',
        });
      }
      
      return NextResponse.json({
        success: true,
        summary: emailSubject || 'Check email for details',
        message: 'Email body empty after cleaning',
      });
    }

    // Call OpenAI to generate summary (optimized for speed)
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Faster than gpt-4 (2-3x speed)
      messages: [
        {
          role: 'system',
          content: `Summarize the main email content in 2-3 sentences. Focus ONLY on the actual message content. Ignore signatures, inline images, metadata, and quoted/forwarded sections. Include: main purpose, key info, action items.`,
        },
        {
          role: 'user',
          content: `Subject: ${emailSubject}\n\nBody:\n${emailBody.substring(0, 2000)}`, // Reduced from 3000 for speed
        },
      ],
      temperature: 0.3, // Lower for faster, more consistent results
      max_tokens: 150, // Reduced from 200 for speed
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    // Cache the summary in the database
    await db
      .update(emails)
      .set({
        summary: summary.trim(),
        updatedAt: new Date(),
      } as any)
      .where(eq(emails.id, emailId));

    // Calculate word count reduction
    const originalWords = emailBody.split(/\s+/).length;
    const summaryWords = summary.trim().split(/\s+/).length;
    const reduction = Math.round(
      ((originalWords - summaryWords) / originalWords) * 100
    );

    return NextResponse.json({
      success: true,
      summary: summary.trim(),
      cached: false,
      originalWords,
      summaryWords,
      reduction: `${reduction}%`,
    });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
