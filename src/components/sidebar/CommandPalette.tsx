'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  Trash2,
  Users,
  Calendar,
  CheckSquare,
  Settings,
  Plus,
  Reply,
  ShieldQuestion,
  Newspaper,
  Clock,
  Bell,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  category: 'navigation' | 'actions' | 'recent';
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCompose?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onCompose,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setActiveFolder } = useSidebarStore();

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-inbox',
      label: 'Inbox',
      description: 'View inbox emails',
      icon: Inbox,
      category: 'navigation',
      keywords: ['inbox', 'mail', 'email'],
      action: () => {
        setActiveFolder('inbox');
        router.push('/dashboard/inbox');
        addToRecent('nav-inbox');
        onClose();
      },
    },
    {
      id: 'nav-reply-queue',
      label: 'Reply Queue',
      description: 'Emails needing responses',
      icon: Reply,
      category: 'navigation',
      keywords: ['reply', 'response', 'answer'],
      action: () => {
        setActiveFolder('reply-queue');
        router.push('/dashboard/reply-queue');
        addToRecent('nav-reply-queue');
        onClose();
      },
    },
    {
      id: 'nav-screener',
      label: 'Screener',
      description: 'Review uncertain emails',
      icon: ShieldQuestion,
      category: 'navigation',
      keywords: ['screener', 'triage', 'review'],
      action: () => {
        setActiveFolder('screener');
        router.push('/dashboard/screener');
        addToRecent('nav-screener');
        onClose();
      },
    },
    {
      id: 'nav-newsfeed',
      label: 'News Feed',
      description: 'Newsletters and updates',
      icon: Newspaper,
      category: 'navigation',
      keywords: ['newsletter', 'news', 'updates', 'feed'],
      action: () => {
        setActiveFolder('newsfeed');
        router.push('/dashboard/newsfeed');
        addToRecent('nav-newsfeed');
        onClose();
      },
    },
    {
      id: 'nav-starred',
      label: 'Starred',
      description: 'Starred emails',
      icon: Star,
      category: 'navigation',
      keywords: ['starred', 'favorite', 'important'],
      action: () => {
        setActiveFolder('starred');
        router.push('/dashboard/starred');
        addToRecent('nav-starred');
        onClose();
      },
    },
    {
      id: 'nav-sent',
      label: 'Sent',
      description: 'Sent emails',
      icon: Send,
      category: 'navigation',
      keywords: ['sent', 'outbox'],
      action: () => {
        setActiveFolder('sent');
        router.push('/dashboard/sent');
        addToRecent('nav-sent');
        onClose();
      },
    },
    {
      id: 'nav-drafts',
      label: 'Drafts',
      description: 'Draft emails',
      icon: FileText,
      category: 'navigation',
      keywords: ['draft', 'unfinished'],
      action: () => {
        setActiveFolder('drafts');
        router.push('/dashboard/drafts');
        addToRecent('nav-drafts');
        onClose();
      },
    },
    {
      id: 'nav-scheduled',
      label: 'Scheduled',
      description: 'Scheduled sends',
      icon: Clock,
      category: 'navigation',
      keywords: ['scheduled', 'later', 'queue'],
      action: () => {
        setActiveFolder('scheduled');
        router.push('/dashboard/scheduled');
        addToRecent('nav-scheduled');
        onClose();
      },
    },
    {
      id: 'nav-snoozed',
      label: 'Snoozed',
      description: 'Snoozed emails',
      icon: Bell,
      category: 'navigation',
      keywords: ['snoozed', 'reminder', 'later'],
      action: () => {
        setActiveFolder('snoozed');
        router.push('/dashboard/snoozed');
        addToRecent('nav-snoozed');
        onClose();
      },
    },
    {
      id: 'nav-all',
      label: 'All Mail',
      description: 'All emails',
      icon: Mail,
      category: 'navigation',
      keywords: ['all', 'everything'],
      action: () => {
        setActiveFolder('all');
        router.push('/dashboard/all');
        addToRecent('nav-all');
        onClose();
      },
    },
    {
      id: 'nav-archived',
      label: 'Archive',
      description: 'Archived emails',
      icon: Archive,
      category: 'navigation',
      keywords: ['archive', 'archived'],
      action: () => {
        setActiveFolder('archived');
        router.push('/dashboard/archived');
        addToRecent('nav-archived');
        onClose();
      },
    },
    {
      id: 'nav-trash',
      label: 'Trash',
      description: 'Deleted emails',
      icon: Trash2,
      category: 'navigation',
      keywords: ['trash', 'deleted', 'bin'],
      action: () => {
        setActiveFolder('trash');
        router.push('/dashboard/trash');
        addToRecent('nav-trash');
        onClose();
      },
    },
    {
      id: 'nav-contacts',
      label: 'Contacts',
      description: 'Manage contacts',
      icon: Users,
      category: 'navigation',
      keywords: ['contacts', 'people', 'address book'],
      action: () => {
        router.push('/dashboard/contacts');
        addToRecent('nav-contacts');
        onClose();
      },
    },
    {
      id: 'nav-calendar',
      label: 'Calendar',
      description: 'View calendar',
      icon: Calendar,
      category: 'navigation',
      keywords: ['calendar', 'events', 'schedule'],
      action: () => {
        router.push('/dashboard/calendar');
        addToRecent('nav-calendar');
        onClose();
      },
    },
    {
      id: 'nav-tasks',
      label: 'Tasks',
      description: 'Manage tasks',
      icon: CheckSquare,
      category: 'navigation',
      keywords: ['tasks', 'todo', 'checklist'],
      action: () => {
        router.push('/dashboard/tasks');
        addToRecent('nav-tasks');
        onClose();
      },
    },
    {
      id: 'nav-settings',
      label: 'Settings',
      description: 'App settings',
      icon: Settings,
      category: 'navigation',
      keywords: ['settings', 'preferences', 'config'],
      action: () => {
        router.push('/dashboard/settings');
        addToRecent('nav-settings');
        onClose();
      },
    },

    // Actions
    {
      id: 'action-compose',
      label: 'Compose Email',
      description: 'Write a new email',
      icon: Plus,
      category: 'actions',
      keywords: ['compose', 'write', 'new', 'email', 'create'],
      action: () => {
        if (onCompose) {
          onCompose();
        } else {
          router.push('/dashboard/compose');
        }
        addToRecent('action-compose');
        onClose();
      },
    },
  ];

  // Filter commands based on search query
  const filteredCommands = query
    ? commands.filter((cmd) => {
        const searchLower = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.description?.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some((kw) => kw.includes(searchLower))
        );
      })
    : commands;

  // Group commands by category
  const recentCommands = recentItems
    .map((id) => commands.find((cmd) => cmd.id === id))
    .filter(Boolean) as CommandItem[];

  const navigationCommands = filteredCommands.filter(
    (cmd) => cmd.category === 'navigation'
  );
  const actionCommands = filteredCommands.filter(
    (cmd) => cmd.category === 'actions'
  );

  const allVisibleCommands = query
    ? filteredCommands
    : [...recentCommands, ...navigationCommands, ...actionCommands];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < allVisibleCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : allVisibleCommands.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedCommand = allVisibleCommands[selectedIndex];
        if (selectedCommand) {
          selectedCommand.action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allVisibleCommands, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const addToRecent = (id: string) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((item) => item !== id);
      return [id, ...filtered].slice(0, 5);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <Search size={20} className="text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search commands, folders, actions..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                />
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Commands List */}
              <div className="max-h-96 overflow-y-auto p-2">
                {allVisibleCommands.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No results found for "{query}"
                  </div>
                ) : (
                  <>
                    {!query && recentCommands.length > 0 && (
                      <CommandSection
                        title="Recent"
                        commands={recentCommands}
                        selectedIndex={selectedIndex}
                        startIndex={0}
                      />
                    )}
                    {!query && (
                      <>
                        <CommandSection
                          title="Navigation"
                          commands={navigationCommands}
                          selectedIndex={selectedIndex}
                          startIndex={recentCommands.length}
                        />
                        <CommandSection
                          title="Actions"
                          commands={actionCommands}
                          selectedIndex={selectedIndex}
                          startIndex={
                            recentCommands.length + navigationCommands.length
                          }
                        />
                      </>
                    )}
                    {query && (
                      <div className="space-y-1">
                        {allVisibleCommands.map((cmd, index) => (
                          <CommandButton
                            key={cmd.id}
                            command={cmd}
                            isSelected={index === selectedIndex}
                            onClick={cmd.action}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      ↑↓
                    </kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      Enter
                    </kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                      Esc
                    </kbd>
                    <span>Close</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Helper Components

interface CommandSectionProps {
  title: string;
  commands: CommandItem[];
  selectedIndex: number;
  startIndex: number;
}

function CommandSection({
  title,
  commands,
  selectedIndex,
  startIndex,
}: CommandSectionProps) {
  if (commands.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {title}
      </div>
      <div className="space-y-1">
        {commands.map((cmd, index) => (
          <CommandButton
            key={cmd.id}
            command={cmd}
            isSelected={startIndex + index === selectedIndex}
            onClick={cmd.action}
          />
        ))}
      </div>
    </div>
  );
}

interface CommandButtonProps {
  command: CommandItem;
  isSelected: boolean;
  onClick: () => void;
}

function CommandButton({ command, isSelected, onClick }: CommandButtonProps) {
  const Icon = command.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left',
        isSelected
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
      )}
    >
      <Icon size={18} className={cn(isSelected && 'text-primary')} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{command.label}</div>
        {command.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {command.description}
          </div>
        )}
      </div>
    </button>
  );
}
