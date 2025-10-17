import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { text, context } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Strip HTML tags
    const plainText = text.replace(/<[^>]*>/g, '');

    // Get the last sentence or partial sentence
    const sentences = plainText.split(/[.!?]\s+/);
    const lastSentence = sentences[sentences.length - 1] || '';

    // Don't suggest if the last sentence is very short or ends with punctuation
    if (
      lastSentence.length < 5 ||
      plainText.trim().endsWith('.') ||
      plainText.trim().endsWith('!') ||
      plainText.trim().endsWith('?')
    ) {
      return NextResponse.json({
        suggestions: [],
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a smart email compose assistant. Complete the user's sentence in a natural, professional way. Provide 2-3 short completion options (5-15 words each). Consider the context of the email.

Rules:
- Complete only the current sentence
- Keep it professional and concise
- Match the tone of the existing text
- Don't repeat what's already written
- Return ONLY valid JSON with format: {"suggestions": ["option1", "option2", "option3"]}`,
        },
        {
          role: 'user',
          content: `Email context: ${context || 'Professional email'}

Current text:
"""
${plainText}
"""

Complete the last sentence with 2-3 professional options.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(
      completion.choices[0]?.message?.content || '{"suggestions": []}'
    );

    return NextResponse.json({
      suggestions: result.suggestions || [],
    });
  } catch (error) {
    console.error('Smart compose error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
