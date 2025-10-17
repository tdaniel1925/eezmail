'use server';

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Compose a new email with AI assistance
 */
export async function composeNewEmail(params: {
  recipient: string;
  topic: string;
  context?: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'formal';
  length?: 'brief' | 'moderate' | 'detailed';
}): Promise<{
  success: boolean;
  recipient?: string;
  subject?: string;
  body?: string;
  message: string;
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        message: 'OpenAI API key not configured',
      };
    }

    const tone = params.tone || 'professional';
    const length = params.length || 'moderate';

    // Build the prompt
    const prompt = `Compose a ${tone} email ${params.context ? `about: ${params.context}` : `with subject: ${params.topic}`}.

Recipient: ${params.recipient}
${params.context ? `Context: ${params.context}` : ''}
Tone: ${tone}
Length: ${length} (${length === 'brief' ? '2-3 sentences' : length === 'moderate' ? '1-2 paragraphs' : '2-3 paragraphs'})

Generate:
1. A clear, concise subject line
2. A well-structured email body

Return as JSON with "subject" and "body" fields. Make it ${tone} and ${length}.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional email writing assistant. Generate clear, well-structured emails based on the user\'s requirements. Return only valid JSON with "subject" and "body" fields.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        message: 'Failed to generate email',
      };
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If not valid JSON, try to extract subject and body
      const subjectMatch = content.match(
        /subject[":]+\s*["']?([^"'\n]+)["']?/i
      );
      const bodyMatch = content.match(/body[":]+\s*["']?([\s\S]+?)["']?/i);

      if (subjectMatch && bodyMatch) {
        parsed = {
          subject: subjectMatch[1].trim(),
          body: bodyMatch[1].trim().replace(/\\n/g, '\n'),
        };
      } else {
        return {
          success: false,
          message: 'Failed to parse email content',
        };
      }
    }

    return {
      success: true,
      recipient: params.recipient,
      subject: parsed.subject,
      body: parsed.body,
      message: 'Email drafted successfully',
    };
  } catch (error) {
    console.error('Error composing email:', error);
    return {
      success: false,
      message: 'Failed to compose email',
    };
  }
}

/**
 * Generate email reply suggestions
 */
export async function generateReplySuggestions(params: {
  originalSubject: string;
  originalBody: string;
  senderName?: string;
}): Promise<{ success: boolean; suggestions: string[]; message: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        suggestions: [],
        message: 'OpenAI API key not configured',
      };
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an email assistant. Generate 3-4 short, appropriate reply suggestions based on the email content. Each suggestion should be 1-5 words. Return as a JSON array of strings.',
        },
        {
          role: 'user',
          content: `Email subject: ${params.originalSubject}\nEmail body: ${params.originalBody}\n\nGenerate reply suggestions.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        suggestions: [],
        message: 'Failed to generate suggestions',
      };
    }

    const suggestions = JSON.parse(content);

    return {
      success: true,
      suggestions,
      message: 'Generated reply suggestions',
    };
  } catch (error) {
    console.error('Error generating reply suggestions:', error);
    return {
      success: false,
      suggestions: [],
      message: 'Failed to generate suggestions',
    };
  }
}
