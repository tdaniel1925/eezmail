/**
 * AI Attachment Description Service
 * Generates contextual descriptions for attachments using AI
 */

import OpenAI from 'openai';
import { getFileTypeLabel } from '../attachments/filter';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AttachmentContext {
  filename: string;
  contentType: string;
  size: number;
  emailSubject?: string;
  emailBodyPreview?: string;
  senderName?: string;
}

/**
 * Generate a base description without AI (fast, fallback)
 */
export function generateBaseDescription(context: AttachmentContext): string {
  const typeLabel = getFileTypeLabel(context.contentType);
  const sizeMB = (context.size / (1024 * 1024)).toFixed(2);
  const sizeKB = (context.size / 1024).toFixed(1);
  const sizeDisplay = context.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

  return `${typeLabel} file (${sizeDisplay})`;
}

/**
 * Generate an AI-enhanced description with email context
 */
export async function generateAIDescription(
  context: AttachmentContext
): Promise<string> {
  // If no OpenAI key, return base description
  if (!process.env.OPENAI_API_KEY) {
    console.warn('No OpenAI API key configured, using base description');
    return generateBaseDescription(context);
  }

  try {
    const typeLabel = getFileTypeLabel(context.contentType);
    const baseDesc = generateBaseDescription(context);

    // Build context prompt
    const contextParts: string[] = [];
    if (context.emailSubject) {
      contextParts.push(`Email subject: "${context.emailSubject}"`);
    }
    if (context.senderName) {
      contextParts.push(`From: ${context.senderName}`);
    }
    if (context.emailBodyPreview) {
      contextParts.push(`Email excerpt: "${context.emailBodyPreview.substring(0, 200)}"`);
    }

    const prompt = `Generate a brief, contextual description (max 100 characters) for this email attachment:

Filename: ${context.filename}
Type: ${typeLabel}
${contextParts.length > 0 ? contextParts.join('\n') : 'No email context available'}

Description should be informative and context-aware. Focus on what the attachment likely contains based on the filename and email context. Keep it concise and professional.

Examples:
- "Invoice for October services"
- "Product specifications document"
- "Meeting agenda for Q4 review"
- "Contract draft with revisions"

Description:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing file attachments and generating concise, helpful descriptions. Always respond with ONLY the description, no quotes or extra text.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    const aiDescription =
      completion.choices[0]?.message?.content?.trim() || baseDesc;

    // Clean up any quotes that might be added
    const cleanedDescription = aiDescription.replace(/^["']|["']$/g, '');

    // Ensure it's not too long
    if (cleanedDescription.length > 150) {
      return cleanedDescription.substring(0, 147) + '...';
    }

    return cleanedDescription;
  } catch (error) {
    console.error('Error generating AI description:', error);
    return generateBaseDescription(context);
  }
}

/**
 * Batch generate descriptions for multiple attachments
 */
export async function generateBatchDescriptions(
  contexts: AttachmentContext[]
): Promise<string[]> {
  // Process in parallel but limit concurrency to avoid rate limits
  const batchSize = 5;
  const results: string[] = [];

  for (let i = 0; i < contexts.length; i += batchSize) {
    const batch = contexts.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((context) => generateAIDescription(context))
    );
    results.push(...batchResults);
  }

  return results;
}

