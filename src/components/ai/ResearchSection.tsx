'use client';

import { useState, useEffect } from 'react';
import { Search, Mail, AlertCircle, Lightbulb, Loader2 } from 'lucide-react';
import type { Email } from '@/db/schema';

interface ResearchSectionProps {
  email: Email | null;
}

interface ResearchData {
  relatedEmails?: Array<{
    id: string;
    subject: string;
    date: string;
  }>;
  unansweredCount?: number;
  suggestedResponse?: string;
}

export function ResearchSection({ email }: ResearchSectionProps): JSX.Element {
  const [research, setResearch] = useState<ResearchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      setResearch(null);
      return;
    }

    // Simulated research data - in real app, fetch from API
    const fetchResearch = async () => {
      setIsLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 600));

      setResearch({
        relatedEmails: [
          {
            id: '1',
            subject: 'Re: Previous discussion',
            date: '2 days ago',
          },
          {
            id: '2',
            subject: 'Similar topic from last week',
            date: '1 week ago',
          },
        ],
        unansweredCount: 3,
        suggestedResponse: 'Based on your previous replies, consider...',
      });

      setIsLoading(false);
    };

    fetchResearch();
  }, [email?.id]);

  if (!email) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Select an email to see research
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Researching context...</span>
        </div>
      </div>
    );
  }

  if (!research) return null;

  return (
    <div className="space-y-3 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Contextual Research
      </h3>

      {/* Related Emails */}
      {research.relatedEmails && research.relatedEmails.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center space-x-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
            <Search className="h-3.5 w-3.5" />
            <span>Related Emails</span>
          </h4>
          <div className="space-y-1">
            {research.relatedEmails.map((relatedEmail) => (
              <div
                key={relatedEmail.id}
                className="cursor-pointer rounded-md border border-gray-200 p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {relatedEmail.subject}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {relatedEmail.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unanswered Count */}
      {research.unansweredCount && research.unansweredCount > 0 && (
        <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-900/20">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <div>
              <div className="text-sm font-medium text-orange-900 dark:text-orange-300">
                {research.unansweredCount} pending replies
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                From this sender
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Response */}
      {research.suggestedResponse && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
          <div className="mb-1 flex items-center space-x-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">
            <Lightbulb className="h-3.5 w-3.5" />
            <span>AI Suggestion</span>
          </div>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {research.suggestedResponse}
          </p>
        </div>
      )}
    </div>
  );
}
