import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { anthropic } from '@/lib/anthropic';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emails } = await req.json();

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    // Prepare email context for AI
    const emailContext = emails
      .map(
        (email: any, index: number) => `
Email ${index + 1}:
From: ${email.fromAddress?.name || email.fromAddress?.email || email.fromAddress || 'Unknown'}
Subject: ${email.subject}
Date: ${new Date(email.sentAt || email.receivedAt).toLocaleString()}
Content: ${email.bodyText || email.snippet || 'No content'}
---
`
      )
      .join('\n');

    const prompt = `Analyze this email thread and provide a detailed analysis. Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):

{
  "summary": "Brief 2-3 sentence summary of the thread",
  "sentiment": "positive" | "neutral" | "negative",
  "keyPoints": ["point1", "point2", "point3"],
  "conversationFlow": "Brief description of how the conversation progressed",
  "participants": ["email1@example.com", "email2@example.com"],
  "actionItems": [
    {
      "task": "Task description",
      "dueDate": "relative date like 'Next week' or 'ASAP' or null",
      "priority": "high" | "medium" | "low"
    }
  ],
  "decisions": ["decision1", "decision2"],
  "questions": ["question1", "question2"]
}

Email Thread:
${emailContext}

Remember: Return ONLY the JSON object, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // Clean the response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '');
    }

    const analysis = JSON.parse(cleanedResponse);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error('Error analyzing thread:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze thread',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
