'use client';

import { BarChart3, FileText, Eye, TrendingUp } from 'lucide-react';

interface KBStatsProps {
  stats: {
    total: number;
    published: number;
    draft: number;
    views: number;
  };
}

export function KBStats({ stats }: KBStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={FileText}
        label="Total Articles"
        value={stats.total}
        color="blue"
      />
      <StatCard
        icon={BarChart3}
        label="Published"
        value={stats.published}
        color="green"
      />
      <StatCard
        icon={TrendingUp}
        label="Drafts"
        value={stats.draft}
        color="yellow"
      />
      <StatCard
        icon={Eye}
        label="Total Views"
        value={stats.views.toLocaleString()}
        color="purple"
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
