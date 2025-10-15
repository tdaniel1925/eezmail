/**
 * OpenAI Client Configuration
 * Handles AI-powered email analysis, screening, and smart features
 */

import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * AI Models for different tasks
 */
export const AI_MODELS = {
  FAST: 'gpt-4o-mini', // Fast, cost-effective for screening
  SMART: 'gpt-4o', // More capable for complex analysis
} as const;
