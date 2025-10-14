'use client';

import { useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { EmailCard } from './EmailCard';
import { cn } from '@/lib/utils';
import type { Email } from '@/db/schema';

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onEmailSelect: (emailId: string) => void;
  title?: string;
  isLoading?: boolean;
}

export function EmailList({
  emails,
  selectedEmailId,
  onEmailSelect,
  title = 'Imbox',
  isLoading = false,
}: EmailListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    // TODO: Implement email sync
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.fromAddress.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredEmails.length} email
            {filteredEmails.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            aria-label="Refresh emails"
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
            aria-label="Filter emails"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-950">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading emails...</span>
            </div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-2 text-4xl">📭</div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
              No emails here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'No emails match your search'
                : 'Your inbox is empty'}
            </p>
          </div>
        ) : (
          <div className="space-y-px p-2">
            {filteredEmails.map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                isSelected={email.id === selectedEmailId}
                onClick={() => onEmailSelect(email.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
