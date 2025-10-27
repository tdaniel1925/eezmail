'use client';

/**
 * Customer Management Page
 * Manage paying customers and their subscriptions
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Users,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { InlineNotification } from '@/components/ui/inline-notification';
import { formatDistanceToNow, format } from 'date-fns';

type Customer = {
  id: string;
  userId: string;
  tier: string;
  status: string;
  monthlyAmount: string;
  seats: number;
  startDate: string;
  processorSubscriptionId: string | null;
  user: {
    name: string | null;
    email: string;
  };
};

export default function CustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    monthlyRevenue: 0,
    averageValue: 0,
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const fetchCustomers = async () => {
    setRefreshing(true);
    setNotification(null);
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
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      
      // Only include paying customers (active or trialing)
      const payingCustomers = (data.subscriptions || []).filter(
        (sub: Customer) =>
          sub.status === 'active' || sub.status === 'trialing'
      );

      setCustomers(payingCustomers);

      // Calculate stats
      const activeCount = payingCustomers.filter(
        (c: Customer) => c.status === 'active'
      ).length;
      const totalRevenue = payingCustomers
        .filter((c: Customer) => c.status === 'active')
        .reduce((sum: number, c: Customer) => sum + parseFloat(c.monthlyAmount || '0'), 0);
      const avgValue = activeCount > 0 ? totalRevenue / activeCount : 0;

      setStats({
        totalCustomers: payingCustomers.length,
        activeCustomers: activeCount,
        monthlyRevenue: totalRevenue,
        averageValue: avgValue,
      });
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to load customers',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const getFilteredCustomers = () => {
    return customers.filter((customer) => {
      const matchesSearch =
        !searchTerm ||
        customer.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.user.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTier =
        tierFilter === 'all' || customer.tier === tierFilter;

      return matchesSearch && matchesTier;
    });
  };

  const filteredCustomers = getFilteredCustomers();

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'team':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'individual':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'trialing':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'past_due':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'canceled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Notification */}
        {notification && (
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Customer Management</h1>
            <p className="text-gray-400">Manage paying customers and subscriptions</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            disabled={refreshing}
            className="border-slate-600 text-gray-300 hover:bg-slate-700 hover:text-white"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Total Customers
              </CardTitle>
              <Users className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-white">
                {loading ? '-' : stats.totalCustomers}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Active Subscriptions
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-green-400">
                {loading ? '-' : stats.activeCustomers}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Monthly Revenue
              </CardTitle>
              <DollarSign className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-blue-400">
                {loading ? '-' : `$${stats.monthlyRevenue.toFixed(2)}`}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 mb-4">
              <CardTitle className="text-sm font-medium text-gray-400">
                Avg Customer Value
              </CardTitle>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-3xl font-bold text-purple-400">
                {loading ? '-' : `$${stats.averageValue.toFixed(2)}`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by email or name..."
                  className="w-full pl-9 bg-slate-700/50 border-slate-600 text-white placeholder:text-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-[200px] bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue placeholder="Filter by Tier" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Showing {filteredCustomers.length} of {customers.length} paying customers
            </p>
          </CardContent>
        </Card>

        {/* Customers Table */}
        {loading ? (
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-400" />
              <p className="text-gray-400 mt-2">Loading customers...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-700/50 border-slate-700">
                  <TableHead className="text-gray-300">Customer</TableHead>
                  <TableHead className="text-gray-300">Tier</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">MRR</TableHead>
                  <TableHead className="text-gray-300">Seats</TableHead>
                  <TableHead className="text-gray-300">Started</TableHead>
                  <TableHead className="text-right text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-400"
                    >
                      No paying customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-slate-700/30 transition-colors border-slate-700"
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">
                            {customer.user.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-400">
                            {customer.user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getTierBadge(customer.tier)}
                          variant="secondary"
                        >
                          {customer.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadge(customer.status)}
                          variant="secondary"
                        >
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-white">
                        ${parseFloat(customer.monthlyAmount || '0').toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {customer.seats > 0 ? `${customer.seats} seats` : 'Unlimited'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {formatDistanceToNow(new Date(customer.startDate), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.processorSubscriptionId && (
                          <a
                            href={`https://dashboard.stripe.com/subscriptions/${customer.processorSubscriptionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>
      )}
      </div>
    </div>
  );
}
