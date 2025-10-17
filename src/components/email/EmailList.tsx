'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Search,
  Pencil,
  Loader2,
  Settings,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { ExpandableEmailItem } from './ExpandableEmailItem';
import { EmailComposer } from './EmailComposer';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { toast } from 'sonner';
import type { Email } from '@/db/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EmailListProps {
  emails: Email[];
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string | null;
  onToggleSidebar?: () => void;
  isSyncing?: boolean;
  lastSyncAt?: Date;
  onRefresh?: () => void;
  newEmailsCount?: number;
}

export function EmailList({
  emails,
  title = 'Inbox',
  isLoading = false,
  error,
  isSyncing = false,
  lastSyncAt,
  onRefresh,
  newEmailsCount = 0,
}: EmailListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const emailRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Use search results if available, otherwise use filtered local emails
  const displayEmails =
    searchResults !== null
      ? searchResults
      : emails.filter(
          (email) =>
            email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (email.fromAddress?.email || '')
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        );

  const handleSearch = async (): Promise<void> => {
    if (!searchQuery.trim()) {
      toast.info('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();

      if (data.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
        toast.success(`Found ${data.results.length} emails`);
      } else {
        setSearchResults([]);
        toast.info('No emails found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = (): void => {
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleEmailAction = (action: string, emailId: string): void => {
    console.log(`Action: ${action}, Email ID: ${emailId}`);
    // TODO: Implement email actions
  };

  const handleNavigateToEmail = useCallback((emailId: string) => {
    // Expand the email
    setExpandedEmailId(emailId);

    // Scroll to the email
    setTimeout(() => {
      const emailElement = emailRefs.current[emailId];
      if (emailElement) {
        emailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 100);
  }, []);

  // Calculate unread count
  const unreadCount = emails.filter((e) => !e.isRead).length;

  return (
    <div className="flex h-full flex-col">
      {/* Unified Header Bar - 64px height */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-gray-800">
        {/* Left: Title + Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              <div className="flex items-center space-x-2 text-sm">
                {/* Sync Status Dot + Unread Count */}
                <div className="flex items-center space-x-1.5 text-gray-500 dark:text-gray-400">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isSyncing ? 'animate-pulse bg-blue-500' : 'bg-green-500'
                    }`}
                    title={
                      isSyncing
                        ? 'Syncing...'
                        : `Auto-sync active${lastSyncAt ? ` • Last synced ${lastSyncAt.toLocaleTimeString()}` : ''}`
                    }
                  />
                  <span className="text-xs">{unreadCount} unread</span>
                </div>

                {/* New Emails Badge */}
                {newEmailsCount > 0 && (
                  <span className="animate-pulse rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    +{newEmailsCount} new
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Search Bar + Compose + Settings */}
        <div className="flex flex-1 items-center gap-2 ml-12">
          {/* Search Bar (Standalone) - 20% smaller */}
          <div className="flex flex-1 max-w-lg items-center rounded-lg border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-primary/20 dark:border-gray-700 dark:bg-gray-900">
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  handleClearSearch();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="flex-1 bg-transparent px-3 py-1 text-sm text-gray-900 placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300"
              title="Search"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Compose Button (Standalone) */}
          <AnimatedButton
            variant="particles"
            onClick={() => setIsComposerOpen(true)}
            icon={<Pencil className="h-3.5 w-3.5" />}
          >
            Compose
          </AnimatedButton>

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                title="More options"
              >
                <Settings className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onRefresh} disabled={isSyncing}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`}
                />
                {isSyncing ? 'Syncing...' : 'Refresh'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <div className="flex items-center justify-between">
                  <span className="mr-2">Dark Mode</span>
                  <ThemeToggle />
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => (window.location.href = '/dashboard/settings')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search Results Indicator */}
      {searchResults !== null && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-blue-50 px-6 py-2 text-sm dark:border-gray-700 dark:bg-blue-900/20">
          <span className="text-gray-700 dark:text-gray-300">
            {searchResults.length > 0
              ? `Showing ${searchResults.length} results for "${searchQuery}"`
              : `No results found for "${searchQuery}"`}
          </span>
          <button
            onClick={handleClearSearch}
            className="font-medium text-primary hover:underline"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Email List Container */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div
            className="flex h-64 items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 border-4 rounded-full animate-spin"
                style={{
                  borderColor: 'var(--accent-blue)',
                  borderTopColor: 'transparent',
                }}
              />
              <div>Loading emails...</div>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-64 flex-col items-center justify-center text-center px-4">
            <div className="mb-2 text-4xl">⚠️</div>
            <p
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Error loading emails
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {error}
            </p>
          </div>
        ) : displayEmails.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center px-4">
            <div className="mb-2 text-4xl">📭</div>
            <p
              className="text-lg font-medium mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              No emails here
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery
                ? 'No emails match your search'
                : 'Your inbox is empty'}
            </p>
          </div>
        ) : (
          displayEmails.map((email) => (
            <div
              key={email.id}
              ref={(el) => {
                emailRefs.current[email.id] = el;
              }}
            >
              <ExpandableEmailItem
                email={email}
                isExpanded={expandedEmailId === email.id}
                onToggle={() => {
                  setExpandedEmailId(
                    expandedEmailId === email.id ? null : email.id
                  );
                }}
                onAction={handleEmailAction}
                onNavigateToEmail={handleNavigateToEmail}
              />
            </div>
          ))
        )}
      </div>

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        mode="compose"
      />
    </div>
  );
}
