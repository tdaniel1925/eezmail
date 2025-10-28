'use server';

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FeedbackAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  summary?: string;
}

/**
 * Analyze feedback using OpenAI GPT-4
 */
export async function analyzeFeedback(params: {
  title: string;
  description: string;
}): Promise<FeedbackAnalysis> {
  try {
    const prompt = `Analyze this user feedback and provide:
1. Sentiment: positive, neutral, or negative
2. Tags: 3-5 relevant tags/categories (e.g., "ui", "performance", "feature-request", "bug", "usability")
3. Priority: low, medium, or high based on urgency and impact
4. A brief summary (1 sentence)

Feedback Title: ${params.title}
Feedback Description: ${params.description}

Respond in JSON format with this structure:
{
  "sentiment": "positive|neutral|negative",
  "tags": ["tag1", "tag2", "tag3"],
  "priority": "low|medium|high",
  "summary": "One sentence summary"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant helping analyze user feedback for a SaaS product. Provide accurate, concise analysis.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      sentiment: result.sentiment || 'neutral',
      tags: result.tags || [],
      priority: result.priority || 'medium',
      summary: result.summary,
    };
  } catch (error) {
    console.error('Failed to analyze feedback with AI:', error);
    // Fallback to basic analysis
    return {
      sentiment: 'neutral',
      tags: ['uncategorized'],
      priority: 'medium',
    };
  }
}

/**
 * Group similar feedback items using AI
 */
export async function groupSimilarFeedback(
  feedbackItems: Array<{ id: string; title: string; description: string }>
): Promise<Array<{ groupName: string; feedbackIds: string[] }>> {
  try {
    const prompt = `Analyze these feedback items and group similar ones together. Create meaningful group names.

Feedback Items:
${feedbackItems.map((f, i) => `${i + 1}. [${f.id}] ${f.title}\n   ${f.description.substring(0, 100)}...`).join('\n\n')}

Respond in JSON format with this structure:
{
  "groups": [
    {
      "groupName": "Descriptive group name",
      "feedbackIds": ["id1", "id2"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant helping categorize and group user feedback.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.groups || [];
  } catch (error) {
    console.error('Failed to group feedback with AI:', error);
    return [];
  }
}

/**
 * Extract themes and patterns from feedback
 */
export async function extractFeedbackThemes(
  feedbackItems: Array<{ title: string; description: string }>
): Promise<{
  topThemes: string[];
  commonIssues: string[];
  topRequests: string[];
  overallSentiment: string;
}> {
  try {
    const prompt = `Analyze this collection of user feedback and identify:
1. Top 5 themes or topics
2. Top 5 common issues reported
3. Top 5 most requested features
4. Overall sentiment trend

Feedback Collection:
${feedbackItems.map((f, i) => `${i + 1}. ${f.title}\n   ${f.description.substring(0, 150)}...`).join('\n\n')}

Respond in JSON format with this structure:
{
  "topThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "commonIssues": ["issue1", "issue2", "issue3", "issue4", "issue5"],
  "topRequests": ["request1", "request2", "request3", "request4", "request5"],
  "overallSentiment": "Positive|Mixed|Negative with brief explanation"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant helping analyze user feedback trends and patterns.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      topThemes: result.topThemes || [],
      commonIssues: result.commonIssues || [],
      topRequests: result.topRequests || [],
      overallSentiment: result.overallSentiment || 'Mixed',
    };
  } catch (error) {
    console.error('Failed to extract themes with AI:', error);
    return {
      topThemes: [],
      commonIssues: [],
      topRequests: [],
      overallSentiment: 'Unable to analyze',
    };
  }
}

