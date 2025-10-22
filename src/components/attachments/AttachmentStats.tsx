'use client';

import {
  FileText,
  HardDrive,
  Download,
  Clock,
  TrendingUp,
  FileImage,
  FileVideo,
  FileArchive,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EmailAttachment } from '@/db/schema';

interface AttachmentStatsProps {
  attachments: EmailAttachment[];
}

export function AttachmentStats({ attachments }: AttachmentStatsProps) {
  // Calculate statistics
  const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
  const totalDownloads = attachments.reduce(
    (sum, att) => sum + att.downloadCount,
    0
  );

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  };

  // Get most downloaded
  const mostDownloaded = [...attachments].sort(
    (a, b) => b.downloadCount - a.downloadCount
  )[0];

  // Get recently added (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentlyAdded = attachments.filter(
    (att) => new Date(att.createdAt) > sevenDaysAgo
  ).length;

  // Category breakdown
  const categories = attachments.reduce(
    (acc, att) => {
      if (att.contentType.startsWith('image/')) acc.images++;
      else if (att.contentType.startsWith('video/')) acc.videos++;
      else if (att.contentType === 'application/pdf') acc.pdfs++;
      else if (
        att.contentType.includes('zip') ||
        att.contentType.includes('rar')
      )
        acc.archives++;
      else acc.other++;
      return acc;
    },
    { images: 0, videos: 0, pdfs: 0, archives: 0, other: 0 }
  );

  const stats = [
    {
      name: 'Total Files',
      value: attachments.length.toLocaleString(),
      icon: FileText,
      color: 'blue',
      change: recentlyAdded > 0 ? `+${recentlyAdded} this week` : undefined,
    },
    {
      name: 'Total Size',
      value: formatSize(totalSize),
      icon: HardDrive,
      color: 'purple',
      subtext: `${formatSize(totalSize / attachments.length || 0)} avg`,
    },
    {
      name: 'Total Downloads',
      value: totalDownloads.toLocaleString(),
      icon: Download,
      color: 'green',
      subtext: mostDownloaded
        ? `"${mostDownloaded.filename.substring(0, 20)}..." (${mostDownloaded.downloadCount})`
        : 'No downloads yet',
    },
    {
      name: 'Recently Added',
      value: recentlyAdded.toString(),
      icon: Clock,
      color: 'orange',
      subtext: 'Last 7 days',
    },
  ];

  const categoryCards = [
    {
      name: 'Images',
      count: categories.images,
      icon: FileImage,
      color: 'purple',
    },
    {
      name: 'Videos',
      count: categories.videos,
      icon: FileVideo,
      color: 'red',
    },
    { name: 'PDFs', count: categories.pdfs, icon: FileText, color: 'red' },
    {
      name: 'Archives',
      count: categories.archives,
      icon: FileArchive,
      color: 'yellow',
    },
    { name: 'Other', count: categories.other, icon: File, color: 'gray' },
  ];

  const colorClasses: Record<
    string,
    { bg: string; text: string; icon: string }
  > = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'text-purple-600',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-600',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'text-orange-600',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-600',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'text-yellow-600',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
      icon: 'text-gray-600',
    },
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];

          return (
            <div
              key={stat.name}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  {(stat.change || stat.subtext) && (
                    <p
                      className={cn(
                        'text-xs mt-2',
                        stat.change
                          ? 'text-green-600 dark:text-green-400 flex items-center gap-1'
                          : 'text-gray-500 dark:text-gray-400 truncate'
                      )}
                    >
                      {stat.change && <TrendingUp className="h-3 w-3" />}
                      {stat.change || stat.subtext}
                    </p>
                  )}
                </div>
                <div className={cn('rounded-lg p-3', colors.bg)}>
                  <Icon className={cn('h-6 w-6', colors.icon)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          File Categories
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {categoryCards.map((category) => {
            const Icon = category.icon;
            const colors = colorClasses[category.color];

            return (
              <div
                key={category.name}
                className="flex flex-col items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className={cn('rounded-lg p-2 mb-2', colors.bg)}>
                  <Icon className={cn('h-6 w-6', colors.icon)} />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {category.count}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {category.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
