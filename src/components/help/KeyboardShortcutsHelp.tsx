'use client';

/**
 * Display keyboard shortcuts help overlay
 */
export function KeyboardShortcutsHelp() {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['G', 'I'], description: 'Go to Inbox' },
        { keys: ['G', 'S'], description: 'Go to Sent' },
        { keys: ['G', 'D'], description: 'Go to Drafts' },
        { keys: ['G', 'A'], description: 'Go to All Mail' },
        { keys: ['G', 'T'], description: 'Go to Trash' },
        { keys: ['G', 'R'], description: 'Go to Reply Queue' },
        { keys: ['G', 'E'], description: 'Go to Screener' },
        { keys: ['G', 'N'], description: 'Go to News Feed' },
      ],
    },
    {
      category: 'Actions',
      items: [
        { keys: ['C'], description: 'Compose new email' },
        { keys: ['/'], description: 'Search emails' },
        {
          keys: ['⌘', 'K'],
          description: 'Command palette',
          windows: ['Ctrl', 'K'],
        },
        {
          keys: ['⌘', 'B'],
          description: 'Toggle sidebar',
          windows: ['Ctrl', 'B'],
        },
        { keys: ['Esc'], description: 'Close dialog' },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Keyboard Shortcuts</h2>
      <div className="space-y-6">
        {shortcuts.map((section) => (
          <div key={section.category}>
            <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
              {section.category}
            </h3>
            <div className="space-y-2">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Tip:</strong> Press{' '}
          <kbd className="px-1.5 py-0.5 text-xs bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded">
            ?
          </kbd>{' '}
          anytime to view this help
        </p>
      </div>
    </div>
  );
}
