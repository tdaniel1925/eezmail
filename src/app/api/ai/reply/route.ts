import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { getUserSignatureData } from '@/lib/email/signature-formatter';

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
      // New parameters for Reply Later feature
      subject,
      bodyText,
      bodyHtml,
      isDraft,
      emailId,
    } = body;

    // Support both old and new parameter formats
    const emailSubject = originalSubject || subject;
    const emailBody = originalBody || bodyText || bodyHtml;

    if (!emailSubject || !emailBody) {
      return NextResponse.json(
        { error: 'Email subject and body are required' },
        { status: 400 }
      );
    }

    // Get user's signature data for professional formatting
    const signatureData = await getUserSignatureData(user.id);

    // Build context for AI
    let contextPrompt = `You are composing a reply to this email:

From: ${senderName || senderEmail || 'Unknown'}
Subject: ${emailSubject}

Email body:
${emailBody}`;

    if (threadHistory && threadHistory.length > 0) {
      contextPrompt += `\n\nPrevious messages in thread:\n${threadHistory.join('\n---\n')}`;
    }

    contextPrompt += `\n\nGenerate a professional and contextual reply. Return as JSON with "subject" and "body" fields. The subject should be "Re: ${emailSubject}" unless the context requires something different.`;

    // Call OpenAI to generate reply
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an email reply assistant. Generate professional, business-style email replies.

**CRITICAL FORMATTING RULES:**

STRUCTURE (use \\n\\n for spacing):
Dear/Hi [Name],
\\n\\n
[Opening paragraph - acknowledge their message]
\\n\\n
[Body paragraph - address key points]
\\n\\n
[Closing paragraph - call to action or conclusion]
\\n\\n
Best regards,
\\n\\n
${signatureData.name}
${signatureData.email}

GUIDELINES:
- Use proper business letter format with greeting
- Acknowledge the original message context
- Address key points appropriately
- Keep it concise (2-4 paragraphs max)
- Match the formality level of the original email
- Use EXACTLY \\n\\n (double newline) between sections for proper spacing
- Always include the signature block at the end
- Maintain professional but friendly tone

Return as valid JSON with "subject" and "body" fields.`,
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
      const bodyMatch = content.match(/body[":]+\s*["']?(.+)["']?/i);

      if (subjectMatch && bodyMatch) {
        parsed = {
          subject: subjectMatch[1].trim(),
          body: bodyMatch[1].trim().replace(/\\n/g, '\n'),
        };
      } else {
        // Fallback: use entire content as body
        parsed = {
          subject: `Re: ${emailSubject}`,
          body: content.trim(),
        };
      }
    }

    // Body already includes signature from AI, no need to append

    // ✅ Update onboarding progress (AI reply tried)
    try {
      const { updateOnboardingProgress } = await import(
        '@/lib/onboarding/actions'
      );
      await updateOnboardingProgress(user.id, { aiReplyTried: true });
    } catch (error) {
      // Non-critical: Don't fail the request if onboarding update fails
      console.log('Onboarding update skipped:', error);
    }

    // If isDraft, return just the reply text for the Reply Later feature
    if (isDraft) {
      return NextResponse.json({
        success: true,
        reply: parsed.body,
        subject: parsed.subject || `Re: ${emailSubject}`,
        emailId: emailId || null,
      });
    }

    // Original format for backward compatibility
    return NextResponse.json({
      success: true,
      subject: parsed.subject || `Re: ${emailSubject}`,
      body: parsed.body,
    });
  } catch (error) {
    console.error('Error in reply API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
