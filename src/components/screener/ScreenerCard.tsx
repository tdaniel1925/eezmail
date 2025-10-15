'use client';

import { useState, useRef } from 'react';
import {
  Sparkles,
  X,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Email, CustomFolder } from '@/db/schema';
import { format } from 'date-fns';
import { createCustomFolder } from '@/lib/folders/actions';
import { toast } from '@/lib/toast';

interface ScreenerCardProps {
  email: Email;
  userId: string;
  customFolders: CustomFolder[];
  onDecision: (
    emailId: string,
    decision: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | string
  ) => void;
}

export function ScreenerCard({
  email,
  userId,
  customFolders,
  onDecision,
}: ScreenerCardProps): JSX.Element {
  const [isExiting, setIsExiting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleDecision = (
    decision: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | string
  ): void => {
    setIsExiting(true);
    setTimeout(() => {
      onDecision(email.id, decision);
    }, 300);
  };

  const handleQuickCreate = async (): Promise<void> => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    setIsCreating(true);
    const result = await createCustomFolder({
      userId,
      name: newFolderName.trim(),
      icon: '📁',
      color: 'gray',
    });

    if (result.success && result.folderId) {
      toast.success('Folder created successfully');
      setShowCreateModal(false);
      setNewFolderName('');
      handleDecision(result.folderId);
    } else {
      toast.error(result.error || 'Failed to create folder');
    }
    setIsCreating(false);
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 212; // Width of one card (200px) plus gap (12px)
    const newScrollLeft =
      carouselRef.current.scrollLeft +
      (direction === 'right' ? scrollAmount : -scrollAmount);
    carouselRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const senderName = email.fromAddress.name || email.fromAddress.email;
  const aiSuggestion =
    email.aiCategory === 'newsletter'
      ? 'newsfeed'
      : email.aiCategory === 'receipt'
        ? 'receipts'
        : 'inbox';
  const confidence = 85; // Mock AI confidence

  // Default folders
  const defaultFolders = [
    {
      id: 'inbox',
      name: 'Inbox',
      emoji: '📥',
      description: 'Important',
      color: 'border-blue-500 bg-blue-50',
      hoverColor: 'hover:border-blue-600',
    },
    {
      id: 'newsfeed',
      name: 'NewsFeed',
      emoji: '📰',
      description: 'Newsletters',
      color: 'border-green-500 bg-green-50',
      hoverColor: 'hover:border-green-600',
    },
    {
      id: 'receipts',
      name: 'Receipts',
      emoji: '🧾',
      description: 'Financial',
      color: 'border-purple-500 bg-purple-50',
      hoverColor: 'hover:border-purple-600',
    },
    {
      id: 'spam',
      name: 'Spam',
      emoji: '❌',
      description: 'Block sender',
      color: 'border-red-500 bg-red-50',
      hoverColor: 'hover:border-red-600',
    },
  ];

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 dark:border-gray-700 dark:bg-gray-950',
        isExiting && 'translate-x-[-100%] opacity-0'
      )}
    >
      {/* Sender Info Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-600 text-xl font-bold text-white shadow-lg">
          {senderName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h2 className="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
            {senderName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {email.fromAddress.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {format(new Date(email.receivedAt), 'MMM d, yyyy')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {format(new Date(email.receivedAt), 'h:mm a')}
          </p>
        </div>
      </div>

      {/* Email Content */}
      <div className="px-6 py-4">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {email.subject}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {email.snippet}
        </p>
      </div>

      {/* AI Suggestion */}
      <div className="mx-6 mb-4 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-primary">
            AI Recommendation
          </span>
          <span className="ml-auto rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
            {confidence}%
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          {aiSuggestion === 'inbox' &&
            'Important email from someone you may want to hear from. Suggested: Inbox'}
          {aiSuggestion === 'newsfeed' &&
            'Newsletter or promotional email. Suggested: NewsFeed'}
          {aiSuggestion === 'receipts' &&
            'Receipt or transactional email. Suggested: Receipts'}
        </p>
      </div>

      {/* Carousel Section */}
      <div className="border-t border-gray-100 px-6 py-5 dark:border-gray-800">
        <p className="mb-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
          Where should emails from this sender go?
        </p>

        <div className="relative -mx-4 px-4">
          {/* Left Arrow */}
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -ml-1"
            aria-label="Scroll left"
          >
            <ChevronLeft
              size={16}
              className="text-gray-600 dark:text-gray-400"
            />
          </button>

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto overflow-y-visible scroll-smooth scrollbar-hide py-5"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Default Folders */}
            {defaultFolders.map((folder, index) => (
              <button
                key={folder.id}
                type="button"
                onClick={() =>
                  handleDecision(
                    folder.id as 'inbox' | 'newsfeed' | 'receipts' | 'spam'
                  )
                }
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-lg border-2 bg-white p-4 transition-all hover:scale-105 hover:shadow-xl dark:bg-gray-900 flex-shrink-0 w-[200px]',
                  aiSuggestion === folder.id
                    ? `${folder.color} shadow-md`
                    : `border-gray-200 ${folder.hoverColor} dark:border-gray-700`,
                  'scroll-snap-align-start',
                  index === 0 && 'ml-2',
                  index === defaultFolders.length - 1 &&
                    customFolders.length === 0 &&
                    'mr-2'
                )}
                style={{ scrollSnapAlign: 'start' }}
              >
                <span className="text-2xl">{folder.emoji}</span>
                <div className="text-center">
                  <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">
                    {folder.name}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {folder.description}
                  </span>
                </div>
                {aiSuggestion === folder.id && (
                  <div className="absolute -right-2 -top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                    AI Pick
                  </div>
                )}
              </button>
            ))}

            {/* Custom Folders */}
            {customFolders.map((folder, index) => (
              <button
                key={folder.id}
                type="button"
                onClick={() => handleDecision(folder.id)}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-lg border-2 border-gray-200 bg-white p-4 transition-all hover:scale-105 hover:shadow-xl hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 flex-shrink-0 w-[200px] scroll-snap-align-start',
                  index === customFolders.length - 1 && 'mr-2'
                )}
                style={{ scrollSnapAlign: 'start' }}
              >
                <span className="text-2xl">{folder.icon}</span>
                <div className="text-center">
                  <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">
                    {folder.name}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Custom
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors -mr-1"
            aria-label="Scroll right"
          >
            <ChevronRight
              size={16}
              className="text-gray-600 dark:text-gray-400"
            />
          </button>
        </div>

        {/* New Folder Button - Outside Carousel */}
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 bg-white transition-all hover:border-primary hover:bg-primary/5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
            title="Create new folder"
          >
            <Plus className="h-4 w-4 text-gray-400 group-hover:text-primary" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary">
              New Folder
            </span>
          </button>
        </div>

        {/* View All Emails Link */}
        <button
          type="button"
          className="mt-3 w-full text-center text-sm text-primary hover:underline"
        >
          View all 3 emails from this sender →
        </button>
      </div>

      {/* Quick Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              Create Custom Folder
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleQuickCreate();
                    }
                  }}
                  placeholder="e.g., Work Projects"
                  maxLength={50}
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleQuickCreate}
                  disabled={isCreating || !newFolderName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Create & Use
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewFolderName('');
                  }}
                  disabled={isCreating}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
