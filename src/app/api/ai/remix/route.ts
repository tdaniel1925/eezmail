import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Rewrite and improve email text
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
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Call OpenAI to rewrite the text
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a text correction assistant. Your ONLY job is to fix errors in the existing text.

**CRITICAL RULES:**
- DO NOT rewrite or change the content
- DO NOT add new information
- DO NOT remove existing information
- DO NOT change the tone or style
- ONLY fix spelling errors
- ONLY fix grammar mistakes
- ONLY fix punctuation errors
- Keep the exact same meaning and message
- Maintain proper spacing: blank line after greeting, between paragraphs, before closing

**Example:**
Input: "helo i wan to meeting tomrrow about the projet"
Output: "Hello, I want to meet tomorrow about the project."

**CRITICAL FORMATTING RULES:**

Use \\n\\n (double newline) to create ONE blank line between sections:
- Greeting \\n\\n Opening paragraph \\n\\n Body paragraphs \\n\\n Closing \\n\\n Sign-off \\n\\n Name
- Contact info uses single \\n (directly under name, no blank line)

EXAMPLE FORMAT:
Dear John,
\\n\\n
I hope this message finds you well.
\\n\\n
Thank you for your attention.
\\n\\n
Best regards,
\\n\\n
John Doe
John.Doe@email.com

This creates EXACTLY one blank line between each section.

Return ONLY the corrected text with errors fixed. Nothing else.`,
        },
        {
          role: 'user',
          content: `Fix ONLY spelling, grammar, and punctuation errors in this text. Do not rewrite or change the content:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const rewrittenText = response.choices[0]?.message?.content;

    if (!rewrittenText) {
      return NextResponse.json(
        { error: 'Failed to rewrite text' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rewrittenText: rewrittenText.trim(),
      originalLength: text.length,
      newLength: rewrittenText.trim().length,
    });
  } catch (error) {
    console.error('Error in remix API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
