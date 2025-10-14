'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';
import { format } from 'date-fns';

interface ScreenerCardProps {
  email: Email;
  onDecision: (
    emailId: string,
    decision: 'imbox' | 'feed' | 'paper_trail' | 'block'
  ) => void;
}

export function ScreenerCard({
  email,
  onDecision,
}: ScreenerCardProps): JSX.Element {
  const [isExiting, setIsExiting] = useState(false);

  const handleDecision = (
    decision: 'imbox' | 'feed' | 'paper_trail' | 'block'
  ): void => {
    setIsExiting(true);
    setTimeout(() => {
      onDecision(email.id, decision);
    }, 300);
  };

  const senderName = email.fromAddress.name || email.fromAddress.email;
  const aiSuggestion =
    email.aiCategory === 'newsletter'
      ? 'feed'
      : email.aiCategory === 'receipt'
        ? 'paper_trail'
        : 'imbox';
  const confidence = 85; // Mock AI confidence

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-2xl rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 dark:border-gray-800 dark:bg-gray-950',
        isExiting && 'translate-x-[-100%] opacity-0'
      )}
    >
      {/* Sender Info */}
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-600 text-2xl font-bold text-white">
          {senderName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="mb-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {senderName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {email.fromAddress.email}
          </p>
        </div>
      </div>

      {/* Email Preview */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
          {email.subject}
        </h3>
        <p className="line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
          {email.snippet}
        </p>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
          Received {format(new Date(email.receivedAt), 'MMM d, h:mm a')}
        </p>
      </div>

      {/* AI Suggestion */}
      <div className="mb-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold text-primary">AI Suggestion</span>
          <span className="ml-auto text-xs font-medium text-primary/80">
            {confidence}% confident
          </span>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {aiSuggestion === 'imbox' &&
            'This looks like an important email from someone you may want to hear from. Consider adding to Imbox.'}
          {aiSuggestion === 'feed' &&
            'This appears to be a newsletter or promotional email. Consider routing to The Feed.'}
          {aiSuggestion === 'paper_trail' &&
            'This looks like a receipt or transactional email. Consider routing to Paper Trail.'}
        </p>
      </div>

      {/* Decision Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleDecision('imbox')}
          className={cn(
            'group relative flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white transition-all hover:scale-105 hover:shadow-lg dark:bg-gray-950',
            aiSuggestion === 'imbox'
              ? 'border-imbox-gold bg-imbox-gold/5'
              : 'border-gray-200 hover:border-imbox-gold/50 dark:border-gray-800'
          )}
        >
          <span className="text-2xl">✨</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Yes – Imbox
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Important
          </span>
          {aiSuggestion === 'imbox' && (
            <div className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
              AI Pick
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleDecision('feed')}
          className={cn(
            'group relative flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white transition-all hover:scale-105 hover:shadow-lg dark:bg-gray-950',
            aiSuggestion === 'feed'
              ? 'border-feed-green bg-feed-green/5'
              : 'border-gray-200 hover:border-feed-green/50 dark:border-gray-800'
          )}
        >
          <span className="text-2xl">📰</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            The Feed
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Newsletter
          </span>
          {aiSuggestion === 'feed' && (
            <div className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
              AI Pick
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleDecision('paper_trail')}
          className={cn(
            'group relative flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 bg-white transition-all hover:scale-105 hover:shadow-lg dark:bg-gray-950',
            aiSuggestion === 'paper_trail'
              ? 'border-paper-blue bg-paper-blue/5'
              : 'border-gray-200 hover:border-paper-blue/50 dark:border-gray-800'
          )}
        >
          <span className="text-2xl">🧾</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Paper Trail
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Receipts
          </span>
          {aiSuggestion === 'paper_trail' && (
            <div className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
              AI Pick
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleDecision('block')}
          className="group flex h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white transition-all hover:scale-105 hover:border-red-300 hover:bg-red-50 hover:shadow-lg dark:border-gray-800 dark:bg-gray-950 dark:hover:border-red-900 dark:hover:bg-red-900/10"
        >
          <X className="h-6 w-6 text-gray-400 group-hover:text-red-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Block
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Never see again
          </span>
        </button>
      </div>

      {/* View All Emails Link */}
      <button
        type="button"
        className="mt-4 w-full text-center text-sm text-primary hover:underline"
      >
        View all 3 emails from this sender
      </button>
    </div>
  );
}
