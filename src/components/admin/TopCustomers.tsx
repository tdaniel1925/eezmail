'use client';

import { useState, useEffect } from 'react';
import { Crown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Customer {
  id: string;
  email: string;
  tier: string;
  revenue: number;
  joinedAt: string;
}

export function TopCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/top-customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load top customers');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      enterprise: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
      professional: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
      starter: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
    };
    return colors[tier] || 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top Customers by Revenue
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your highest-value customers
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {customers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
            No customer data available yet
          </div>
        ) : (
          customers.map((customer, index) => (
            <div key={customer.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {customer.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Joined {formatDistanceToNow(new Date(customer.joinedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(customer.tier)}`}>
                  {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                </span>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${customer.revenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Lifetime Value
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

