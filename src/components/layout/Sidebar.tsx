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
  MailboxIcon,
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
      label: 'Unified Inbox',
      href: '/dashboard/unified-inbox',
      icon: MailboxIcon,
      badge: null,
      active: pathname === '/dashboard/unified-inbox',
    },
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
    <div className="flex h-full flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b] border-r border-[var(--border-color)] shadow-2xl">
      {/* Logo & Compose */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-xl">
            ✉️
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            eeZmail
          </h1>
        </div>
        <ComposeButton
          variant="sidebar"
          className="!bg-[var(--accent-blue)] hover:!bg-[var(--accent-blue-hover)] !rounded-xl !py-3.5 !px-5 !text-[15px] hover:!shadow-lg hover:!shadow-blue-500/30 hover:!-translate-y-0.5"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 overflow-y-auto">
        {/* Smart Views Section */}
        <div className="mb-6">
          <div className="px-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
              Smart Views
            </span>
          </div>
          {mainViews.map((view) => {
            const Icon = view.icon;
            return (
              <Link
                key={view.href}
                href={view.href}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200',
                  view.active
                    ? 'bg-white/25 text-white font-semibold'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span className="text-sm">{view.label}</span>
                </div>
                {view.badge !== null && view.badge !== undefined && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-blue)] text-white">
                    {view.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Traditional Folders Section */}
        <div className="mb-6">
          <div className="px-3 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
              Other
            </span>
          </div>
          {folders.map((folder) => {
            const Icon = folder.icon;
            return (
              <Link
                key={folder.href}
                href={folder.href}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200',
                  folder.active
                    ? 'bg-white/25 text-white font-semibold'
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span className="text-sm">{folder.label}</span>
                </div>
                {folder.badge !== null && folder.badge !== undefined && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-blue)] text-white">
                    {folder.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Custom Folders Section */}
        {customFolders.length > 0 && (
          <div className="mb-6">
            <div className="px-3 mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
                Custom Folders
              </span>
              <Link
                href="/dashboard/settings?tab=folders"
                className="text-[10px] text-[var(--accent-blue)] hover:text-white transition-colors"
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
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200',
                    isActive
                      ? 'bg-white/25 text-white font-semibold'
                      : 'text-white/80 hover:bg-white/15 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{folder.icon}</span>
                    <span className="text-sm">{folder.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="flex-shrink-0" />

      {/* Quick Actions */}
      <div className="px-4 pb-2">
        <div className="space-y-1">
          <Link
            href="/dashboard/settings"
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200"
          >
            <Settings size={16} />
            <span className="text-sm">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
