'use server';

import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import { advancedEmailSearch } from './email-search';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyze emails to answer questions
 */
export async function analyzeEmails(params: {
  userId: string;
  question: string;
  searchQuery?: string;
  sender?: string;
  timeframe?: string;
}): Promise<{
  success: boolean;
  answer: string;
  relevantEmails?: any[];
  sources?: string[];
}> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        answer: 'AI features are not configured. Please set up OpenAI API key.',
        relevantEmails: [],
        sources: [],
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return {
        success: false,
        answer: 'Unauthorized',
        relevantEmails: [],
        sources: [],
      };
    }

    // Build search parameters
    const searchParams: any = { userId: params.userId, limit: 20 };

    if (params.sender) searchParams.sender = params.sender;
    if (params.searchQuery) searchParams.query = params.searchQuery;

    if (params.timeframe) {
      const now = new Date();
      switch (params.timeframe) {
        case 'today':
          searchParams.startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          searchParams.startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          searchParams.startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          searchParams.startDate = new Date(
            now.setFullYear(now.getFullYear() - 1)
          );
          break;
      }
    }

    // Search for relevant emails
    const emails = await advancedEmailSearch(searchParams);

    if (emails.length === 0) {
      return {
        success: true,
        answer:
          "I couldn't find any relevant emails to answer that question. Try rephrasing or expanding the time range.",
        relevantEmails: [],
        sources: [],
      };
    }

    // Prepare email content for AI analysis
    const emailContext = emails.slice(0, 10).map((email) => ({
      from: `${email.fromAddress?.name || 'Unknown'} <${email.fromAddress?.email || 'unknown'}>`,
      subject: email.subject || 'No subject',
      date: email.receivedAt
        ? new Date(email.receivedAt).toLocaleDateString()
        : 'Unknown date',
      snippet: email.snippet || 'No content',
    }));

    // Ask GPT-4 to analyze and answer
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a user's emails to answer their question. Be specific and cite which emails you're referencing (by sender and date). Keep answers concise but informative. Do not use markdown formatting - use plain text with bullet points (•) and line breaks for structure.`,
        },
        {
          role: 'user',
          content: `Question: ${params.question}\n\nRelevant emails:\n${JSON.stringify(emailContext, null, 2)}\n\nAnswer the question based on these emails. Cite specific emails when referencing information. Use plain text formatting (no markdown).`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer =
      response.choices[0]?.message?.content ||
      'I had trouble analyzing the emails.';

    // Strip any markdown that might have slipped through
    const cleanAnswer = stripMarkdown(answer);

    return {
      success: true,
      answer: cleanAnswer,
      relevantEmails: emails.slice(0, 5),
      sources: emails
        .slice(0, 5)
        .map(
          (e) => `${e.fromAddress?.name || e.fromAddress?.email} - ${e.subject}`
        ),
    };
  } catch (error) {
    console.error('Error analyzing emails:', error);
    return {
      success: false,
      answer: 'Sorry, I had trouble analyzing your emails. Please try again.',
      relevantEmails: [],
      sources: [],
    };
  }
}

/**
 * Strip markdown formatting from text
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove code
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Remove links
}
