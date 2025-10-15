/**
 * OpenAI Client Configuration
 * Handles AI-powered email analysis, screening, and smart features
 */

import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
// This allows the build to succeed even without the key
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

/**
 * AI Models for different tasks
 */
export const AI_MODELS = {
  FAST: 'gpt-4o-mini', // Fast, cost-effective for screening
  SMART: 'gpt-4o', // More capable for complex analysis
} as const;
