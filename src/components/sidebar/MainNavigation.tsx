'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Calendar, CheckSquare, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OnboardingNavLink } from './OnboardingNavLink';

interface MainNavigationProps {
  isCollapsed?: boolean;
  pendingTasksCount?: number;
}

export function MainNavigation({
  isCollapsed = false,
  pendingTasksCount = 0,
}: MainNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/dashboard/contacts',
      icon: Users,
      label: 'Contacts',
      badge: null,
    },
    {
      href: '/dashboard/calendar',
      icon: Calendar,
      label: 'Calendar',
      badge: null,
    },
    {
      href: '/dashboard/scheduled',
      icon: Clock,
      label: 'Scheduled',
      badge: null,
    },
    {
      href: '/dashboard/tasks',
      icon: CheckSquare,
      label: 'Tasks',
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
    },
  ];

  return (
    <nav className="px-3 py-2 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
              isActive
                ? 'bg-primary/10 text-primary border-l-2 border-primary'
                : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 border-l-2 border-transparent',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <Icon size={20} className={cn(isActive && 'text-primary')} />

            {!isCollapsed && (
              <>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.badge !== null && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-semibold text-white bg-primary rounded-full"
                  >
                    {item.badge}
                  </motion.span>
                )}
              </>
            )}

            {isCollapsed && item.badge !== null && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center h-4 min-w-[16px] px-1 text-[10px] font-bold text-white bg-primary rounded-full border-2 border-white dark:border-gray-900">
                {item.badge}
              </span>
            )}

            {/* Tooltip for collapsed state */}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
                {item.badge !== null && ` (${item.badge})`}
              </div>
            )}
          </Link>
        );
      })}

      {/* Onboarding Link */}
      {!isCollapsed && <OnboardingNavLink />}
    </nav>
  );
}
