'use client';

import { Bot, FileText, Zap, Users } from 'lucide-react';
import { TabType } from '@/stores/aiPanelStore';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasEmailSelected: boolean;
  hasThread?: boolean; // Whether the selected email is part of a thread
}

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  showPlaceholder?: boolean;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  hasEmailSelected,
  hasThread = false,
}: TabNavigationProps): JSX.Element {
  const tabs: Tab[] = [
    {
      id: 'assistant',
      label: 'AI',
      icon: Bot,
    },
    {
      id: 'thread',
      label: 'Threads',
      icon: FileText,
      showPlaceholder: !hasThread, // Only enable if email has a thread
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: Zap,
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
    },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex -mb-px" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDisabled = tab.showPlaceholder;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                'group relative flex-1 flex items-center justify-center gap-1.5 px-1 py-3 text-xs font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary dark:text-primary'
                  : isDisabled
                    ? 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={isDisabled}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline truncate">{tab.label}</span>

              {/* Tooltip for disabled tabs */}
              {isDisabled && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded py-1 px-2 whitespace-nowrap">
                    Select an email with a thread
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
