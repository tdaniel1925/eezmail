/**
 * AI Email Screening Functions
 * Hey-inspired email classification and analysis
 */

import { openai, AI_MODELS } from './client';

export interface EmailScreeningResult {
  suggestedView: 'imbox' | 'feed' | 'paper_trail';
  confidence: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
  summary: string;
  reasoning: string;
  actionItems?: string[];
  quickReplies?: string[];
}

/**
 * Analyze and screen an email using AI
 */
export async function screenEmail(email: {
  from: string;
  subject: string;
  body: string;
  fromName?: string;
}): Promise<EmailScreeningResult> {
  try {
    const prompt = `You are an AI email assistant helping to screen and categorize incoming emails.

Email Details:
From: ${email.fromName || email.from} <${email.from}>
Subject: ${email.subject}
Body: ${email.body.substring(0, 1000)}...

Analyze this email and provide:
1. Which Hey-inspired view it belongs to:
   - "imbox": Important personal emails that need attention (people, not newsletters)
   - "feed": Newsletters, updates, bulk emails, promotions
   - "paper_trail": Receipts, confirmations, automated notifications

2. Priority level (urgent/high/medium/low)
3. Sentiment (positive/negative/neutral)
4. Category (e.g., work, personal, finance, social, shopping, etc.)
5. Brief 1-sentence summary
6. Reasoning for categorization
7. Action items (if any)
8. 2-3 quick reply suggestions (if personal email)

Respond ONLY with valid JSON matching this structure:
{
  "suggestedView": "imbox" | "feed" | "paper_trail",
  "confidence": 0.0-1.0,
  "priority": "urgent" | "high" | "medium" | "low",
  "sentiment": "positive" | "negative" | "neutral",
  "category": "string",
  "summary": "string",
  "reasoning": "string",
  "actionItems": ["string"] or null,
  "quickReplies": ["string"] or null
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.FAST,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert email analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    ) as EmailScreeningResult;

    return result;
  } catch (error) {
    console.error('Email screening error:', error);

    // Fallback result
    return {
      suggestedView: 'feed',
      confidence: 0.5,
      priority: 'medium',
      sentiment: 'neutral',
      category: 'general',
      summary: 'Unable to analyze email',
      reasoning: 'AI analysis failed, defaulting to Feed',
    };
  }
}

/**
 * Generate AI summary for a thread
 */
export async function summarizeThread(
  emails: Array<{
    from: string;
    subject: string;
    body: string;
    timestamp: Date;
  }>
): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}> {
  try {
    const threadContent = emails
      .map(
        (e, i) =>
          `Email ${i + 1} (${e.timestamp.toISOString()})
From: ${e.from}
Subject: ${e.subject}
Body: ${e.body.substring(0, 500)}...
---`
      )
      .join('\n\n');

    const prompt = `Analyze this email thread and provide:
1. A concise summary of the entire conversation
2. Key points discussed
3. Action items that need to be done

Thread:
${threadContent}

Respond with valid JSON:
{
  "summary": "string",
  "keyPoints": ["string"],
  "actionItems": ["string"]
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.FAST,
      messages: [
        {
          role: 'system',
          content: 'You are an expert at summarizing email threads.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return {
      summary: result.summary || 'Thread summary unavailable',
      keyPoints: result.keyPoints || [],
      actionItems: result.actionItems || [],
    };
  } catch (error) {
    console.error('Thread summarization error:', error);
    return {
      summary: 'Unable to summarize thread',
      keyPoints: [],
      actionItems: [],
    };
  }
}

/**
 * Generate smart reply suggestions
 */
export async function generateSmartReplies(email: {
  from: string;
  subject: string;
  body: string;
}): Promise<string[]> {
  try {
    const prompt = `Generate 3 short, professional reply suggestions for this email:

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}

Each reply should be:
- 1-2 sentences maximum
- Appropriate tone
- Common responses (accept/decline/acknowledge/ask for more info)

Respond with JSON:
{
  "replies": ["string", "string", "string"]
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.FAST,
      messages: [
        {
          role: 'system',
          content: 'You generate quick email reply suggestions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return result.replies || [];
  } catch (error) {
    console.error('Smart reply generation error:', error);
    return [];
  }
}

/**
 * Detect sender importance and relationship
 */
export async function analyzeSenderImportance(
  senderEmail: string,
  senderName: string,
  previousEmails: number,
  userContext?: string
): Promise<{
  isImportant: boolean;
  relationship: 'personal' | 'professional' | 'automated' | 'unknown';
  reasoning: string;
  suggestedAction: 'approve' | 'screen' | 'block';
}> {
  try {
    const prompt = `Analyze this email sender:

Sender: ${senderName} <${senderEmail}>
Previous emails from sender: ${previousEmails}
User context: ${userContext || 'Not provided'}

Determine:
1. Is this an important sender? (true/false)
2. Relationship type (personal/professional/automated/unknown)
3. Brief reasoning
4. Suggested action (approve for Inbox / screen each time / block)

Respond with JSON:
{
  "isImportant": boolean,
  "relationship": "personal" | "professional" | "automated" | "unknown",
  "reasoning": "string",
  "suggestedAction": "approve" | "screen" | "block"
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODELS.FAST,
      messages: [
        {
          role: 'system',
          content: 'You analyze email sender importance and relationships.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return {
      isImportant: result.isImportant || false,
      relationship: result.relationship || 'unknown',
      reasoning: result.reasoning || 'Unable to determine',
      suggestedAction: result.suggestedAction || 'screen',
    };
  } catch (error) {
    console.error('Sender analysis error:', error);
    return {
      isImportant: false,
      relationship: 'unknown',
      reasoning: 'Analysis unavailable',
      suggestedAction: 'screen',
    };
  }
}
