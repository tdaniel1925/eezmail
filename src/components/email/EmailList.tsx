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
  // Infinite scroll props
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
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
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: EmailListProps): JSX.Element {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<
    'compose' | 'reply' | 'forward'
  >('compose');
  const [composerEmailId, setComposerEmailId] = useState<string | null>(null);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const emailRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Infinite scroll observer
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

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

  // Infinite scroll: Intersection Observer
  useEffect(() => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          console.log('📜 Loading more emails...');
          onLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '200px', // Start loading 200px before reaching bottom
        threshold: 0.1,
      }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  // Listen for 'open-email' event from other components (e.g., PeopleTab)
  useEffect(() => {
    const handleOpenEmail = (event: CustomEvent) => {
      const { emailId } = event.detail;

      console.log('[EmailList] Open email event received:', emailId);

      // Find the email in the list
      const email = emails.find((e) => e.id === emailId);
      if (!email) {
        console.warn('[EmailList] Email not found in current list:', emailId);
        return;
      }

      // Expand the email
      setExpandedEmailId(emailId);

      // Scroll to the email after a brief delay to allow DOM update
      setTimeout(() => {
        const emailElement = emailRefs.current[emailId];
        if (emailElement && scrollContainerRef.current) {
          emailElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          console.log('[EmailList] Scrolled to email:', emailId);
        } else {
          console.warn('[EmailList] Email element not found in DOM:', emailId);
        }
      }, 100);
    };

    window.addEventListener('open-email', handleOpenEmail as EventListener);

    return () => {
      window.removeEventListener(
        'open-email',
        handleOpenEmail as EventListener
      );
    };
  }, [emails]);

  // Filter emails based on search query (instant local search)
  const displayEmails = emails.filter((email) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Search in subject
    if (email.subject?.toLowerCase().includes(query)) return true;

    // Search in sender email
    if (typeof email.fromAddress === 'object' && email.fromAddress) {
      const fromEmail = (email.fromAddress as any).email?.toLowerCase() || '';
      if (fromEmail.includes(query)) return true;

      // Search in sender name
      const fromName = (email.fromAddress as any).name?.toLowerCase() || '';
      if (fromName.includes(query)) return true;
    }

    // Search in body/snippet
    if (
      email.body &&
      typeof email.body === 'string' &&
      email.body.toLowerCase().includes(query)
    ) {
      return true;
    }

    if (email.snippet?.toLowerCase().includes(query)) return true;

    return false;
  });

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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search emails..."
        leftActions={
          /* Select All Checkbox - Aligned with email card checkboxes */
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
        }
        customActions={
          <>
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

      {/* Email List Container */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
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
              Nothing to see here
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {searchQuery
                ? 'No emails match your search'
                : 'No emails in this folder'}
            </p>
          </div>
        ) : (
          <>
            {displayEmails.map((email) => (
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
                  onOpenComposer={(mode, emailId) => {
                    setComposerMode(mode);
                    setComposerEmailId(emailId);
                    setIsComposerOpen(true);
                  }}
                  onNavigateToEmail={handleNavigateToEmail}
                />
              </div>
            ))}

            {/* Load More Trigger for Infinite Scroll */}
            {hasMore && (
              <div
                ref={loadMoreTriggerRef}
                className="flex items-center justify-center py-8"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more emails...</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    Scroll for more
                  </div>
                )}
              </div>
            )}

            {/* End of List Indicator */}
            {!hasMore && displayEmails.length > 0 && (
              <div className="flex items-center justify-center py-6 text-sm text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="h-px w-12 bg-gray-300 dark:bg-gray-700" />
                  <span>You've reached the end</span>
                  <div className="h-px w-12 bg-gray-300 dark:bg-gray-700" />
                </div>
              </div>
            )}
          </>
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
