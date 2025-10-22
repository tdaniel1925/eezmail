import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { getUserSignatureData } from '@/lib/email/signature-formatter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI email writer - generate full email from a short prompt or suggest next sentence
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
    const { prompt, currentText, subject, recipientEmail, context } = body;

    // Get user's signature data for professional formatting
    const signatureData = await getUserSignatureData(user.id);

    // Mode 1: Generate full email from prompt (AI Writer)
    if (prompt) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an AI email writing assistant. Write a complete, professional email based on a short user prompt.

**Instructions:**
- Write a natural, professional business letter
- Keep it concise but complete (2-4 paragraphs)
- Use appropriate greeting and closing
- Match the tone to the context
- Be friendly yet professional

**CRITICAL FORMATTING RULES - Use \\n\\n to separate sections:**

STRUCTURE:
Greeting (Dear X, or Hi X,)
\\n\\n
First paragraph of body text
\\n\\n
Second paragraph of body text
\\n\\n
Additional paragraphs (if needed)
\\n\\n
Closing paragraph
\\n\\n
Best regards,
\\n\\n
${signatureData.name}
${signatureData.email}

RULES:
- Use EXACTLY \\n\\n (double newline) between each section
- This creates ONE blank line between paragraphs
- Email goes directly under name with NO blank line (single \\n)
- Do NOT add extra spacing or double-double spacing
- Always include the signature block at the end

Return a JSON object with:
{
  "subject": "Suggested subject line (if not provided)",
  "body": "The full email body with \\n\\n between sections for proper spacing"
}

Return ONLY valid JSON, no other text.`,
          },
          {
            role: 'user',
            content: `Write an email based on this prompt:
"${prompt}"

To: ${context?.to || recipientEmail || 'Unknown'}
${subject ? `Subject: ${subject}` : ''}

Generate the email:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');

      return NextResponse.json({
        success: true,
        body: result.body || '',
        subject: result.subject || subject || '',
      });
    }

    // Mode 2: Suggest next sentence (Smart Compose)
    if (currentText) {
      // Don't suggest if text is too short
      if (currentText.trim().length < 10) {
        return NextResponse.json({
          success: true,
          suggestion: null,
        });
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Suggest the next sentence for an email being written. ONE sentence max (15-20 words). Match tone and style. Return "COMPLETE" if no logical continuation exists.`,
          },
          {
            role: 'user',
            content: `Subject: ${subject || 'No subject'}
Current text: ${currentText}

Next sentence:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 50,
      });

      const suggestion = response.choices[0]?.message?.content?.trim();

      if (!suggestion || suggestion === 'COMPLETE') {
        return NextResponse.json({
          success: true,
          suggestion: null,
        });
      }

      return NextResponse.json({
        success: true,
        suggestion,
      });
    }

    return NextResponse.json(
      { error: 'Either prompt or currentText required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in compose-suggest API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
