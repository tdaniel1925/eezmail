'use client';

import { formatDistanceToNow } from 'date-fns';
import { User, Crown, Zap } from 'lucide-react';

interface RecentSignupsProps {
  users: Array<{
    id: string;
    email: string;
    createdAt: string;
    tier: string;
  }>;
}

export function RecentSignups({ users }: RecentSignupsProps) {
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'professional':
      case 'enterprise':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'starter':
        return <Zap className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      enterprise: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    };

    return colors[tier as keyof typeof colors] || colors.free;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Signups
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Latest users who joined the platform
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <div key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getTierIcon(user.tier)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(user.tier)}`}
            >
              {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

