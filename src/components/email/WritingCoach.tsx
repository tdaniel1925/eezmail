'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  X,
} from 'lucide-react';

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

interface WritingCoachProps {
  content: string;
  onClose?: () => void;
}

export function WritingCoach({ content, onClose }: WritingCoachProps) {
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content || content.length < 10) {
      setAnalysis(null);
      return;
    }

    const analyzeContent = async () => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const response = await fetch('/api/ai/analyze-writing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: content }),
        });

        if (!response.ok) {
          throw new Error('Analysis failed');
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError('Failed to analyze writing');
        console.error('Writing analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Debounce analysis
    const timer = setTimeout(analyzeContent, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  if (!content || content.length < 10) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Writing Coach
          </h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Start typing to get real-time writing suggestions...
        </p>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Writing Coach
          </h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>Reading and thinking...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Writing Coach
          </h3>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (!analysis) {
    return null;
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'professional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'casual':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'formal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'friendly':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getReadabilityLabel = (score: number) => {
    if (score >= 80) return 'Very Easy';
    if (score >= 60) return 'Easy';
    if (score >= 50) return 'Moderate';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Writing Coach
        </h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Tone</p>
          <Badge className={getToneColor(analysis.tone)}>{analysis.tone}</Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
          <div className="flex items-center gap-1">
            {getSentimentIcon(analysis.sentiment)}
            <span className="text-sm capitalize">{analysis.sentiment}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Readability</p>
          <div className="text-sm font-medium">
            {analysis.readability.toFixed(0)}/100
            <span className="text-xs text-muted-foreground ml-1">
              ({getReadabilityLabel(analysis.readability)})
            </span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Words</p>
          <div className="text-sm font-medium">{analysis.wordCount}</div>
        </div>
      </div>

      {/* Suggestions */}
      {analysis.suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Suggestions
          </p>
          {analysis.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`text-xs p-2 rounded-md border ${
                suggestion.severity === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
                  : suggestion.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200'
                    : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200'
              }`}
            >
              <span className="font-medium capitalize">{suggestion.type}:</span>{' '}
              {suggestion.message}
            </div>
          ))}
        </div>
      )}

      {analysis.suggestions.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Looks great! No suggestions.</span>
        </div>
      )}
    </Card>
  );
}
