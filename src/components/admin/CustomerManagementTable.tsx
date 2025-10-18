'use client';

import { useState } from 'react';
import { Search, Crown, DollarSign } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import type { User } from '@/lib/admin/users';
import { cn } from '@/lib/utils';

interface CustomerManagementTableProps {
  customers: User[];
  total: number;
  page: number;
  totalPages: number;
}

export function CustomerManagementTable({ customers, total, page, totalPages }: CustomerManagementTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedTier, setSelectedTier] = useState(searchParams.get('tier') || 'all');

  const handleSearch = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const handleFilterChange = (value: string) => {
    setSelectedTier(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value !== 'all') {
      params.set('tier', value);
    } else {
      params.delete('tier');
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      starter: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      enterprise: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getTierPrice = (tier: string) => {
    const prices: Record<string, number> = {
      starter: 15,
      professional: 35,
      enterprise: 200,
    };
    return prices[tier] || 0;
  };

  const calculateLTV = (tier: string, joinedAt: string) => {
    const monthsActive = Math.max(1, Math.round(
      (Date.now() - new Date(joinedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));
    return getTierPrice(tier) * monthsActive;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Tiers</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Showing {customers.length} paying customers
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MRR
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  LTV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer Since
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {customer.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {customer.emailCount.toLocaleString()} emails
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getTierBadge(customer.tier))}>
                      {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ${getTierPrice(customer.tier)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    ${calculateLTV(customer.tier, customer.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

