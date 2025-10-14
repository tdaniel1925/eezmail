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
      <div className="flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-md px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {title}
          </h1>
          <p className="text-sm text-white/60">
            {filteredEmails.length} email
            {filteredEmails.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white disabled:opacity-50"
            aria-label="Refresh emails"
          >
            <RefreshCw
              className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
            />
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
            aria-label="Filter emails"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-white/10 bg-black/30 px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md pl-10 pr-4 text-sm text-white placeholder-white/40 transition-all duration-200 focus:border-white/20 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-y-auto bg-black/50">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-white/60">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Loading emails...</span>
            </div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-2 text-4xl">📭</div>
            <p className="text-lg font-medium text-white/80">
              No emails here
            </p>
            <p className="text-sm text-white/50">
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
