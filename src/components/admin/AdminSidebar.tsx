'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Package,
  BarChart3,
  UserCog,
  Tag,
  Flag,
  ArrowLeft,
  Bug,
  Activity,
  Shield,
  TrendingUp,
  Zap,
  Database,
  LifeBuoy,
  BookOpen,
  ShoppingBag,
  AlertTriangle,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Customers', href: '/admin/customers', icon: UserCog },
  { name: 'Sales', href: '/admin/sales', icon: BarChart3 },
  { name: 'Pricing', href: '/admin/pricing', icon: Package },
  { name: 'Promotions', href: '/admin/promotions', icon: Tag },
  { name: 'Features', href: '/admin/features', icon: Flag },
];

const debugSection = [
  { name: 'Sync Jobs', href: '/admin/debug/sync-trace', icon: Database },
  { name: 'Connection Test', href: '/admin/debug/connection-test', icon: Zap },
  { name: 'Performance', href: '/admin/debug/profiler', icon: Activity },
  { name: 'Log Search', href: '/admin/debug/logs', icon: Bug },
];

const systemSection = [
  { name: 'Email Accounts', href: '/admin/email-accounts', icon: Mail },
  { name: 'Support Tickets', href: '/admin/support', icon: LifeBuoy },
  { name: 'Knowledge Base', href: '/admin/knowledge-base', icon: BookOpen },
  { name: 'Products', href: '/admin/products', icon: ShoppingBag },
  { name: 'Monitoring', href: '/admin/monitoring', icon: AlertTriangle },
  { name: 'Analytics', href: '/admin/analytics/advanced', icon: TrendingUp },
  { name: 'Privacy (GDPR)', href: '/admin/privacy', icon: Shield },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: (typeof navigation)[0]) => {
    const isActive =
      pathname === item.href ||
      (item.href !== '/admin' && pathname.startsWith(item.href));

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
      >
        <item.icon className="h-5 w-5" />
        {item.name}
      </Link>
    );
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage your SaaS platform
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {/* Main Section */}
        <div className="space-y-1">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Main
          </h3>
          {navigation.map(renderNavItem)}
        </div>

        {/* Debug Section */}
        <div className="space-y-1">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Debug Tools
          </h3>
          {debugSection.map(renderNavItem)}
        </div>

        {/* System Section */}
        <div className="space-y-1">
          <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            System
          </h3>
          {systemSection.map(renderNavItem)}
        </div>
      </nav>

      {/* Back to App */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to App
        </Link>
      </div>
    </div>
  );
}
