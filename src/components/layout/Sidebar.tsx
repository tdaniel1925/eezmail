'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  Mail,
  Send,
  FileEdit,
  Star,
  Archive,
  Trash2,
  Sparkles,
  Newspaper,
  Calendar,
  Users,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComposeButton } from '@/components/email/ComposeButton';
import type { CustomFolder } from '@/db/schema';

interface SidebarProps {
  collapsed?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | null;
  active?: boolean;
}

export function Sidebar({
  collapsed = false,
}: SidebarProps): JSX.Element | null {
  const pathname = usePathname();
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>([]);

  // Fetch custom folders
  useEffect(() => {
    // TODO: Fetch real folders from database
    // For now, use empty array
    setCustomFolders([]);
  }, []);

  // Main Views - AI-powered email organization
  const mainViews: NavItem[] = [
    {
      label: 'Inbox',
      href: '/dashboard/inbox',
      icon: Inbox,
      badge: 23,
      active: pathname === '/dashboard/inbox',
    },
    {
      label: 'Screener',
      href: '/dashboard/screener',
      icon: Sparkles,
      badge: 12,
      active: pathname === '/dashboard/screener',
    },
    {
      label: 'NewsFeed',
      href: '/dashboard/newsfeed',
      icon: Newspaper,
      badge: 156,
      active: pathname === '/dashboard/newsfeed',
    },
    {
      label: 'Receipts',
      href: '/dashboard/receipts',
      icon: Mail,
      badge: 8,
      active: pathname === '/dashboard/receipts',
    },
  ];

  // Traditional folders
  const folders: NavItem[] = [
    {
      label: 'Starred',
      href: '/dashboard/starred',
      icon: Star,
      badge: 3,
      active: pathname === '/dashboard/starred',
    },
    {
      label: 'Sent',
      href: '/dashboard/sent',
      icon: Send,
      badge: null,
      active: pathname === '/dashboard/sent',
    },
    {
      label: 'Drafts',
      href: '/dashboard/drafts',
      icon: FileEdit,
      badge: 2,
      active: pathname === '/dashboard/drafts',
    },
    {
      label: 'Archive',
      href: '/dashboard/archive',
      icon: Archive,
      badge: null,
      active: pathname === '/dashboard/archive',
    },
    {
      label: 'Trash',
      href: '/dashboard/trash',
      icon: Trash2,
      badge: null,
      active: pathname === '/dashboard/trash',
    },
  ];

  if (collapsed) {
    return null; // Keep it simple for now
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo & Compose */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Mail className="text-white" size={16} />
          </div>
          <h1 className="text-base font-bold text-gray-800 dark:text-white">
            eezMail
          </h1>
        </div>
        <ComposeButton variant="sidebar" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {/* Hey Views Section */}
        <div className="mb-4">
          <div className="px-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Hey Views
            </span>
          </div>
          {mainViews.map((view) => {
            const Icon = view.icon;
            return (
              <Link
                key={view.href}
                href={view.href}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 transition-all duration-200',
                  view.active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span className="text-sm font-medium">{view.label}</span>
                </div>
                {view.badge !== null && view.badge !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      view.active
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {view.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Traditional Folders Section */}
        <div>
          <div className="px-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Folders
            </span>
          </div>
          {folders.map((folder) => {
            const Icon = folder.icon;
            return (
              <Link
                key={folder.href}
                href={folder.href}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 transition-all duration-200',
                  folder.active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  <span className="text-sm font-medium">{folder.label}</span>
                </div>
                {folder.badge !== null && folder.badge !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                      folder.active
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    )}
                  >
                    {folder.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Custom Folders Section */}
        {customFolders.length > 0 && (
          <div className="mt-4">
            <div className="px-2 mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Custom Folders
              </span>
              <Link
                href="/dashboard/settings?tab=folders"
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage
              </Link>
            </div>
            {customFolders.map((folder) => {
              const isActive = pathname === `/dashboard/folder/${folder.id}`;
              return (
                <Link
                  key={folder.id}
                  href={`/dashboard/folder/${folder.id}`}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{folder.icon}</span>
                    <span className="text-sm font-medium">{folder.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Quick Actions */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-0.5 mb-2">
          <Link
            href="/dashboard/calendar"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Calendar size={16} />
            <span className="text-sm font-medium">Calendar</span>
          </Link>
          <Link
            href="/dashboard/contacts"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Users size={16} />
            <span className="text-sm font-medium">Contacts</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <Settings size={16} />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
            TD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">
              John Doe
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              john@example.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
