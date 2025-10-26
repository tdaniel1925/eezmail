'use client';

/**
 * Audit Logs Filters Component
 * Advanced filtering for audit logs
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

interface AuditLogsFiltersProps {
  initialFilter: {
    action?: string;
    resourceType?: string;
    riskLevel?: string;
    search?: string;
  };
}

export function AuditLogsFilters({ initialFilter }: AuditLogsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page'); // Reset to page 1 when filtering
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/admin/audit-logs');
  };

  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search actor, action..."
            className="pl-10"
            defaultValue={initialFilter.search}
            onChange={(e) =>
              setTimeout(
                () => handleFilterChange('search', e.target.value),
                500
              )
            }
          />
        </div>

        {/* Risk Level */}
        <Select
          value={initialFilter.riskLevel || 'all'}
          onValueChange={(value) =>
            handleFilterChange('riskLevel', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk Levels</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Resource Type */}
        <Select
          value={initialFilter.resourceType || 'all'}
          onValueChange={(value) =>
            handleFilterChange('resourceType', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Resource Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="ticket">Ticket</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="gap-2"
          disabled={
            !initialFilter.action &&
            !initialFilter.resourceType &&
            !initialFilter.riskLevel &&
            !initialFilter.search
          }
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
