'use client';

/**
 * Admin Subscription Management Page
 * Comprehensive subscription management with Stripe integration
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubscriptionsTable } from '@/components/admin/SubscriptionsTable';

type SubscriptionStats = {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  churnRate: number;
};

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState<SubscriptionStats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    churnRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadSubscriptions();
  }, [router]);

  async function loadSubscriptions() {
    try {
      const response = await fetch('/api/admin/subscriptions');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to load subscriptions');
      }
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setNotification({
        type: 'error',
        message: 'Failed to load subscriptions',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    setNotification(null);
    await loadSubscriptions();
    setNotification({
      type: 'success',
      message: 'Subscriptions refreshed successfully!',
    });
    setRefreshing(false);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      searchTerm === '' ||
      sub.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Inline Notification */}
        {notification && (
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
              <CreditCard className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Subscription Management
              </h1>
              <p className="text-sm text-gray-400">
                Manage user subscriptions and billing
              </p>
            </div>
          </div>

          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Subscriptions
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {loading ? '-' : stats.totalSubscriptions}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                All time subscriptions
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {loading ? '-' : stats.activeSubscriptions}
              </div>
              <p className="text-xs text-gray-400 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                ${loading ? '-' : stats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-400 mt-1">Recurring revenue</p>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Churn Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">
                {loading ? '-' : stats.churnRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email, name, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-400"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600 text-white">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        {loading ? (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-8 text-center">
            <div className="animate-pulse text-gray-400">
              Loading subscriptions...
            </div>
          </Card>
        ) : (
          <SubscriptionsTable
            subscriptions={filteredSubscriptions}
            onUpdate={loadSubscriptions}
            onNotification={setNotification}
          />
        )}
      </div>
    </div>
  );
}
