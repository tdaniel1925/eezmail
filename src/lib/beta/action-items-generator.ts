'use server';

import OpenAI from 'openai';
import { db } from '@/lib/db';
import { betaFeedback, betaActionItems } from '@/db/schema';
import { extractFeedbackThemes } from './ai-analyzer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ActionItemSuggestion {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  impactScore: number; // 1-10
  effortEstimate: 'small' | 'medium' | 'large';
  suggestedSolution: string;
  relatedFeedbackIds: string[];
}

/**
 * Generate action items from feedback using AI
 */
export async function generateActionItems(): Promise<{
  success: boolean;
  actionItems?: ActionItemSuggestion[];
  error?: string;
}> {
  try {
    // Get all unprocessed feedback
    const feedbackItems = await db.select().from(betaFeedback);

    if (feedbackItems.length === 0) {
      return { success: true, actionItems: [] };
    }

    // Extract themes first
    const themes = await extractFeedbackThemes(
      feedbackItems.map((f) => ({ title: f.title, description: f.description }))
    );

    // Generate action items based on feedback
    const prompt = `Based on this user feedback analysis, generate actionable development tasks.

Top Themes: ${themes.topThemes.join(', ')}
Common Issues: ${themes.commonIssues.join(', ')}
Top Requests: ${themes.topRequests.join(', ')}

Recent Feedback:
${feedbackItems
  .slice(0, 20)
  .map((f) => `[${f.id}] ${f.title}\n   ${f.description.substring(0, 150)}...\n   Priority: ${f.priority || 'medium'}, Sentiment: ${f.sentiment || 'neutral'}`)
  .join('\n\n')}

Generate 5-10 actionable development tasks that would address the most important feedback.
For each task, provide:
1. Clear, actionable title
2. Detailed description
3. Priority (low/medium/high) based on impact and frequency
4. Impact score (1-10) - how much this would improve the product
5. Effort estimate (small/medium/large)
6. Suggested technical solution or approach
7. Related feedback IDs that this addresses (use the [ID] from above)

Respond in JSON format with this structure:
{
  "actionItems": [
    {
      "title": "Clear action item title",
      "description": "Detailed description of what needs to be done",
      "priority": "low|medium|high",
      "impactScore": 8,
      "effortEstimate": "small|medium|large",
      "suggestedSolution": "Technical approach or solution",
      "relatedFeedbackIds": ["id1", "id2"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a product manager and technical lead analyzing user feedback to create actionable development tasks. Be specific, technical, and prioritize based on impact.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const actionItems: ActionItemSuggestion[] = result.actionItems || [];

    // Store action items in database
    for (const item of actionItems) {
      await db.insert(betaActionItems).values({
        title: item.title,
        description: item.description,
        priority: item.priority,
        impactScore: item.impactScore,
        effortEstimate: item.effortEstimate,
        relatedFeedbackIds: item.relatedFeedbackIds,
        suggestedSolution: item.suggestedSolution,
        generatedByAi: true,
        status: 'todo',
      });
    }

    return { success: true, actionItems };
  } catch (error) {
    console.error('Failed to generate action items:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all action items from database
 */
export async function getActionItems() {
  return await db.select().from(betaActionItems).orderBy(betaActionItems.createdAt);
}

/**
 * Update action item status
 */
export async function updateActionItemStatus(
  id: string,
  status: 'todo' | 'in_progress' | 'done' | 'cancelled',
  assignedTo?: string
) {
  const updates: Partial<typeof betaActionItems.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  if (assignedTo) {
    updates.assignedTo = assignedTo;
  }

  if (status === 'done') {
    updates.completedAt = new Date();
  }

  await db.update(betaActionItems).set(updates);

  return { success: true };
}

