'use client';

/**
 * Products Table Component
 * Displays products with Stripe sync status
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/db/schema';
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
import { Edit, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { InlineNotification } from '@/components/ui/inline-notification';

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const handleSync = async (productId: string) => {
    setSyncing((prev) => ({ ...prev, [productId]: true }));
    setNotification(null);
    try {
      const response = await fetch(
        `/api/admin/products/${productId}/sync-stripe`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to sync product');
      }

      setNotification({
        type: 'success',
        message: 'Product synced to Stripe successfully!',
      });
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Sync error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to sync product to Stripe',
      });
    } finally {
      setSyncing((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (
      !confirm(
        `Are you sure you want to archive "${productName}"? This will set its status to archived.`
      )
    ) {
      return;
    }

    setNotification(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      setNotification({
        type: 'success',
        message: `Product "${productName}" archived successfully!`,
      });
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error('Delete error:', error);
      setNotification({
        type: 'error',
        message: 'Failed to delete product',
      });
    }
  };

  const getProductTypeBadge = (type: string) => {
    const colors = {
      subscription: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      one_time: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      usage_based: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return (
      colors[type as keyof typeof colors] ||
      'bg-gray-500/20 text-gray-300 border-gray-500/30'
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'archived':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'draft':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div>
      {notification && (
        <div className="mb-4">
          <InlineNotification
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
          />
        </div>
      )}

      <div className="rounded-lg border border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-700/50 border-slate-700">
              <TableHead className="text-gray-300">Product</TableHead>
              <TableHead className="text-gray-300">Type</TableHead>
              <TableHead className="text-gray-300">Price</TableHead>
              <TableHead className="text-gray-300">Status</TableHead>
              <TableHead className="text-gray-300">Stripe</TableHead>
              <TableHead className="text-gray-300">Updated</TableHead>
              <TableHead className="text-right text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-gray-400"
                >
                  No products found. Create your first product to get started.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  className="hover:bg-slate-700/30 transition-colors border-slate-700"
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-400 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                      {product.category && (
                        <Badge
                          variant="outline"
                          className="mt-1 text-xs border-slate-600 text-gray-300"
                        >
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getProductTypeBadge(product.productType)}
                      variant="secondary"
                    >
                      {product.productType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">
                        ${parseFloat(product.price || '0').toFixed(2)}
                      </div>
                      {product.billingInterval && (
                        <div className="text-xs text-gray-400">
                          per {product.billingInterval}
                        </div>
                      )}
                      {product.trialPeriodDays &&
                        product.trialPeriodDays > 0 && (
                          <div className="text-xs text-green-400">
                            {product.trialPeriodDays} day trial
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusBadge(product.status || 'draft')}
                      variant="secondary"
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.stripeProductId ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-green-400 border-green-500/30"
                        >
                          Synced
                        </Badge>
                        <a
                          href={`https://dashboard.stripe.com/products/${product.stripeProductId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-gray-400 border-gray-500/30"
                      >
                        Not synced
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {product.updatedAt
                      ? formatDistanceToNow(new Date(product.updatedAt), {
                          addSuffix: true,
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSync(product.id)}
                        disabled={syncing[product.id]}
                        title="Sync to Stripe"
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${syncing[product.id] ? 'animate-spin' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/products/${product.id}/edit`)
                        }
                        title="Edit product"
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id, product.name)}
                        title="Archive product"
                        className="text-red-400 hover:text-red-300 hover:bg-slate-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
