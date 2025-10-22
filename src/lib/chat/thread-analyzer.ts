'use server';

import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ThreadSummary {
  success: boolean;
  summary: string;
  keyPoints: string[];
  actionItems: Array<{
    task: string;
    assignee?: string;
    deadline?: Date | null;
    status: 'pending' | 'mentioned' | 'completed';
  }>;
  participants: string[];
  timeline: Array<{
    date: Date;
    sender: string;
    mainPoint: string;
  }>;
}

/**
 * Analyze and summarize an entire email thread
 */
export async function summarizeThread(params: {
  userId: string;
  threadId: string;
}): Promise<ThreadSummary> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        summary: 'AI features are not configured.',
        keyPoints: [],
        actionItems: [],
        participants: [],
        timeline: [],
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== params.userId) {
      return {
        success: false,
        summary: 'Unauthorized',
        keyPoints: [],
        actionItems: [],
        participants: [],
        timeline: [],
      };
    }

    // Get all emails in the thread
    const threadEmails = await db.query.emails.findMany({
      where: eq(emails.threadId, params.threadId),
      orderBy: (emails, { asc }) => [asc(emails.receivedAt)],
    });

    if (threadEmails.length === 0) {
      return {
        success: false,
        summary: 'No emails found in this thread.',
        keyPoints: [],
        actionItems: [],
        participants: [],
        timeline: [],
      };
    }

    // Extract unique participants
    const participantSet = new Set<string>();
    threadEmails.forEach((email) => {
      const from = email.fromAddress as any;
      if (from?.name) participantSet.add(from.name);
      else if (from?.email) participantSet.add(from.email);
    });
    const participants = Array.from(participantSet);

    // Build timeline
    const timeline = threadEmails.map((email) => {
      const from = email.fromAddress as any;
      return {
        date: new Date(email.receivedAt),
        sender: from?.name || from?.email || 'Unknown',
        mainPoint: email.snippet || email.subject || 'No content',
      };
    });

    // Prepare thread content for AI analysis
    const threadContent = threadEmails.map((email, index) => {
      const from = email.fromAddress as any;
      return {
        messageNumber: index + 1,
        from: from?.name || from?.email || 'Unknown',
        date: new Date(email.receivedAt).toLocaleString(),
        subject: email.subject,
        body:
          email.bodyText?.substring(0, 1000) || email.snippet || 'No content',
      };
    });

    // Ask GPT to analyze the thread (optimized for speed)
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // 2-3x faster than gpt-4
      messages: [
        {
          role: 'system',
          content: `Analyze email thread. Return JSON with: summary (2-3 sentences), keyPoints (array), actionItems (array with task, assignee, deadline, status fields). Plain text only.`,
        },
        {
          role: 'user',
          content: `Analyze:\n${JSON.stringify(threadContent, null, 2)}\nReturn JSON: {"summary":"...","keyPoints":[],"actionItems":[]}`,
        },
      ],
      temperature: 0.5, // Lower for speed
      max_tokens: 600, // Reduced from 800 for speed
      response_format: { type: 'json_object' }, // Force JSON response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        summary: 'Failed to analyze thread.',
        keyPoints: [],
        actionItems: [],
        participants,
        timeline,
      };
    }

    // Parse JSON response
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch {
      // If JSON parsing fails, extract what we can
      return {
        success: true,
        summary: content,
        keyPoints: [],
        actionItems: [],
        participants,
        timeline,
      };
    }

    // Convert action items with date strings to Date objects
    const actionItems = (analysis.actionItems || []).map((item: any) => ({
      task: item.task,
      assignee: item.assignee || undefined,
      deadline: item.deadline ? new Date(item.deadline) : null,
      status: item.status || 'pending',
    }));

    return {
      success: true,
      summary: stripMarkdown(analysis.summary || 'No summary available'),
      keyPoints: (analysis.keyPoints || []).map(stripMarkdown),
      actionItems,
      participants,
      timeline,
    };
  } catch (error) {
    console.error('Error analyzing thread:', error);
    return {
      success: false,
      summary: 'Failed to analyze thread. Please try again.',
      keyPoints: [],
      actionItems: [],
      participants: [],
      timeline: [],
    };
  }
}

/**
 * Strip markdown formatting
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}
