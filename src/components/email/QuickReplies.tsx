'use client';

import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickRepliesProps {
  emailId: string;
  subject: string;
  bodyText: string;
  onReplySelect: (reply: string) => void;
}

export function QuickReplies({
  emailId,
  subject,
  bodyText,
  onReplySelect,
}: QuickRepliesProps): JSX.Element {
  const [replies, setReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate quick replies on component mount
  useEffect(() => {
    generateReplies();
  }, [emailId]);

  const generateReplies = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/quick-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          bodyText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate quick replies');
      }

      const data = await response.json();

      if (data.success && data.replies) {
        setReplies(data.replies);
      }
    } catch (error) {
      console.error('Error generating quick replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
        <Zap className="h-3 w-3 animate-pulse" />
        <span>Generating quick replies...</span>
      </div>
    );
  }

  if (replies.length === 0) {
    return <></>;
  }

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300">
          Quick Replies
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {replies.map((reply, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onReplySelect(reply)}
            className={cn(
              'rounded-full border-2 border-purple-300 dark:border-purple-500/40 bg-white dark:bg-purple-500/20 px-4 py-2',
              'text-sm text-purple-700 dark:text-purple-300',
              'transition-all duration-200',
              'hover:bg-purple-100 dark:hover:bg-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500/60',
              'active:scale-95'
            )}
          >
            {reply}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">
        Click to open composer with this reply
      </p>
    </div>
  );
}

