import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a contextual email reply
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
    const {
      originalSubject,
      originalBody,
      senderName,
      senderEmail,
      threadHistory,
      userSignature,
    } = body;

    if (!originalSubject || !originalBody) {
      return NextResponse.json(
        { error: 'Original email subject and body are required' },
        { status: 400 }
      );
    }

    // Build context for AI
    let contextPrompt = `You are composing a reply to this email:

From: ${senderName || senderEmail || 'Unknown'}
Subject: ${originalSubject}

Email body:
${originalBody}`;

    if (threadHistory && threadHistory.length > 0) {
      contextPrompt += `\n\nPrevious messages in thread:\n${threadHistory.join('\n---\n')}`;
    }

    contextPrompt += `\n\nGenerate a professional and contextual reply. Return as JSON with "subject" and "body" fields. The subject should be "Re: ${originalSubject}" unless the context requires something different.`;

    // Call OpenAI to generate reply
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an email reply assistant. Generate professional and contextual email replies.

Guidelines:
- Acknowledge the original message
- Address key points appropriately
- Maintain professional but friendly tone
- Keep it concise (2-4 paragraphs max)
- Match the formality level of the original
- Include a proper greeting and closing
- Return as valid JSON with "subject" and "body" fields`,
        },
        {
          role: 'user',
          content: contextPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to generate reply' },
        { status: 500 }
      );
    }

    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If not valid JSON, try to extract subject and body
      const subjectMatch = content.match(
        /subject[":]+\s*["']?([^"'\n]+)["']?/i
      );
      const bodyMatch = content.match(/body[":]+\s*["']?(.+)["']?/is);

      if (subjectMatch && bodyMatch) {
        parsed = {
          subject: subjectMatch[1].trim(),
          body: bodyMatch[1].trim().replace(/\\n/g, '\n'),
        };
      } else {
        // Fallback: use entire content as body
        parsed = {
          subject: `Re: ${originalSubject}`,
          body: content.trim(),
        };
      }
    }

    // Add signature if provided
    let finalBody = parsed.body;
    if (userSignature) {
      finalBody += `\n\n${userSignature}`;
    }

    return NextResponse.json({
      success: true,
      subject: parsed.subject || `Re: ${originalSubject}`,
      body: finalBody,
    });
  } catch (error) {
    console.error('Error in reply API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

