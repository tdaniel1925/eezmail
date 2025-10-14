'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  Sparkles,
  Newspaper,
  FileText,
  Clock,
  Package,
  Mail,
  Send,
  FileEdit,
  Star,
  Archive,
  Trash2,
  Tag,
  Settings,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  color?: string;
}

export function Sidebar({ collapsed = false }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const [isHeyExpanded, setIsHeyExpanded] = useState(true);
  const [isFoldersExpanded, setIsFoldersExpanded] = useState(true);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);

  // Hey Views
  const heyViews: NavItem[] = [
    {
      label: 'Screener',
      href: '/dashboard/screener',
      icon: Sparkles,
      badge: 12,
      color: 'text-purple-600',
    },
    {
      label: 'Imbox',
      href: '/dashboard/imbox',
      icon: Inbox,
      badge: 23,
      color: 'text-imbox-gold',
    },
    {
      label: 'The Feed',
      href: '/dashboard/feed',
      icon: Newspaper,
      badge: 156,
      color: 'text-feed-green',
    },
    {
      label: 'Paper Trail',
      href: '/dashboard/paper-trail',
      icon: FileText,
      badge: 45,
      color: 'text-paper-blue',
    },
    {
      label: 'Reply Later',
      href: '/dashboard/reply-later',
      icon: Clock,
      badge: 8,
      color: 'text-orange-600',
    },
    {
      label: 'Set Aside',
      href: '/dashboard/set-aside',
      icon: Package,
      badge: 3,
      color: 'text-gray-600',
    },
  ];

  // Traditional Folders
  const folders: NavItem[] = [
    { label: 'Inbox', href: '/dashboard/inbox', icon: Mail },
    { label: 'Sent', href: '/dashboard/sent', icon: Send },
    { label: 'Drafts', href: '/dashboard/drafts', icon: FileEdit, badge: 2 },
    { label: 'Starred', href: '/dashboard/starred', icon: Star },
    { label: 'Archive', href: '/dashboard/archive', icon: Archive },
    { label: 'Trash', href: '/dashboard/trash', icon: Trash2 },
  ];

  // Custom Labels (mock data)
  const labels: NavItem[] = [
    {
      label: 'Work',
      href: '/dashboard/label/work',
      icon: Tag,
      color: 'text-green-600',
    },
    {
      label: 'Personal',
      href: '/dashboard/label/personal',
      icon: Tag,
      color: 'text-blue-600',
    },
    {
      label: 'Urgent',
      href: '/dashboard/label/urgent',
      icon: Tag,
      color: 'text-red-600',
    },
  ];

  const renderNavItem = (item: NavItem): JSX.Element => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    if (collapsed) {
      return (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'relative flex h-12 w-full items-center justify-center rounded-lg transition-colors',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
          )}
        >
          <Icon className={cn('h-5 w-5', item.color)} />
          {item.badge && item.badge > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </Link>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 border border-transparent',
          isActive
            ? 'bg-white/10 border-white/20 text-white font-medium backdrop-blur-sm'
            : 'text-white/70 hover:bg-white/5 hover:border-white/10 hover:text-white'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', item.color)} />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && item.badge > 0 && (
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/10 px-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/10">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </Link>
    );
  };

  if (collapsed) {
    return (
      <div className="flex h-full flex-col gap-2 p-2">
        {[...heyViews, ...folders].map((item) => renderNavItem(item))}
        <Link
          href="/dashboard/settings"
          className="mt-auto flex h-12 w-full items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Account Selector */}
      <div className="border-b border-white/10 p-4">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 backdrop-blur-md p-2 text-left transition-all duration-200 hover:bg-white/10 hover:border-white/20"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-600 text-white">
            <span className="text-sm font-semibold">TD</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              work@example.com
            </p>
            <p className="text-xs text-white/60">Active</p>
          </div>
          <ChevronDown className="h-4 w-4 text-white/60" />
        </button>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 py-2 text-sm font-medium text-white/70 transition-all duration-200 hover:border-white/30 hover:bg-white/5 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {/* Hey Views Section */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setIsHeyExpanded(!isHeyExpanded)}
            className="mb-2 flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50"
          >
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform',
                !isHeyExpanded && '-rotate-90'
              )}
            />
            Hey Views
          </button>
          {isHeyExpanded && (
            <div className="space-y-1">
              {heyViews.map((item) => renderNavItem(item))}
            </div>
          )}
        </div>

        {/* Folders Section */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setIsFoldersExpanded(!isFoldersExpanded)}
            className="mb-2 flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50"
          >
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform',
                !isFoldersExpanded && '-rotate-90'
              )}
            />
            Folders
          </button>
          {isFoldersExpanded && (
            <div className="space-y-1">
              {folders.map((item) => renderNavItem(item))}
            </div>
          )}
        </div>

        {/* Labels Section */}
        <div>
          <button
            type="button"
            onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
            className="mb-2 flex w-full items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50"
          >
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform',
                !isLabelsExpanded && '-rotate-90'
              )}
            />
            Labels
          </button>
          {isLabelsExpanded && (
            <div className="space-y-1">
              {labels.map((item) => renderNavItem(item))}
               <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all duration-200 hover:bg-white/5 hover:text-white border border-dashed border-white/20 hover:border-white/30"
              >
                <Plus className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">Add Label</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Settings */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200 border border-transparent',
            pathname === '/dashboard/settings'
              ? 'bg-white/10 border-white/20 text-white font-medium backdrop-blur-sm'
              : 'text-white/70 hover:bg-white/5 hover:border-white/10 hover:text-white'
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
