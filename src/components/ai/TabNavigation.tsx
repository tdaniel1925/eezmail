'use client';

import { MessageSquare, Sparkles, Zap } from 'lucide-react';
import { TabType } from '@/stores/aiPanelStore';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasEmailSelected: boolean;
}

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  hasEmailSelected,
}: TabNavigationProps): JSX.Element {
  const tabs: Tab[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: Sparkles,
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: Zap,
    },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex -mb-px" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'group relative flex-1 flex items-center justify-center gap-1.5 px-1 py-3 text-xs font-medium border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary dark:text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
