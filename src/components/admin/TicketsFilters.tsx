'use client';

/**
 * Tickets Filters Component
 * Advanced filtering for support tickets
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

interface TicketsFiltersProps {
  initialFilter: {
    status?: string;
    priority?: string;
    assigned?: string;
    search?: string;
  };
}

export function TicketsFilters({ initialFilter }: TicketsFiltersProps) {
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
    router.push('/admin/support');
  };

  return (
    <div className="rounded-lg border bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
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

        {/* Status */}
        <Select
          value={initialFilter.status || 'all'}
          onValueChange={(value) =>
            handleFilterChange('status', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select
          value={initialFilter.priority || 'all'}
          onValueChange={(value) =>
            handleFilterChange('priority', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignment */}
        <Select
          value={initialFilter.assigned || 'all'}
          onValueChange={(value) =>
            handleFilterChange('assigned', value === 'all' ? '' : value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="me">Assigned to Me</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        <Button
          variant="outline"
          onClick={clearFilters}
          className="gap-2"
          disabled={
            !initialFilter.status &&
            !initialFilter.priority &&
            !initialFilter.assigned &&
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
