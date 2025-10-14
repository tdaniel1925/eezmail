'use client';

import { useState } from 'react';
import { ScreenerCard } from '@/components/screener/ScreenerCard';
import type { Email } from '@/db/schema';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock unscreened emails
const mockUnscreenedEmails: Email[] = [
  {
    id: '10',
    accountId: 'account-1',
    messageId: 'msg-10',
    nylasMessageId: null,
    providerMessageId: null,
    threadId: 'thread-10',
    subject: 'Exclusive offer: 50% off Premium',
    snippet:
      'Limited time offer! Get 50% off our Premium plan for 3 months. Transform your workflow with our advanced features...',
    fromAddress: {
      email: 'sales@startup.com',
      name: 'ProductivityApp',
    },
    toAddresses: [{ email: 'me@example.com', name: 'Me' }],
    ccAddresses: [],
    bccAddresses: [],
    replyTo: [],
    bodyText: 'Limited time offer...',
    bodyHtml: '<div>Limited time offer...</div>',
    receivedAt: new Date('2025-10-13T09:15:00'),
    sentAt: new Date('2025-10-13T09:15:00'),
    isRead: false,
    isStarred: false,
    isImportant: false,
    isDraft: false,
    hasDrafts: false,
    hasAttachments: false,
    folderName: 'inbox',
    labelIds: [],
    screeningStatus: 'pending',
    heyView: null,
    contactStatus: 'unknown',
    replyLaterUntil: null,
    replyLaterNote: null,
    setAsideAt: null,
    trackersBlocked: 8,
    aiSummary: 'Promotional email offering a discount on a subscription plan.',
    aiQuickReplies: [],
    aiSmartActions: [],
    aiGeneratedAt: new Date('2025-10-13T09:16:00'),
    aiCategory: 'newsletter',
    aiPriority: 'low',
    aiSentiment: 'positive',
    searchVector: null,
    createdAt: new Date('2025-10-13T09:15:00'),
    updatedAt: new Date('2025-10-13T09:15:00'),
  },
  {
    id: '11',
    accountId: 'account-1',
    messageId: 'msg-11',
    nylasMessageId: null,
    providerMessageId: null,
    threadId: 'thread-11',
    subject: 'Collaboration opportunity',
    snippet:
      'Hi! I came across your profile and thought we could collaborate on an exciting project...',
    fromAddress: {
      email: 'jane@designstudio.com',
      name: 'Jane Smith',
    },
    toAddresses: [{ email: 'me@example.com', name: 'Me' }],
    ccAddresses: [],
    bccAddresses: [],
    replyTo: [],
    bodyText: 'Hi! I came across your profile...',
    bodyHtml: '<p>Hi! I came across your profile...</p>',
    receivedAt: new Date('2025-10-13T11:00:00'),
    sentAt: new Date('2025-10-13T11:00:00'),
    isRead: false,
    isStarred: false,
    isImportant: false,
    isDraft: false,
    hasDrafts: false,
    hasAttachments: false,
    folderName: 'inbox',
    labelIds: [],
    screeningStatus: 'pending',
    heyView: null,
    contactStatus: 'unknown',
    replyLaterUntil: null,
    replyLaterNote: null,
    setAsideAt: null,
    trackersBlocked: 0,
    aiSummary:
      'Collaboration request from a designer interested in working together on a project.',
    aiQuickReplies: [],
    aiSmartActions: [],
    aiGeneratedAt: new Date('2025-10-13T11:01:00'),
    aiCategory: 'personal',
    aiPriority: 'medium',
    aiSentiment: 'positive',
    searchVector: null,
    createdAt: new Date('2025-10-13T11:00:00'),
    updatedAt: new Date('2025-10-13T11:00:00'),
  },
];

export default function ScreenerPage(): JSX.Element {
  const [unscreenedEmails, setUnscreenedEmails] =
    useState<Email[]>(mockUnscreenedEmails);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentEmail = unscreenedEmails[currentIndex];
  const remaining = unscreenedEmails.length - currentIndex;

  const handleDecision = (
    emailId: string,
    decision: 'imbox' | 'feed' | 'paper_trail' | 'block'
  ): void => {
    // Remove the email from unscreened list
    setUnscreenedEmails((prev) => prev.filter((email) => email.id !== emailId));

    // TODO: Save decision to database
    console.log(`Email ${emailId} routed to: ${decision}`);

    // If we removed the last email in the list, go back one
    if (currentIndex >= unscreenedEmails.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (): void => {
    if (currentIndex < unscreenedEmails.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = (): void => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (unscreenedEmails.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            All caught up!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You've screened all new senders. Great job!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/50 px-6 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              👋 Screener
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Screen new senders before they reach your inbox
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              {remaining} sender{remaining !== 1 ? 's' : ''} remaining
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative w-full">
          {/* Navigation Buttons */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 dark:bg-gray-950"
              aria-label="Previous sender"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === unscreenedEmails.length - 1}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100 dark:bg-gray-950"
              aria-label="Next sender"
            >
              <ChevronRight className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Screener Card */}
          {currentEmail && (
            <ScreenerCard
              key={currentEmail.id}
              email={currentEmail}
              onDecision={handleDecision}
            />
          )}
        </div>
      </div>

      {/* Footer - Progress Indicator */}
      <div className="border-t border-gray-200 bg-white/50 px-6 py-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/50">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-2">
            {unscreenedEmails.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-2 flex-1 rounded-full transition-all',
                  index < currentIndex
                    ? 'bg-primary'
                    : index === currentIndex
                      ? 'bg-primary/50'
                      : 'bg-gray-200 dark:bg-gray-800'
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Sender {currentIndex + 1} of {unscreenedEmails.length}
          </p>
        </div>
      </div>
    </div>
  );
}
