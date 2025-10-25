import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, emailAccounts, emailThreads } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/threads/[threadId]/summary
 * Generate AI summary of an email thread
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;

    if (!threadId) {
      return NextResponse.json({ error: 'Thread ID required' }, { status: 400 });
    }

    console.log(`🤖 [Thread Summary] Generating summary for thread: ${threadId}`);

    // Get user's email accounts
    const userAccounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
    });

    if (userAccounts.length === 0) {
      return NextResponse.json({ error: 'No email accounts found' }, { status: 404 });
    }

    const accountIds = userAccounts.map((acc) => acc.id);

    // Fetch all emails in this thread
    const threadEmails = await db
      .select({
        id: emails.id,
        subject: emails.subject,
        fromAddress: emails.fromAddress,
        toAddresses: emails.toAddresses,
        bodyText: emails.bodyText,
        sentAt: emails.sentAt,
        receivedAt: emails.receivedAt,
      })
      .from(emails)
      .where(
        and(
          eq(emails.threadId, threadId),
          inArray(emails.accountId, accountIds)
        )
      )
      .orderBy(emails.sentAt);

    if (threadEmails.length === 0) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // Check if we have a cached summary in email_threads table
    const existingThread = await db.query.emailThreads.findFirst({
      where: and(
        eq(emailThreads.threadId, threadId),
        inArray(emailThreads.accountId, accountIds)
      ),
    });

    // If we have a recent summary (less than 1 hour old), return it
    if (existingThread?.aiThreadSummary && existingThread.aiGeneratedAt) {
      const hourAgo = Date.now() - 60 * 60 * 1000;
      const summaryAge = new Date(existingThread.aiGeneratedAt).getTime();
      
      if (summaryAge > hourAgo) {
        console.log('✅ [Thread Summary] Returning cached summary');
        return NextResponse.json({
          success: true,
          summary: existingThread.aiThreadSummary,
          keyPoints: existingThread.aiKeyPoints || [],
          actionItems: existingThread.aiActionItems || [],
          cached: true,
        });
      }
    }

    // Build conversation text for AI
    const conversationText = threadEmails
      .map((email, index) => {
        const from =
          typeof email.fromAddress === 'object'
            ? (email.fromAddress as any).name || (email.fromAddress as any).email
            : 'Unknown';
        const date = new Date(email.sentAt || email.receivedAt).toLocaleString();
        const body = email.bodyText || '';

        return `
--- Message ${index + 1} ---
From: ${from}
Date: ${date}
Body: ${body.substring(0, 1000)}${body.length > 1000 ? '...' : ''}
`;
      })
      .join('\n');

    // Generate AI summary
    console.log('🤖 [Thread Summary] Calling OpenAI for summary...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that summarizes email threads. 
Provide:
1. A concise summary (2-3 sentences) of the entire conversation
2. Key points (3-5 bullet points)
3. Action items if any (who needs to do what)

Format your response as JSON:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "actionItems": [{"task": "...", "assignee": "...", "status": "pending"}]
}`,
        },
        {
          role: 'user',
          content: `Summarize this email thread (${threadEmails.length} messages):\n\n${conversationText}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(
      completion.choices[0].message.content || '{}'
    );

    console.log('✅ [Thread Summary] Summary generated');

    // Cache the summary in email_threads table (upsert)
    if (existingThread) {
      await db
        .update(emailThreads)
        .set({
          aiThreadSummary: aiResponse.summary,
          aiKeyPoints: aiResponse.keyPoints || [],
          aiActionItems: aiResponse.actionItems || [],
          aiGeneratedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailThreads.id, existingThread.id));
    } else {
      // Create new thread record
      const firstEmail = threadEmails[0];
      const lastEmail = threadEmails[threadEmails.length - 1];

      await db.insert(emailThreads).values({
        accountId: accountIds[0],
        threadId: threadId,
        subject: firstEmail.subject,
        snippet: firstEmail.bodyText?.substring(0, 200) || null,
        participants: [firstEmail.fromAddress],
        messageCount: threadEmails.length,
        unreadCount: 0,
        firstMessageAt: firstEmail.sentAt || firstEmail.receivedAt,
        lastMessageAt: lastEmail.sentAt || lastEmail.receivedAt,
        hasAttachments: false,
        hasDrafts: false,
        isStarred: false,
        aiThreadSummary: aiResponse.summary,
        aiKeyPoints: aiResponse.keyPoints || [],
        aiActionItems: aiResponse.actionItems || [],
        aiGeneratedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      summary: aiResponse.summary,
      keyPoints: aiResponse.keyPoints || [],
      actionItems: aiResponse.actionItems || [],
      cached: false,
    });
  } catch (error) {
    console.error('❌ [Thread Summary Error]:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
