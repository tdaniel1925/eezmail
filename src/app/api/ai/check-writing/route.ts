import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface WritingSuggestion {
  type: 'spelling' | 'grammar' | 'style' | 'clarity' | 'tone';
  original: string;
  suggestion: string;
  explanation: string;
  position?: { start: number; end: number };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { text, mode = 'full' } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Strip HTML tags for checking
    const plainText = text.replace(/<[^>]*>/g, '');

    if (!plainText.trim()) {
      return NextResponse.json({
        suggestions: [],
        correctedText: text,
        summary: 'No content to check',
      });
    }

    // Different prompts based on mode
    const prompts: Record<string, string> = {
      full: `You are an expert writing assistant. Analyze the following text for spelling, grammar, style, clarity, and tone issues. Provide specific, actionable suggestions.

Text to analyze:
"""
${plainText}
"""

Return a JSON response with:
1. "suggestions": An array of objects with: "type" (spelling/grammar/style/clarity/tone), "original" (the problematic text), "suggestion" (the improvement), "explanation" (why it's better)
2. "correctedText": The fully corrected version of the text
3. "summary": A brief overall assessment (1-2 sentences)

Focus on:
- Spelling errors
- Grammar mistakes
- Awkward phrasing
- Clarity improvements
- Professional tone
- Conciseness`,

      quick: `Check this text for spelling and grammar errors only. Return JSON with "suggestions" array and "correctedText".

Text:
"""
${plainText}
"""`,

      style: `Improve the writing style and tone of this text to be more professional and clear. Return JSON with "suggestions" array focusing on style improvements and "correctedText".

Text:
"""
${plainText}
"""`,
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional writing assistant. Always respond with valid JSON only, no additional text.',
        },
        {
          role: 'user',
          content: prompts[mode] || prompts.full,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return NextResponse.json({
      suggestions: result.suggestions || [],
      correctedText: result.correctedText || plainText,
      summary: result.summary || 'Analysis complete',
    });
  } catch (error: any) {
    console.error('Writing check error:', error);

    // Detailed error message for debugging
    const errorMessage = error?.message || 'Failed to check writing';
    const errorDetails = {
      error: errorMessage,
      type: error?.type || 'unknown',
      code: error?.code || 'unknown',
    };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}
