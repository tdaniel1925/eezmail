'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { ExpandableEmailItem } from './ExpandableEmailItem';
import type { Email } from '@/db/schema';

interface EmailListProps {
  emails: Email[];
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string | null;
  onToggleSidebar?: () => void;
}

export function EmailList({
  emails,
  title = 'Inbox',
  subtitle,
  isLoading = false,
  error,
}: EmailListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const filteredEmails = emails.filter(
    (email) =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.fromAddress?.email || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const unreadCount = emails.filter((email) => email.unread).length;
  const defaultSubtitle = subtitle || `${unreadCount} new emails from approved senders`;

  const handleEmailAction = (action: string, emailId: string): void => {
    console.log(`Action: ${action}, Email ID: ${emailId}`);
    // TODO: Implement email actions
  };

  return (
    <div className="flex h-full flex-col">
      {/* Top Bar */}
      <TopBar title={title} subtitle={defaultSubtitle} />

      {/* Search Bar */}
      <div
        className="px-8 py-4 border-b transition-colors duration-300"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="relative max-w-[600px]">
          <Search
            className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none"
            size={16}
            style={{ color: 'var(--text-tertiary)' }}
          />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg text-sm transition-all duration-200 border focus:outline-none focus:ring-0"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Email List Container */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div
            className="flex h-64 items-center justify-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 rounded-full animate-spin"
                style={{
                  borderColor: 'var(--accent-blue)',
                  borderTopColor: 'transparent'
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
        ) : filteredEmails.length === 0 ? (
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
          filteredEmails.map((email) => (
            <ExpandableEmailItem
              key={email.id}
              email={email}
              isExpanded={expandedEmailId === email.id}
              onToggle={() => {
                setExpandedEmailId(
                  expandedEmailId === email.id ? null : email.id
                );
              }}
              onAction={handleEmailAction}
            />
          ))
        )}
      </div>
    </div>
  );
}
