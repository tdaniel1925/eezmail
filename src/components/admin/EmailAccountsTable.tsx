'use client';

/**
 * Email Accounts Table Component
 * Display all email accounts with actions
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  TestTube,
  Activity,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EmailAccountsTableProps {
  accounts: Array<{
    account: {
      id: string;
      provider: string;
      email: string;
      status: string;
      lastSyncAt: Date | null;
      syncError: string | null;
      messagesCount: number | null;
    };
    user: {
      id: string;
      email: string;
      name: string | null;
    } | null;
  }>;
}

export function EmailAccountsTable({ accounts }: EmailAccountsTableProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'bg-green-100 text-green-800',
      syncing: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800',
      disconnected: 'bg-gray-100 text-gray-800',
    };
    return variants[status as keyof typeof variants] || variants.disconnected;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const triggerSync = async (accountId: string) => {
    setSyncing(accountId);
    try {
      await fetch(`/api/admin/email-accounts/${accountId}/sync`, {
        method: 'POST',
      });
      router.refresh();
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      alert('Failed to trigger sync');
    } finally {
      setSyncing(null);
    }
  };

  const testConnection = async (accountId: string) => {
    try {
      const response = await fetch(
        `/api/admin/email-accounts/${accountId}/test`,
        {
          method: 'POST',
        }
      );
      const result = await response.json();
      alert(
        result.success
          ? 'Connection test passed!'
          : `Connection test failed: ${result.error}`
      );
    } catch (error) {
      console.error('Failed to test connection:', error);
      alert('Failed to test connection');
    }
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Account</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Sync</TableHead>
            <TableHead>Messages</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No email accounts found
              </TableCell>
            </TableRow>
          ) : (
            accounts.map(({ account, user }) => (
              <TableRow key={account.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium">{account.email}</div>
                    {account.syncError && (
                      <div className="text-xs text-red-600 mt-1">
                        {account.syncError.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {user?.name || user?.email || 'Unknown'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {account.provider}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(account.status)}
                    <Badge
                      variant="secondary"
                      className={getStatusBadge(account.status)}
                    >
                      {account.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {account.lastSyncAt ? (
                    formatDistanceToNow(new Date(account.lastSyncAt), {
                      addSuffix: true,
                    })
                  ) : (
                    <span className="text-gray-400">Never</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {account.messagesCount?.toLocaleString() || 0}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => testConnection(account.id)}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => triggerSync(account.id)}
                      disabled={syncing === account.id}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${syncing === account.id ? 'animate-spin' : ''}`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/email-accounts/${account.id}`)
                      }
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
