import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Helper function to generate AI analysis
export async function generateAIAnalysis(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const {
    model = 'claude-3-5-sonnet-20241022',
    maxTokens = 2000,
    temperature = 0.7,
  } = options || {};

  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const textContent = message.content.find((c) => c.type === 'text');
  return textContent && 'text' in textContent ? textContent.text : '';
}

