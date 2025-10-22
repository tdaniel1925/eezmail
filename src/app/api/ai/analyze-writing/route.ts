import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface WritingAnalysis {
  tone: 'professional' | 'casual' | 'formal' | 'friendly';
  readability: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  wordCount: number;
  suggestions: Array<{
    type: 'brevity' | 'clarity' | 'grammar' | 'tone';
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

function calculateReadability(text: string): number {
  // Flesch Reading Ease score
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const score =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  return Math.max(0, Math.min(100, score));
}

function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
    }

    // Calculate word count
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

    // Calculate readability
    const readability = calculateReadability(text);

    // Use AI to analyze tone, sentiment, and provide suggestions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a writing coach. Analyze the given email text and provide:
1. Tone (professional, casual, formal, or friendly)
2. Sentiment (positive, neutral, or negative)
3. Up to 3 actionable suggestions for improvement

Format your response as JSON with this structure:
{
  "tone": "professional" | "casual" | "formal" | "friendly",
  "sentiment": "positive" | "neutral" | "negative",
  "suggestions": [
    {
      "type": "brevity" | "clarity" | "grammar" | "tone",
      "message": "specific suggestion",
      "severity": "info" | "warning" | "error"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const aiAnalysis = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    );

    const analysis: WritingAnalysis = {
      tone: aiAnalysis.tone || 'professional',
      sentiment: aiAnalysis.sentiment || 'neutral',
      readability,
      wordCount,
      suggestions: aiAnalysis.suggestions || [],
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Writing analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
