import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { db } from '@/lib/db';
import { emails } from '@/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Score an email's priority/importance from 1-10
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
    const { emailId, subject, bodyText, senderEmail, hasAttachments } = body;

    if (!emailId && (!subject || !bodyText)) {
      return NextResponse.json(
        { error: 'Email ID or content is required' },
        { status: 400 }
      );
    }

    let emailData: any = { subject, bodyText, senderEmail, hasAttachments };

    // If emailId provided, fetch from database
    if (emailId) {
      const email = await db.query.emails.findFirst({
        where: eq(emails.id, emailId),
      });

      if (!email) {
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }

      // Check if priority already scored
      if (email.aiPriority) {
        const priorityMap: Record<string, number> = {
          low: 3,
          medium: 5,
          high: 7,
          urgent: 9,
        };
        return NextResponse.json({
          success: true,
          score: priorityMap[email.aiPriority] || 5,
          priority: email.aiPriority,
          cached: true,
        });
      }

      emailData = {
        subject: email.subject,
        bodyText: email.bodyText || email.bodyHtml || '',
        senderEmail:
          typeof email.fromAddress === 'object' && email.fromAddress !== null
            ? (email.fromAddress as any).email
            : 'unknown',
        hasAttachments: email.hasAttachments,
      };
    }

    // Call OpenAI to score priority
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an email priority scorer. Analyze emails and return ONLY a single number from 1-10 indicating importance.

Scoring criteria:
- 9-10: Urgent/Critical (deadlines, emergencies, boss emails, time-sensitive)
- 7-8: Important (meeting requests, significant updates, key decisions)
- 4-6: Normal (regular work emails, general updates, FYIs)
- 1-3: Low (newsletters, marketing, non-urgent info, spam-like)

Consider:
- Urgency indicators (deadline, urgent, ASAP, today, now)
- Sender importance (boss, client, key stakeholder)
- Action required (decisions, approvals, requests)
- Keywords (important, critical, urgent, deadline, meeting)
- Attachments (adds slight importance)

Return ONLY the number, nothing else.`,
        },
        {
          role: 'user',
          content: `Subject: ${emailData.subject}
Sender: ${emailData.senderEmail}
Has Attachments: ${emailData.hasAttachments ? 'Yes' : 'No'}

Body:
${emailData.bodyText.substring(0, 1000)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const content = response.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'Failed to score priority' },
        { status: 500 }
      );
    }

    // Parse the score
    const score = parseInt(content, 10);

    if (isNaN(score) || score < 1 || score > 10) {
      return NextResponse.json(
        { error: 'Invalid priority score' },
        { status: 500 }
      );
    }

    // Map score to priority label
    let priority: 'low' | 'medium' | 'high' | 'urgent';
    if (score >= 9) {
      priority = 'urgent';
    } else if (score >= 7) {
      priority = 'high';
    } else if (score >= 4) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    // Cache the priority in database if emailId provided
    if (emailId) {
      await db
        .update(emails)
        .set({
          aiPriority: priority,
          updatedAt: new Date(),
        } as any)
        .where(eq(emails.id, emailId));
    }

    return NextResponse.json({
      success: true,
      score,
      priority,
      cached: false,
      indicator:
        score >= 9 ? '🔥' : score >= 7 ? '⚡' : score >= 4 ? '📄' : '💤',
    });
  } catch (error) {
    console.error('Error in score-priority API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



