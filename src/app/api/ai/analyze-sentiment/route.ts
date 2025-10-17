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
 * Analyze email sentiment and tone
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
    const { emailId, subject, bodyText } = body;

    if (!bodyText) {
      return NextResponse.json(
        { error: 'Email body is required' },
        { status: 400 }
      );
    }

    // Call OpenAI to analyze sentiment
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a sentiment analysis assistant for emails. Analyze the tone and emotional content of emails.

Return JSON with this structure:
{
  "sentiment": "positive" | "neutral" | "negative" | "urgent" | "anxious" | "angry",
  "score": number (-100 to +100, where -100 is very negative, 0 is neutral, +100 is very positive),
  "confidence": "high" | "medium" | "low",
  "summary": "Brief explanation of the sentiment",
  "keyIndicators": ["Words or phrases that indicate the sentiment"],
  "isHarsh": boolean (true if tone might be perceived as harsh or offensive),
  "suggestions": "Optional suggestions to soften tone (only if isHarsh is true)"
}

Sentiment categories:
- positive: Friendly, appreciative, enthusiastic (score 30-100)
- neutral: Professional, matter-of-fact, informational (score -20 to 30)
- negative: Disappointed, dissatisfied, critical (score -60 to -20)
- angry: Hostile, furious, aggressive (score -100 to -60)
- urgent: High priority, time-sensitive, pressing (score varies)
- anxious: Worried, concerned, nervous (score varies)

Look for:
- Emotional words (excited, frustrated, concerned, angry, happy)
- Punctuation (excessive exclamation marks, all caps)
- Politeness markers (please, thank you, appreciate)
- Critical language (disappointed, unacceptable, poor)
- Urgency markers (ASAP, urgent, immediately, deadline)`,
        },
        {
          role: 'user',
          content: `Subject: ${subject || ''}\n\nBody:\n${bodyText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to analyze sentiment' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let sentimentData: any;
    try {
      sentimentData = JSON.parse(content);
    } catch (parseError) {
      // Default to neutral if parsing fails
      sentimentData = {
        sentiment: 'neutral',
        score: 0,
        confidence: 'low',
        summary: 'Unable to analyze sentiment',
      };
    }

    // Update email in database if emailId provided
    if (emailId) {
      await db
        .update(emails)
        .set({
          sentiment: sentimentData.sentiment,
          sentimentScore: sentimentData.score,
        })
        .where(eq(emails.id, emailId));
    }

    return NextResponse.json({
      success: true,
      ...sentimentData,
    });
  } catch (error) {
    console.error('Error in analyze-sentiment API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

