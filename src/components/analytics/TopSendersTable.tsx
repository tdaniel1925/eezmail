'use client';

import { Mail, Clock } from 'lucide-react';

interface TopSender {
  email: string;
  name: string;
  count: number;
  avgResponseTime: number;
}

interface TopSendersTableProps {
  senders: TopSender[];
}

export function TopSendersTable({ senders }: TopSendersTableProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Top Email Contacts
      </h3>
      <div className="space-y-3">
        {senders.slice(0, 5).map((sender, index) => (
          <div
            key={sender.email}
            className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {sender.name || sender.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {sender.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {sender.count}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {formatTime(sender.avgResponseTime)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
