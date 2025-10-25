import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { emails, emailSignatures } from '@/db/schema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ReplyType = 'professional' | 'acknowledge' | 'detailed' | 'custom';

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
    const { emailId, replyType, customPrompt } = body as {
      emailId: string;
      replyType: ReplyType;
      customPrompt?: string;
    };

    if (!emailId || !replyType) {
      return NextResponse.json(
        { error: 'emailId and replyType are required' },
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

    const emailBody =
      email.bodyText || email.bodyHtml || email.bodyPreview || '';
    const emailSubject = email.subject || '(No Subject)';
    const fromAddress = email.fromAddress || 'Unknown Sender';

    // Fetch user's saved signature if available
    const userSignature = await db.query.emailSignatures.findFirst({
      where: and(
        eq(emailSignatures.userId, user.id),
        eq(emailSignatures.isDefault, true),
        eq(emailSignatures.isEnabled, true)
      ),
      columns: {
        textContent: true,
      },
    });

    // Build prompt based on reply type
    let systemPrompt = '';
    let userPrompt = '';

    switch (replyType) {
      case 'professional':
        systemPrompt = `You are a professional email assistant. Write a formal, well-structured business reply.

WORD COUNT GUIDELINE: 100-150 words (this is a guideline, not a hard limit)

CRITICAL PARAGRAPH FORMATTING:
- Greeting on its own line: "Hi [Name],"
- Press ENTER twice after greeting (creates blank line)
- Each paragraph = 2-3 sentences MAXIMUM
- Press ENTER twice between every paragraph (visual white space)
- NEVER write walls of text
- Each sentence ends with proper punctuation
- Keep sentences concise (15-20 words ideal)
- Closing on its own line after blank line

SPACING FORMULA:
[Greeting],
↓ (blank line)
[Opening paragraph - 2-3 sentences]
↓ (blank line)
[Middle paragraph - 2-3 sentences]
↓ (blank line)
[Closing paragraph - 1-2 sentences]
↓ (blank line)
[Sign-off],

FORMATTING RULES:
- Start with professional greeting: "Hi [Name]," or "Hello [Name],"
- Use proper paragraphs with blank lines between them
- Each paragraph covers ONE main point only
- Keep paragraphs short (2-3 sentences max)
- End with professional closing: "Best regards," "Kind regards," or "Thank you,"
- Do NOT include signature block - that will be added separately
- Do NOT include subject line or "RE:"
- Do NOT quote the original email
- NEVER include "--- On [date], [email] wrote:" or any quoted text

STRUCTURE:
1. Professional greeting on own line
2. Opening acknowledgment (1-2 sentences in first paragraph)
3. Main response (1-2 short paragraphs, separated by blank lines)
4. Closing action/next step (separate paragraph)
5. Professional closing with comma on own line

TONE: Professional, polite, clear, and concise

Remember: White space makes emails readable. Always separate paragraphs with blank lines!`;

        userPrompt = `Write a professional reply to this email from ${fromAddress}:

Subject: ${emailSubject}

Email content:
${emailBody.substring(0, 1000)}

CRITICAL: Follow proper paragraph formatting with blank lines between ALL paragraphs. Write a well-formatted professional reply with 2-3 sentences per paragraph maximum. Include pricing/timeline expectations if relevant. Be direct and to the point.

IMPORTANT: 
- You MUST start with a greeting like "Hi [Name]," on its own line
- Extract the sender's first name from the email address or content
- End with ONLY the closing (e.g., "Best regards,") - do NOT add your name or signature

Reply:`;
        break;

      case 'acknowledge':
        systemPrompt = `You are an email assistant. Write a brief, professional acknowledgment.

WORD COUNT GUIDELINE: 50-75 words (this is a guideline, not a hard limit)

CRITICAL PARAGRAPH FORMATTING:
- Greeting on its own line: "Hi [Name],"
- Press ENTER twice after greeting (creates blank line)
- Single short paragraph: 2-3 sentences TOTAL
- Press ENTER twice before closing
- Closing on its own line: "Best," or "Thanks,"
- NEVER write walls of text

SPACING FORMULA:
[Greeting],
↓ (blank line)
[Brief message - 2-3 sentences acknowledging receipt and promising follow-up]
↓ (blank line)
[Sign-off],

FORMATTING RULES:
- Start with friendly greeting: "Hi [Name]," or "Hello [Name],"
- TOTAL of 2-3 sentences only in one paragraph
- Acknowledge receipt of their email
- Promise a detailed follow-up with specific timing
- End with brief closing: "Best," "Thanks," or "Best regards,"
- Do NOT include signature block - that will be added separately
- Do NOT include subject line or "RE:"
- Do NOT quote the original email
- NEVER include "--- On [date], [email] wrote:" or any quoted text
- NO detailed information - save that for the follow-up

STRUCTURE:
1. Friendly greeting on own line
2. Brief acknowledgment with follow-up promise (2-3 sentences in single paragraph)
3. Brief closing with comma on own line

TONE: Friendly but brief, professional

Remember: Keep it short and sweet with proper spacing!`;
        userPrompt = `Write a quick acknowledgment reply to this email from ${fromAddress}:

Subject: ${emailSubject}

Email content:
${emailBody.substring(0, 500)}

CRITICAL: Use proper spacing with blank lines after greeting and before closing. Write a BRIEF acknowledgment (2-3 sentences total in one paragraph). Acknowledge receipt and promise a detailed follow-up. NO detailed information in this response.

Reply:`;
        break;

      case 'detailed':
        systemPrompt = `You are a professional email assistant. Write a detailed, comprehensive response.

WORD COUNT GUIDELINE: 250-400 words (this is a guideline, not a hard limit)

CRITICAL PARAGRAPH FORMATTING:
- Greeting on its own line: "Hi [Name],"
- Press ENTER twice after greeting (creates blank line)
- Each paragraph = 2-3 sentences MAXIMUM
- Press ENTER twice between EVERY paragraph (visual white space)
- NEVER write walls of text
- Each sentence ends with proper punctuation
- Keep sentences concise (15-20 words ideal)
- Closing on its own line after blank line

SPACING FORMULA FOR DETAILED REPLY:
[Greeting],
↓ (blank line)
[Opening paragraph - acknowledge and show understanding]
↓ (blank line)
**Section Header:**
[Detail paragraph 1 - 2-3 sentences]
↓ (blank line)
[Detail paragraph 2 - 2-3 sentences]
↓ (blank line)
**Another Section:**
• Bullet point 1
• Bullet point 2
• Bullet point 3
↓ (blank line)
[Pricing/timeline paragraph]
↓ (blank line)
[Next steps paragraph]
↓ (blank line)
[Sign-off],

FORMATTING RULES:
- Start with professional greeting: "Hi [Name]," or "Hello [Name],"
- Use multiple sections with bold headers (e.g., **Project Understanding:**, **Our Approach:**)
- Use bullet points or numbered lists for multiple items
- Each paragraph = 2-3 sentences focused on one topic
- Include blank lines between sections and paragraphs
- End with clear next steps or action items
- Professional closing: "Best regards," "Looking forward to," etc. with comma
- Do NOT include signature block - that will be added separately
- Do NOT include subject line or "RE:"
- Do NOT quote the original email
- NEVER include "--- On [date], [email] wrote:" or any quoted text

STRUCTURE:
1. Professional greeting on own line
2. Opening statement showing understanding (one paragraph)
3. Multiple sections with headers covering:
   - Understanding of their needs
   - Your proposed approach/solution
   - Technical specifications (if relevant)
   - Pricing/timeline (if applicable)
   - Why choose you/your company
   - Clear next steps
4. Professional closing with comma on own line

CONTENT:
- Address ALL points from the original email
- Include comprehensive details
- Provide specific examples or breakdown
- Show expertise and thoroughness

TONE: Professional, thorough, organized, confident

Remember: Even detailed responses need white space! Separate every paragraph and section with blank lines!`;

        userPrompt = `Write a detailed, comprehensive response to this email from ${fromAddress}:

Subject: ${emailSubject}

Email content:
${emailBody.substring(0, 1200)}

CRITICAL: Use proper paragraph formatting with blank lines between ALL paragraphs and sections. Each paragraph must be 2-3 sentences maximum. Write a well-structured detailed response with multiple sections, headers, and bullet points. Include technical specifications, pricing/timeline if relevant, and multiple next steps. Be thorough and comprehensive.

Reply:`;
        break;

      case 'custom':
        systemPrompt = `You are a helpful email assistant. Write a reply based on the user's specific instructions.

CRITICAL PARAGRAPH FORMATTING (ALWAYS REQUIRED):
- Greeting on its own line: "Hi [Name]," (or match user's tone request)
- Press ENTER twice after greeting (creates blank line)
- Each paragraph = 2-3 sentences MAXIMUM
- Press ENTER twice between EVERY paragraph (visual white space)
- NEVER write walls of text
- Each sentence ends with proper punctuation
- Keep sentences concise (15-20 words ideal)
- Closing on its own line after blank line

SPACING FORMULA:
[Greeting],
↓ (blank line)
[Paragraph 1 - 2-3 sentences]
↓ (blank line)
[Paragraph 2 - 2-3 sentences]
↓ (blank line)
[Paragraph 3 - 2-3 sentences if needed]
↓ (blank line)
[Sign-off],

INSTRUCTIONS PARSING:
- Look for tone indicators: "friendly", "casual", "formal", "urgent", "enthusiastic"
- Look for length requirements: "brief", "short", "detailed", "comprehensive"
- Look for focus areas: "timeline", "pricing", "availability", "expertise", specific topics
- Adapt your response to match ALL specified requirements

COMMON INSTRUCTION EXAMPLES:
- "Make it friendly and casual" → Use conversational tone, contractions, warm language (but still use proper paragraph spacing!)
- "Focus on timeline and availability" → Emphasize scheduling, start dates, delivery timeframes
- "Emphasize our AI expertise" → Highlight AI capabilities, past projects, technical knowledge
- "Keep it brief but professional" → Short response, formal language, under 100 words
- "Show enthusiasm" → Use energetic language, express excitement, positive tone

FORMATTING RULES (ALWAYS APPLY):
- Start with appropriate greeting based on tone (Hi/Hello/Hey for casual, Hello/Dear for formal)
- Use proper paragraphs with blank lines between them
- Follow the user's specific tone and content instructions precisely
- Keep paragraphs short and focused (2-3 sentences max)
- End with appropriate closing matching the tone
- Do NOT include signature block - that will be added separately
- Do NOT include subject line or "RE:"
- Do NOT quote the original email
- NEVER include "--- On [date], [email] wrote:" or any quoted text

TONE: Match the user's requested style while maintaining professionalism

Remember: ALWAYS use proper paragraph spacing with blank lines, regardless of the custom instructions!`;

        userPrompt = `User's custom instructions: "${customPrompt}"

Email context you're replying to:
From: ${fromAddress}
Subject: ${emailSubject}

Email content:
${emailBody.substring(0, 1000)}

CRITICAL: Use proper paragraph formatting with blank lines between ALL paragraphs. Each paragraph must be 2-3 sentences maximum. Write a reply that precisely follows the user's custom instructions. Parse their requirements for tone, length, and focus areas. Maintain proper email formatting with greeting and closing.

Reply:`;
        break;
    }

    // Generate reply using GPT-4o-mini (fast and cheap)
    // Adjust max_tokens based on reply type
    let maxTokens = 300; // Default for professional/acknowledge
    if (replyType === 'detailed') {
      maxTokens = 600; // More tokens for detailed responses (250-400 words)
    } else if (replyType === 'custom') {
      maxTokens = 450; // Flexible for custom instructions
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      top_p: 0.9,
      frequency_penalty: 0.5, // Reduce repetition
      presence_penalty: 0.3, // Encourage focused responses
    });

    const replyText = response.choices[0]?.message?.content;

    if (!replyText) {
      return NextResponse.json(
        { error: 'Failed to generate reply' },
        { status: 500 }
      );
    }

    // Append user's name and signature if available
    let finalReply = replyText.trim();

    // Get user's name from Supabase auth
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    const userName =
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      authUser?.email?.split('@')[0] ||
      'User';

    // Add blank line after closing, then name
    finalReply = `${finalReply}\n\n${userName}`;

    if (userSignature?.textContent) {
      // Add signature after name
      finalReply = `${finalReply}\n${userSignature.textContent.trim()}`;
    }

    return NextResponse.json({
      success: true,
      reply: finalReply,
      subject: `RE: ${emailSubject}`,
    });
  } catch (error) {
    console.error('Error generating AI reply:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
