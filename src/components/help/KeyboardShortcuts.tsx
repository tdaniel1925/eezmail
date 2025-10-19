'use client';

import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  category: string;
  shortcuts: Shortcut[];
}

export function KeyboardShortcuts({
  isOpen,
  onClose,
}: KeyboardShortcutsProps): JSX.Element {
  const shortcutCategories: ShortcutCategory[] = [
    {
      category: 'Navigation',
      shortcuts: [
        { keys: ['G', 'I'], description: 'Go to Inbox' },
        { keys: ['G', 'F'], description: 'Go to Feed' },
        { keys: ['G', 'P'], description: 'Go to Paper Trail' },
        { keys: ['G', 'S'], description: 'Go to Starred' },
        { keys: ['G', 'D'], description: 'Go to Drafts' },
        { keys: ['G', 'A'], description: 'Go to Archive' },
        { keys: ['/'], description: 'Search emails' },
      ],
    },
    {
      category: 'Email Actions',
      shortcuts: [
        { keys: ['C'], description: 'Compose new email' },
        { keys: ['R'], description: 'Reply to email' },
        { keys: ['A'], description: 'Reply all' },
        { keys: ['F'], description: 'Forward email' },
        { keys: ['E'], description: 'Archive email' },
        { keys: ['#'], description: 'Delete email' },
        { keys: ['S'], description: 'Star/unstar email' },
        { keys: ['U'], description: 'Mark as unread' },
      ],
    },
    {
      category: 'Email Selection',
      shortcuts: [
        { keys: ['X'], description: 'Select email' },
        { keys: ['* A'], description: 'Select all' },
        { keys: ['* N'], description: 'Deselect all' },
        { keys: ['* R'], description: 'Select read' },
        { keys: ['* U'], description: 'Select unread' },
        { keys: ['J'], description: 'Next email' },
        { keys: ['K'], description: 'Previous email' },
      ],
    },
    {
      category: 'Composer',
      shortcuts: [
        { keys: ['Cmd', 'Enter'], description: 'Send email' },
        { keys: ['Cmd', 'K'], description: 'Insert link' },
        { keys: ['Cmd', 'B'], description: 'Bold text' },
        { keys: ['Cmd', 'I'], description: 'Italic text' },
        { keys: ['Cmd', 'U'], description: 'Underline text' },
        { keys: ['Esc'], description: 'Close composer' },
      ],
    },
    {
      category: 'Application',
      shortcuts: [
        { keys: ['?'], description: 'Show keyboard shortcuts' },
        { keys: ['Cmd', ','], description: 'Open settings' },
        { keys: ['Esc'], description: 'Close modal/dialog' },
        { keys: ['Cmd', 'Z'], description: 'Undo' },
        { keys: ['Cmd', 'Shift', 'Z'], description: 'Redo' },
      ],
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Work faster with these keyboard shortcuts"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shortcutCategories.map((category) => (
          <div key={category.category}>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              {category.category}
            </h4>
            <div className="space-y-2">
              {category.shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-700 dark:text-white/80">
                    {shortcut.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex} className="flex items-center gap-1">
                        <kbd
                          className={cn(
                            'inline-flex items-center justify-center',
                            'min-w-[24px] h-6 px-2',
                            'rounded border border-gray-300 dark:border-white/20',
                            'bg-gray-100 dark:bg-white/10',
                            'text-xs font-medium text-gray-900 dark:text-white',
                            'shadow-sm'
                          )}
                        >
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="text-xs text-gray-500 dark:text-white/50">
                            {shortcut.keys.length === 2 && keyIndex === 0
                              ? '+'
                              : 'then'}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-50/50 dark:bg-white/5 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-white/60">
          <strong>Tip:</strong> Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white">
            ?
          </kbd>{' '}
          at any time to view this list. On Mac,{' '}
          <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white">
            Cmd
          </kbd>{' '}
          = Command key. On Windows/Linux, use{' '}
          <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white">
            Ctrl
          </kbd>{' '}
          instead.
        </p>
      </div>
    </Modal>
  );
}


