'use server';

import { OpenAI } from 'openai';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, aiReplyDrafts } from '@/db/schema';
import { eq } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Start AI Reply workflow for an email
 */
export async function startAIReplyWorkflow(
  emailId: string
): Promise<{ success: boolean; draftId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the email
    const email = await db.query.emails.findFirst({
      where: eq(emails.id, emailId),
    });

    if (!email) {
      return { success: false, error: 'Email not found' };
    }

    // Generate clarifying questions
    const questions = await generateClarifyingQuestions(email as any);

    // Create draft record
    const draft = await db
      .insert(aiReplyDrafts)
      .values({
        emailId,
        userId: user.id,
        draftBody: '',
        draftSubject: `Re: ${email.subject}`,
        status: 'questioning',
        questions,
        conversationHistory: [
          {
            role: 'assistant',
            content:
              "I'm analyzing this email to craft a perfect reply. Let me ask a few questions first...",
          },
        ],
      } as any)
      .returning();

    return { success: true, draftId: draft[0].id };
  } catch (error) {
    console.error('Error starting AI reply workflow:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to start workflow',
    };
  }
}

/**
 * Generate clarifying questions using AI
 */
async function generateClarifyingQuestions(email: any): Promise<string[]> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an email assistant. Generate 3-5 clarifying questions to help write a better email reply. Make questions specific and actionable.',
        },
        {
          role: 'user',
          content: `Email from: ${email.fromAddress.name}\nSubject: ${email.subject}\nBody: ${email.bodyText}`,
        },
      ],
      functions: [
        {
          name: 'generate_questions',
          parameters: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of clarifying questions',
              },
            },
            required: ['questions'],
          },
        },
      ],
      function_call: { name: 'generate_questions' },
    });

    const functionCall = completion.choices[0].message.function_call;
    if (!functionCall) {
      return [
        'What is the main purpose of your reply?',
        'What tone would you like to use?',
        'Are there any specific details you want to include?',
      ];
    }

    const result = JSON.parse(functionCall.arguments);
    return result.questions;
  } catch (error) {
    console.error('Error generating questions:', error);
    return [
      'What is the main purpose of your reply?',
      'What tone would you like to use?',
      'Are there any specific details you want to include?',
    ];
  }
}

/**
 * Answer a question in the workflow
 */
export async function answerQuestion(
  draftId: string,
  questionIndex: number,
  answer: string
): Promise<{ success: boolean; allAnswered?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const draft = await db.query.aiReplyDrafts.findFirst({
      where: eq(aiReplyDrafts.id, draftId),
    });

    if (!draft) {
      return { success: false, error: 'Draft not found' };
    }

    // Update responses
    const responses = (draft.userResponses as Record<string, string>) || {};
    responses[questionIndex.toString()] = answer;

    await db
      .update(aiReplyDrafts)
      .set({
        userResponses: responses,
        updatedAt: new Date(),
      } as any)
      .where(eq(aiReplyDrafts.id, draftId));

    // Check if all questions answered
    const allAnswered =
      Object.keys(responses).length === (draft.questions as string[]).length;

    if (allAnswered) {
      await generateFinalDraft(draftId);
    }

    return { success: true, allAnswered };
  } catch (error) {
    console.error('Error answering question:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to answer question',
    };
  }
}

/**
 * Generate the final draft based on answers
 */
async function generateFinalDraft(draftId: string): Promise<void> {
  try {
    const draft = await db.query.aiReplyDrafts.findFirst({
      where: eq(aiReplyDrafts.id, draftId),
    });

    if (!draft) return;

    const email = await db.query.emails.findFirst({
      where: eq(emails.id, draft.emailId),
    });

    if (!email) return;

    // Build context from questions and answers
    const context = (draft.questions as string[])
      .map(
        (q, i) =>
          `Q: ${q}\nA: ${(draft.userResponses as Record<string, string>)?.[i.toString()] || 'N/A'}`
      )
      .join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional email writer. Create a detailed, contextual reply based on the original email and user responses. Be professional, clear, and concise.',
        },
        {
          role: 'user',
          content: `Original Email:\nFrom: ${(email.fromAddress as any).name}\nSubject: ${email.subject}\nBody: ${email.bodyText}\n\n${context}\n\nWrite a reply email.`,
        },
      ],
    });

    const draftBody = completion.choices[0].message.content || '';

    await db
      .update(aiReplyDrafts)
      .set({
        draftBody,
        status: 'ready',
        updatedAt: new Date(),
      } as any)
      .where(eq(aiReplyDrafts.id, draftId));
  } catch (error) {
    console.error('Error generating final draft:', error);
  }
}

/**
 * Update draft content
 */
export async function updateDraft(
  draftId: string,
  body: string,
  subject: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(aiReplyDrafts)
      .set({
        draftBody: body,
        draftSubject: subject,
        updatedAt: new Date(),
      } as any)
      .where(eq(aiReplyDrafts.id, draftId));

    return { success: true };
  } catch (error) {
    console.error('Error updating draft:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update draft',
    };
  }
}

/**
 * Regenerate draft with different parameters
 */
export async function regenerateDraft(
  draftId: string,
  tone?: string,
  length?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Update tone/length if provided
    if (tone || length) {
      await db
        .update(aiReplyDrafts)
        .set({
          tone: tone,
          length: length,
          status: 'drafting',
          updatedAt: new Date(),
        } as any)
        .where(eq(aiReplyDrafts.id, draftId));
    }

    // Regenerate the draft
    await generateFinalDraft(draftId);

    return { success: true };
  } catch (error) {
    console.error('Error regenerating draft:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to regenerate draft',
    };
  }
}
