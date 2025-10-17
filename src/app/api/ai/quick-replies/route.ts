import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate 3-4 quick reply suggestions based on email context
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
    const { subject, bodyText, senderName } = body;

    if (!subject || !bodyText) {
      return NextResponse.json(
        { error: 'Email subject and body are required' },
        { status: 400 }
      );
    }

    // Call OpenAI to generate quick reply suggestions
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an email reply assistant. Generate 3-4 SHORT, context-appropriate reply suggestions.

Rules:
- Each suggestion should be 1-5 words max
- Be specific to the email context
- Vary the tone (positive/neutral/informative/questioning)
- Make them actionable
- Return ONLY a JSON array of strings, no other text

Examples:
- Meeting invite → ["Accept", "Decline", "Tentative", "Propose new time"]
- Question → ["Yes", "No", "Let me check", "Need more info"]
- Thank you email → ["You're welcome!", "Happy to help!", "Anytime!"]
- Request → ["Will do!", "On it", "Can't right now", "Need details"]
- Update/Info → ["Got it, thanks!", "Noted", "Question:", "Thanks for update"]`,
        },
        {
          role: 'user',
          content: `Subject: ${subject}\n\nBody: ${bodyText.substring(0, 500)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate suggestions' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let suggestions: string[];
    try {
      suggestions = JSON.parse(content);

      // Validate it's an array of strings
      if (
        !Array.isArray(suggestions) ||
        !suggestions.every((s) => typeof s === 'string')
      ) {
        throw new Error('Invalid format');
      }

      // Limit to 4 suggestions
      suggestions = suggestions.slice(0, 4);
    } catch (parseError) {
      // Fallback: extract suggestions from text
      const lines = content.split('\n').filter((line) => line.trim());
      suggestions = lines
        .map((line) =>
          line
            .replace(/^[-*\d.)\]]+\s*/, '')
            .replace(/^["']|["']$/g, '')
            .trim()
        )
        .filter((s) => s.length > 0 && s.length < 50)
        .slice(0, 4);

      // If still no suggestions, use fallbacks
      if (suggestions.length === 0) {
        suggestions = ['Thanks!', 'Got it', 'Will check', 'Let me get back'];
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Error in quick-replies API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

