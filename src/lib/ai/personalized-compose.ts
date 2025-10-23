'use server';

import { getWritingStyleProfile } from './user-profile';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Personalized Email Composition
 * Generates emails in the user's unique writing style
 */

interface ComposeParams {
  userId: string;
  recipient: string;
  topic: string;
  context?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
  length?: 'short' | 'medium' | 'long';
}

/**
 * Compose an email with the user's personality
 */
export async function composeWithPersonality(
  params: ComposeParams
): Promise<{ subject: string; body: string }> {
  console.log(`✍️ [Personalized Compose] Generating email for user: ${params.userId}`);

  // Get user's writing profile
  const profile = await getWritingStyleProfile(params.userId);

  if (!profile) {
    console.log(`⚠️ [Personalized Compose] No profile found, using default style`);
    return composeGenericEmail(params);
  }

  // Build personalized system prompt
  const systemPrompt = `You are composing an email for a user with this EXACT writing style. You must write in THEIR voice, not a generic professional tone.

**User's Writing Style:**
- Tone: ${profile.preferredTone}
- Formality: ${(profile.writingStyle as any)?.formality || 'neutral'}
- Typical greeting: "${profile.greetingStyle}"
- Typical closing: "${profile.closingStyle}"
- Vocabulary level: ${profile.vocabularyLevel}
- Average email length: ${profile.avgEmailLength} words
- Uses emojis: ${profile.emojiUsage ? 'YES' : 'NO'}
- Common phrases: ${profile.commonPhrases.slice(0, 5).join(', ')}

**Important Rules:**
1. Match their tone EXACTLY - don't make it more formal or casual
2. Use their typical greeting and closing
3. Match their typical email length (±20%)
4. Use their vocabulary level
5. ${profile.emojiUsage ? 'Include appropriate emojis' : 'NO emojis'}
6. Incorporate their common phrases naturally if relevant
7. Write like THEY would write, not how AI typically writes

**Email Context:**
Recipient: ${params.recipient}
Topic: ${params.topic}
${params.context ? `Context: ${params.context}` : ''}
${params.tone ? `Specific tone requested: ${params.tone}` : ''}
${params.length ? `Length: ${params.length}` : ''}

Generate a subject line and email body that sounds like this user wrote it.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Write an email to ${params.recipient} about: ${params.topic}`,
        },
      ],
      temperature: 0.8, // Higher for more personality
      max_tokens: 800,
    });

    const generatedText = completion.choices[0].message.content || '';

    // Parse subject and body
    const subjectMatch = generatedText.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : params.topic;

    // Extract body (everything after "Subject:" line or full text if no subject)
    let body = generatedText;
    if (subjectMatch) {
      body = generatedText
        .substring(generatedText.indexOf(subjectMatch[0]) + subjectMatch[0].length)
        .trim();
    }

    // Remove common artifacts
    body = body.replace(/^(Body:|Email:|Message:)\s*/i, '').trim();

    console.log(`✅ [Personalized Compose] Generated personalized email`);

    return { subject, body };
  } catch (error) {
    console.error(`❌ [Personalized Compose] Error:`, error);
    return composeGenericEmail(params);
  }
}

/**
 * Fallback generic email composition (when no profile exists)
 */
async function composeGenericEmail(
  params: ComposeParams
): Promise<{ subject: string; body: string }> {
  const prompt = `Write a ${params.tone || 'professional'} email to ${params.recipient} about: ${params.topic}
  
${params.context ? `Context: ${params.context}` : ''}

Provide a subject line and body.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful email writing assistant.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  const generatedText = completion.choices[0].message.content || '';
  const subjectMatch = generatedText.match(/Subject:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : params.topic;

  let body = generatedText;
  if (subjectMatch) {
    body = generatedText
      .substring(generatedText.indexOf(subjectMatch[0]) + subjectMatch[0].length)
      .trim();
  }

  body = body.replace(/^(Body:|Email:|Message:)\s*/i, '').trim();

  return { subject, body };
}

/**
 * Rewrite email in user's style
 */
export async function rewriteInUserStyle(
  userId: string,
  originalText: string,
  options?: {
    makeShorter?: boolean;
    makeLonger?: boolean;
    morePersonal?: boolean;
    moreProfessional?: boolean;
  }
): Promise<string> {
  const profile = await getWritingStyleProfile(userId);

  if (!profile) {
    return originalText;
  }

  let instructions = 'Rewrite this email to match the user\'s writing style.';

  if (options?.makeShorter) {
    instructions += ' Make it more concise.';
  }
  if (options?.makeLonger) {
    instructions += ' Add more detail and context.';
  }
  if (options?.morePersonal) {
    instructions += ' Make it more personal and friendly.';
  }
  if (options?.moreProfessional) {
    instructions += ' Make it more professional.';
  }

  const systemPrompt = `${instructions}

**User's Writing Style:**
- Tone: ${profile.preferredTone}
- Greeting: ${profile.greetingStyle}
- Closing: ${profile.closingStyle}
- Vocabulary: ${profile.vocabularyLevel}
- Emojis: ${profile.emojiUsage ? 'YES' : 'NO'}
- Common phrases: ${profile.commonPhrases.slice(0, 5).join(', ')}

Original email:
${originalText}

Rewritten email:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a writing style adapter.',
      },
      { role: 'user', content: systemPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
  });

  return completion.choices[0].message.content || originalText;
}

/**
 * Generate subject line in user's style
 */
export async function generateSubjectLine(
  userId: string,
  emailBody: string
): Promise<string> {
  const profile = await getWritingStyleProfile(userId);

  const prompt = `Based on this email body, generate a concise subject line that matches the user's style:

${profile ? `User typically uses ${profile.vocabularyLevel} vocabulary and ${profile.preferredTone} tone.` : ''}

Email body:
${emailBody.substring(0, 300)}

Subject line:`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a subject line generator. Be concise and clear.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 50,
  });

  return (
    completion.choices[0].message.content?.trim() || 'No Subject'
  );
}

