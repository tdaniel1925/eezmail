/**
 * Tone Adjustment Service
 * Adjusts email tone using AI to match desired communication style
 */

'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type ToneType =
  | 'casual'
  | 'professional'
  | 'formal'
  | 'friendly'
  | 'confident'
  | 'empathetic';

export interface ToneAdjustmentResult {
  original: string;
  adjusted: string;
  tone: ToneType;
  changes: string[];
}

/**
 * Adjust the tone of an email
 */
export async function adjustTone(
  text: string,
  targetTone: ToneType
): Promise<ToneAdjustmentResult> {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  const tonePrompts: Record<ToneType, string> = {
    casual:
      'Rewrite this email in a casual, relaxed tone. Use contractions, be conversational, and friendly. Keep it short and to the point.',
    professional:
      'Rewrite this email in a professional business tone. Be polite, clear, and respectful. Maintain appropriate formality.',
    formal:
      'Rewrite this email in a formal, polished tone. Use complete sentences, proper grammar, and formal language. Be courteous and precise.',
    friendly:
      'Rewrite this email in a warm, friendly tone. Be personable, approachable, and positive. Show genuine interest.',
    confident:
      'Rewrite this email in a confident, assertive tone. Be direct, clear, and self-assured without being arrogant.',
    empathetic:
      'Rewrite this email in an empathetic, understanding tone. Show compassion, acknowledge feelings, and be supportive.',
  };

  const prompt = `${tonePrompts[targetTone]}

Original email:
"""
${text}
"""

IMPORTANT: 
- Keep the core message and facts the same
- Maintain the same structure (greetings, body, closing)
- Don't add or remove information
- Just adjust the TONE and STYLE

Rewritten email:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert email writer who adjusts tone while preserving meaning. You provide ONLY the rewritten email without explanations.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const adjusted = completion.choices[0]?.message?.content?.trim() || text;

    // Identify key changes (simplified)
    const changes: string[] = [];
    if (adjusted !== text) {
      changes.push(`Adjusted to ${targetTone} tone`);

      // Detect specific changes
      if (adjusted.length < text.length * 0.8) {
        changes.push('Shortened for brevity');
      } else if (adjusted.length > text.length * 1.2) {
        changes.push('Expanded for clarity');
      }

      if (adjusted.includes('!') && !text.includes('!')) {
        changes.push('Added enthusiasm');
      }

      if (hasMoreFormalWords(adjusted, text)) {
        changes.push('Increased formality');
      }
    }

    console.log(`📝 Adjusted tone from default to ${targetTone}`);

    return {
      original: text,
      adjusted,
      tone: targetTone,
      changes,
    };
  } catch (error) {
    console.error('Error adjusting tone:', error);
    throw new Error('Failed to adjust tone');
  }
}

/**
 * Compare multiple tone options side-by-side
 */
export async function compareTones(
  text: string,
  tones: ToneType[]
): Promise<Record<ToneType, string>> {
  const results: Record<ToneType, string> = {} as any;

  await Promise.all(
    tones.map(async (tone) => {
      try {
        const result = await adjustTone(text, tone);
        results[tone] = result.adjusted;
      } catch (error) {
        console.error(`Error adjusting to ${tone}:`, error);
        results[tone] = text; // Fallback to original
      }
    })
  );

  return results;
}

/**
 * Suggest best tone based on email context
 */
export async function suggestTone(
  emailContent: string,
  recipientRelationship?:
    | 'colleague'
    | 'manager'
    | 'client'
    | 'friend'
    | 'vendor'
): Promise<ToneType> {
  // Simple rule-based suggestion
  // In production, this could use AI to analyze context

  if (!recipientRelationship) {
    return 'professional'; // Default safe choice
  }

  const suggestions: Record<string, ToneType> = {
    colleague: 'friendly',
    manager: 'professional',
    client: 'professional',
    friend: 'casual',
    vendor: 'professional',
  };

  return suggestions[recipientRelationship] || 'professional';
}

/**
 * Auto-adjust tone based on recipient analysis
 */
export async function autoAdjustTone(
  text: string,
  recipientEmail: string,
  userId: string
): Promise<ToneAdjustmentResult> {
  // TODO: Analyze past emails with this recipient to determine preferred tone
  // For now, use professional as default

  const tone: ToneType = 'professional';
  return adjustTone(text, tone);
}

/**
 * Helper: Check if text has more formal words
 */
function hasMoreFormalWords(text1: string, text2: string): boolean {
  const formalWords = [
    'furthermore',
    'consequently',
    'therefore',
    'regarding',
    'kindly',
    'sincerely',
    'respectfully',
    'appreciate',
  ];

  const count1 = formalWords.filter((word) =>
    text1.toLowerCase().includes(word)
  ).length;
  const count2 = formalWords.filter((word) =>
    text2.toLowerCase().includes(word)
  ).length;

  return count1 > count2;
}
