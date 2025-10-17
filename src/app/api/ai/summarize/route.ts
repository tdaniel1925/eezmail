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

    const emailBody = email.bodyText || email.bodyHtml || '';
    const emailSubject = email.subject;

    if (!emailBody || emailBody.length < 50) {
      return NextResponse.json({
        success: true,
        summary: emailSubject,
        message: 'Email too short to summarize',
      });
    }

    // Call OpenAI to generate summary
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an email summarization assistant. Summarize emails into 2-3 clear, concise sentences that capture the key points and any action items. Focus on:
- Main purpose of the email
- Key information or requests
- Any deadlines or action items
- Important decisions or updates

Keep the summary brief but informative. Use professional language.`,
        },
        {
          role: 'user',
          content: `Subject: ${emailSubject}\n\nBody:\n${emailBody.substring(0, 3000)}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
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

