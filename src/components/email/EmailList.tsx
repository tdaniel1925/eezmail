'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Search,
  Pencil,
  Loader2,
  Settings,
  RefreshCw,
  Mail,
  CheckSquare,
  Square,
  Archive,
  Trash2,
  Tag,
  FolderInput,
  MailOpen,
  MailX,
  X,
} from 'lucide-react';
import { ExpandableEmailItem } from './ExpandableEmailItem';
import { EmailComposer } from './EmailComposer';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { UnifiedHeader } from '@/components/layout/UnifiedHeader';
import { toast } from 'sonner';
import type { Email } from '@/db/schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  bulkMarkAsRead,
  bulkArchiveEmails,
  bulkDeleteEmails,
  bulkMoveEmailsToFolder,
} from '@/lib/chat/actions';
import { applyLabelsToEmails } from '@/lib/labels/actions';
import { FolderSelectorModal } from '@/components/modals/FolderSelectorModal';
import { LabelSelectorModal } from '@/components/modals/LabelSelectorModal';
import { createClient } from '@/lib/supabase/client';

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
  const [composerMode, setComposerMode] = useState<
    'compose' | 'reply' | 'forward'
  >('compose');
  const [composerEmailId, setComposerEmailId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const emailRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get user ID on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

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

  // Bulk action handlers
  const toggleSelectAll = (): void => {
    if (selectedEmails.size === displayEmails.length) {
      setSelectedEmails(new Set());
      setIsSelectionMode(false);
    } else {
      const allIds = new Set(displayEmails.map((email) => email.id));
      setSelectedEmails(allIds);
      setIsSelectionMode(true);
    }
  };

  const toggleEmailSelection = (emailId: string): void => {
    const newSelected = new Set(selectedEmails);
    if (newSelected.has(emailId)) {
      newSelected.delete(emailId);
    } else {
      newSelected.add(emailId);
    }
    setSelectedEmails(newSelected);
    setIsSelectionMode(newSelected.size > 0);
  };

  const clearSelection = (): void => {
    setSelectedEmails(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkMarkAsRead = async (): Promise<void> => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }
    try {
      const emailIds = Array.from(selectedEmails);
      const result = await bulkMarkAsRead({
        userId,
        emailIds,
        isRead: true,
      });

      if (result.success) {
        toast.success(result.message);
        clearSelection();
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk mark as read error:', error);
      toast.error('Failed to mark emails as read');
    }
  };

  const handleBulkMarkAsUnread = async (): Promise<void> => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }
    try {
      const emailIds = Array.from(selectedEmails);
      const result = await bulkMarkAsRead({
        userId,
        emailIds,
        isRead: false,
      });

      if (result.success) {
        toast.success(result.message);
        clearSelection();
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk mark as unread error:', error);
      toast.error('Failed to mark emails as unread');
    }
  };

  const handleBulkArchive = async (): Promise<void> => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }
    try {
      const emailIds = Array.from(selectedEmails);
      const result = await bulkArchiveEmails({
        userId,
        emailIds,
      });

      if (result.success) {
        toast.success(result.message);
        clearSelection();
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk archive error:', error);
      toast.error('Failed to archive emails');
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    if (
      !confirm(`Are you sure you want to delete ${selectedEmails.size} emails?`)
    ) {
      return;
    }

    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const emailIds = Array.from(selectedEmails);
      const result = await bulkDeleteEmails({
        userId,
        emailIds,
      });

      if (result.success) {
        toast.success(result.message);
        clearSelection();
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete emails');
    }
  };

  const handleBulkMove = (): void => {
    setIsFolderModalOpen(true);
  };

  const handleFolderSelect = async (folderId: string): Promise<void> => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const emailIds = Array.from(selectedEmails);
      const result = await bulkMoveEmailsToFolder({
        userId,
        emailIds,
        targetFolder: folderId,
      });

      if (result.success) {
        toast.success(result.message);
        clearSelection();
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk move error:', error);
      toast.error('Failed to move emails');
    }
  };

  const handleBulkLabel = (): void => {
    setIsLabelModalOpen(true);
  };

  const handleLabelsSelect = async (labelIds: string[]): Promise<void> => {
    try {
      const emailIds = Array.from(selectedEmails);
      const result = await applyLabelsToEmails({
        emailIds,
        labelIds,
      });

      if (result.success) {
        toast.success(result.message);
        clearSelection();
        // Dispatch refresh event
        window.dispatchEvent(new CustomEvent('refresh-email-list'));
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Bulk label error:', error);
      toast.error('Failed to apply labels');
    }
  };

  const handleEmailAction = async (
    action: string,
    emailId: string
  ): Promise<void> => {
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }

    switch (action) {
      case 'reply':
        // Open composer in reply mode
        setComposerMode('reply');
        setComposerEmailId(emailId);
        setIsComposerOpen(true);
        break;

      case 'forward':
        // Open composer in forward mode
        setComposerMode('forward');
        setComposerEmailId(emailId);
        setIsComposerOpen(true);
        break;

      case 'archive':
        try {
          const result = await bulkArchiveEmails({
            userId,
            emailIds: [emailId],
          });
          if (result.success) {
            toast.success('Email archived');
            // Clear AI panel if this email was selected
            const { currentEmail, setCurrentEmail } =
              useAIPanelStore.getState();
            if (currentEmail?.id === emailId) {
              setCurrentEmail(null);
            }
            onRefresh?.();
            window.dispatchEvent(new CustomEvent('refresh-email-list'));
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          console.error('Archive error:', error);
          toast.error('Failed to archive email');
        }
        break;

      case 'delete':
        if (!confirm('Are you sure you want to delete this email?')) {
          return;
        }
        try {
          const result = await bulkDeleteEmails({
            userId,
            emailIds: [emailId],
          });
          if (result.success) {
            toast.success('Email deleted');
            // Clear AI panel if this email was selected
            const { currentEmail, setCurrentEmail } =
              useAIPanelStore.getState();
            if (currentEmail?.id === emailId) {
              setCurrentEmail(null);
            }
            onRefresh?.();
            window.dispatchEvent(new CustomEvent('refresh-email-list'));
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          console.error('Delete error:', error);
          toast.error('Failed to delete email');
        }
        break;

      default:
        console.log(`Action: ${action}, Email ID: ${emailId}`);
    }
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
      {/* Unified Header */}
      <UnifiedHeader
        title={title}
        subtitle={`${unreadCount} unread${newEmailsCount > 0 ? ` • +${newEmailsCount} new` : ''}`}
        onRefresh={onRefresh}
        isRefreshing={isSyncing}
        customActions={
          <>
            {/* Select All Checkbox */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center justify-center rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={
                selectedEmails.size === displayEmails.length &&
                displayEmails.length > 0
                  ? 'Deselect all'
                  : 'Select all'
              }
            >
              {selectedEmails.size === displayEmails.length &&
              displayEmails.length > 0 ? (
                <CheckSquare className="h-5 w-5 text-blue-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Compose Button */}
            <AnimatedButton
              variant="particles"
              onClick={() => {
                setComposerMode('compose');
                setComposerEmailId(null);
                setIsComposerOpen(true);
              }}
              icon={<Pencil className="h-3.5 w-3.5" />}
            >
              Compose
            </AnimatedButton>
          </>
        }
      />

      {/* Bulk Actions Toolbar */}
      {isSelectionMode && selectedEmails.size > 0 && (
        <div className="flex items-center justify-between border-b border-gray-200 bg-blue-50 px-6 py-3 dark:border-gray-700 dark:bg-blue-900/20">
          <div className="flex items-center gap-4">
            <button
              onClick={clearSelection}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              title="Clear selection"
            >
              <X className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {selectedEmails.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkAsRead}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Mark as read"
            >
              <MailOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Mark read</span>
            </button>
            <button
              onClick={handleBulkMarkAsUnread}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Mark as unread"
            >
              <MailX className="h-4 w-4" />
              <span className="hidden sm:inline">Mark unread</span>
            </button>
            <button
              onClick={handleBulkArchive}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Archive"
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archive</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-900/20"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <div className="mx-2 h-6 w-px bg-gray-300 dark:bg-gray-600" />
            <button
              onClick={handleBulkMove}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Move to folder"
            >
              <FolderInput className="h-4 w-4" />
              <span className="hidden sm:inline">Move</span>
            </button>
            <button
              onClick={handleBulkLabel}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Apply label"
            >
              <Tag className="h-4 w-4" />
              <span className="hidden sm:inline">Label</span>
            </button>
          </div>
        </div>
      )}

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
                isSelected={selectedEmails.has(email.id)}
                onToggle={() => {
                  setExpandedEmailId(
                    expandedEmailId === email.id ? null : email.id
                  );
                }}
                onSelect={() => toggleEmailSelection(email.id)}
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
        onClose={() => {
          setIsComposerOpen(false);
          setComposerMode('compose');
          setComposerEmailId(null);
        }}
        mode={composerMode}
        replyToEmailId={composerMode === 'reply' ? composerEmailId : undefined}
        forwardEmailId={
          composerMode === 'forward' ? composerEmailId : undefined
        }
      />

      {/* Folder Selector Modal */}
      <FolderSelectorModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onSelectFolder={handleFolderSelect}
      />

      {/* Label Selector Modal */}
      <LabelSelectorModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        onSelectLabels={handleLabelsSelect}
      />
    </div>
  );
}
