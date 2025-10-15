'use client';

import { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { ExpandableEmailCard } from './ExpandableEmailCard';
import { AIActionsModal } from './AIActionsModal';
import type { Email } from '@/db/schema';

interface EmailListProps {
  emails: Email[];
  title?: string;
  isLoading?: boolean;
  error?: string | null;
  onToggleSidebar?: () => void;
}

export function EmailList({
  emails,
  title = 'Inbox',
  isLoading = false,
  error,
  onToggleSidebar,
}: EmailListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [aiModalEmailId, setAiModalEmailId] = useState<string | null>(null);

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.fromAddress?.email || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const unreadCount = emails.filter((email) => !email.isRead).length;

  return (
    <div className="flex h-full flex-col">
      {/* Combined Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              {onToggleSidebar && (
                <button
                  onClick={onToggleSidebar}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <Menu
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </button>
              )}
              <div className="relative flex-1 max-w-xl">
                <Search
                  className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div className="px-4 pb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {title}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Email List */}
      <div className="flex-1 bg-white dark:bg-gray-900 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-gray-600 dark:text-gray-400">
              Loading emails...
            </div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-2 text-4xl">📭</div>
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
              No emails here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'No emails match your search'
                : 'Your inbox is empty'}
            </p>
          </div>
        ) : (
          filteredEmails.map((email) => (
            <ExpandableEmailCard
              key={email.id}
              email={email}
              isExpanded={expandedEmailId === email.id}
              onToggle={() => {
                setExpandedEmailId(
                  expandedEmailId === email.id ? null : email.id
                );
                setAiModalEmailId(null);
              }}
              onOpenAIActions={() => setAiModalEmailId(email.id)}
            />
          ))
        )}
      </div>

      {/* AI Actions Modal */}
      <AIActionsModal
        isOpen={aiModalEmailId !== null}
        onClose={() => setAiModalEmailId(null)}
        emailId={aiModalEmailId || ''}
      />
    </div>
  );
}
