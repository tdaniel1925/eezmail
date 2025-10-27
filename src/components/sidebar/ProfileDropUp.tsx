'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  User,
  Settings,
  Sliders,
  Keyboard,
  HelpCircle,
  MessageSquare,
  LogOut,
  Monitor,
  Languages,
  Bell,
  Volume2,
  Database,
  Phone,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePreferencesStore } from '@/stores/preferencesStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ProfileDropUpProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    role?: string; // Legacy role field
    roleHierarchy?: string; // New hierarchical role field
  };
  storage: {
    used: number;
    total: number;
  };
  onSignOut: () => void;
  onNavigate?: (path: string) => void;
  isCollapsed?: boolean;
}

export function ProfileDropUp({
  user,
  storage,
  onSignOut,
  onNavigate,
  isCollapsed = false,
}: ProfileDropUpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const {
    density,
    setDensity,
    language,
    desktopNotifications,
    toggleDesktopNotifications,
    soundEffects,
    toggleSoundEffects,
  } = usePreferencesStore();

  // Check if user is a system admin
  const isSystemAdmin =
    user.roleHierarchy === 'system_admin' ||
    user.roleHierarchy === 'system_super_admin' ||
    user.role === 'admin' || // Backwards compatibility
    user.role === 'super_admin';

  const storagePercent = (storage.used / storage.total) * 100;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isCollapsed) {
    return (
      <div className="px-3 py-3 border-t border-gray-200 dark:border-white/10">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold hover:bg-primary/20 transition-colors"
        >
          {getInitials(user.name)}
        </button>
      </div>
    );
  }

  return (
    <div className="relative border-t border-gray-200 dark:border-white/10">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-5 py-4 transition-all duration-200',
          'hover:bg-gray-100 dark:hover:bg-white/5',
          isOpen && 'bg-gray-100 dark:bg-white/5'
        )}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
          {getInitials(user.name)}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>

        {/* Chevron */}
        <ChevronUp
          size={16}
          className={cn(
            'flex-shrink-0 text-gray-500 transition-transform duration-200',
            !isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Drop-up Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 bottom-full mb-2 mx-3 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Storage Section */}
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Storage
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatBytes(storage.used)} of {formatBytes(storage.total)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${storagePercent}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      storagePercent > 90
                        ? 'bg-red-500'
                        : storagePercent > 75
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                    )}
                  />
                </div>
                <button
                  onClick={() => {
                    onNavigate?.('/dashboard/settings?tab=billing');
                    setIsOpen(false);
                  }}
                  className="mt-2 text-xs text-primary hover:underline"
                >
                  Manage Storage
                </button>
              </div>

              {/* Quick Actions */}
              <div className="py-2">
                {/* Admin Dashboard Link (only for system admins) */}
                {isSystemAdmin && (
                  <>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push('/admin');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      <Shield size={16} className="text-primary" />
                      <span>Admin Dashboard</span>
                    </button>
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  </>
                )}

                <MenuItem
                  icon={Settings}
                  label="Account Settings"
                  onClick={() => {
                    onNavigate?.('/dashboard/settings');
                    setIsOpen(false);
                  }}
                />
                <MenuItem
                  icon={Sliders}
                  label="Preferences"
                  onClick={() => {
                    onNavigate?.('/dashboard/settings?tab=ai-preferences');
                    setIsOpen(false);
                  }}
                />
                <MenuItem
                  icon={Keyboard}
                  label="Keyboard Shortcuts"
                  onClick={() => {
                    onNavigate?.('/dashboard/settings?tab=help');
                    setIsOpen(false);
                  }}
                />
                <MenuItem
                  icon={HelpCircle}
                  label="Help & Support"
                  onClick={() => {
                    onNavigate?.('/dashboard/settings?tab=help');
                    setIsOpen(false);
                  }}
                />
                <MenuItem
                  icon={Phone}
                  label="24/7 Phone Support"
                  onClick={() => {
                    // Copy phone number to clipboard
                    navigator.clipboard.writeText(
                      'TBD - Phone number to be provided'
                    );
                    setIsOpen(false);
                  }}
                />
                <MenuItem
                  icon={MessageSquare}
                  label="Send Feedback"
                  onClick={() => {
                    onNavigate?.('/dashboard/feedback');
                    setIsOpen(false);
                  }}
                />
              </div>

              {/* App Settings */}
              <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                {/* Density Toggle */}
                <div className="px-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Monitor
                        size={14}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Density
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {(['comfortable', 'default', 'compact'] as const).map(
                      (d) => (
                        <button
                          key={d}
                          onClick={() => setDensity(d)}
                          className={cn(
                            'flex-1 px-2 py-1 text-xs rounded transition-colors',
                            density === d
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          )}
                        >
                          {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Toggles */}
                <ToggleMenuItem
                  icon={Bell}
                  label="Desktop Notifications"
                  checked={desktopNotifications}
                  onChange={toggleDesktopNotifications}
                />
                <ToggleMenuItem
                  icon={Volume2}
                  label="Sound Effects"
                  checked={soundEffects}
                  onChange={toggleSoundEffects}
                />
              </div>

              {/* Sign Out */}
              <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                <MenuItem
                  icon={LogOut}
                  label="Sign Out"
                  onClick={() => {
                    onSignOut();
                    setIsOpen(false);
                  }}
                  variant="danger"
                />
              </div>

              {/* Version */}
              <div className="px-4 py-2 text-center text-[10px] text-gray-400 dark:text-gray-500">
                easeMail v1.0.0
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
interface MenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
        variant === 'danger'
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
      )}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
}

interface ToggleMenuItemProps {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleMenuItem({
  icon: Icon,
  label,
  checked,
  onChange,
}: ToggleMenuItemProps) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
    >
      <Icon size={16} />
      <span className="flex-1 text-left">{label}</span>
      <div
        className={cn(
          'w-9 h-5 rounded-full transition-colors relative',
          checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
    </button>
  );
}
