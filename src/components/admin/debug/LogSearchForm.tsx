'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface LogSearchFormProps {
  initialParams: {
    query?: string;
    level?: string;
    service?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function LogSearchForm({ initialParams }: LogSearchFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    query: initialParams.query || '',
    level: initialParams.level || 'all',
    service: initialParams.service || 'all',
    userId: initialParams.userId || '',
    startDate: initialParams.startDate || '',
    endDate: initialParams.endDate || '',
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (formData.query) params.set('query', formData.query);
    if (formData.level !== 'all') params.set('level', formData.level);
    if (formData.service !== 'all') params.set('service', formData.service);
    if (formData.userId) params.set('userId', formData.userId);
    if (formData.startDate) params.set('startDate', formData.startDate);
    if (formData.endDate) params.set('endDate', formData.endDate);

    router.push(`/admin/debug/logs?${params.toString()}`);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <Label htmlFor="query">Search Query</Label>
              <Input
                id="query"
                value={formData.query}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, query: e.target.value }))
                }
                placeholder="Search logs..."
              />
            </div>

            <div>
              <Label htmlFor="level">Log Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, level: value }))
                }
              >
                <SelectTrigger id="level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="service">Service</Label>
              <Select
                value={formData.service}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, service: value }))
                }
              >
                <SelectTrigger id="service">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="email-sync">Email Sync</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="background-jobs">
                    Background Jobs
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, userId: e.target.value }))
                }
                placeholder="Filter by user ID"
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="gap-2">
              <Search className="h-4 w-4" />
              Search Logs
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  query: '',
                  level: 'all',
                  service: 'all',
                  userId: '',
                  startDate: '',
                  endDate: '',
                });
                router.push('/admin/debug/logs');
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
