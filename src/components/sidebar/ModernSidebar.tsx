'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/stores/sidebarStore';
import { AccountSelector } from './AccountSelector';
import { MainNavigation } from './MainNavigation';
import { FolderList } from './FolderList';
import { ProfileDropUp } from './ProfileDropUp';
import type { EmailAccount } from '@/db/schema';

interface ModernSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  accounts: EmailAccount[];
  currentAccountId: string | null;
  storage?: {
    used: number;
    total: number;
  };
  onAccountChange: (accountId: string) => void;
  onAddAccount: () => void;
  onSignOut: () => void;
  pendingTasksCount?: number;
}

export function ModernSidebar({
  user,
  accounts,
  currentAccountId,
  storage = { used: 0, total: 15 * 1024 * 1024 * 1024 }, // Default 15GB
  onAccountChange,
  onAddAccount,
  onSignOut,
  pendingTasksCount = 0,
}: ModernSidebarProps) {
  const router = useRouter();
  const { isCollapsed, width, toggleCollapse, setWidth } = useSidebarStore();
  const [isResizing, setIsResizing] = useState(false);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 400) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setWidth]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : width,
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut',
        }}
        className={cn(
          'relative flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/10',
          'overflow-hidden'
        )}
        style={{
          width: isCollapsed ? 80 : width,
        }}
      >
        {/* Header with Collapse Button - 64px height to match other columns */}
        <div className="relative flex h-16 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
          {/* Collapse Button - Left aligned when expanded */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors mr-3"
              title="Collapse sidebar"
            >
              <PanelLeftClose
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </button>
          )}

          {/* Logo - Centered */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center flex-1"
            >
              <Image
                src="/easemail-logo.png"
                alt="easeMail"
                width={140}
                height={32}
                className="h-8"
                style={{ width: 'auto' }}
                priority
              />
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 -mt-0.5">
                by BotMakers
              </p>
            </motion.div>
          )}

          {/* Expand Button - Centered when collapsed */}
          {isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="mx-auto rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeft
                size={20}
                className="text-gray-600 dark:text-gray-400"
              />
            </button>
          )}
        </div>

        {/* Account Selector */}
        <AccountSelector
          accounts={accounts}
          currentAccountId={currentAccountId}
          onAccountChange={onAccountChange}
          onAddAccount={onAddAccount}
          isCollapsed={isCollapsed}
        />

        {/* Folder List */}
        <FolderList isCollapsed={isCollapsed} />

        {/* Main Navigation - Contacts, Calendar, Tasks */}
        <div className="border-t border-gray-200 dark:border-white/10">
          <MainNavigation
            isCollapsed={isCollapsed}
            pendingTasksCount={pendingTasksCount}
          />
        </div>

        {/* Profile Drop-up */}
        <ProfileDropUp
          user={user}
          storage={storage}
          onSignOut={onSignOut}
          onNavigate={handleNavigate}
          isCollapsed={isCollapsed}
        />

        {/* Resize Handle */}
        {!isCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 transition-colors z-50',
              isResizing && 'bg-primary'
            )}
          />
        )}
      </motion.aside>

      {/* Resize Overlay */}
      {isResizing && <div className="fixed inset-0 z-40 cursor-col-resize" />}
    </>
  );
}
