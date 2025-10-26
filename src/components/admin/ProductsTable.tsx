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

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});

  const handleSync = async (productId: string) => {
    setSyncing((prev) => ({ ...prev, [productId]: true }));
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

      router.refresh();
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync product to Stripe');
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

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product');
      }

      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete product');
    }
  };

  const getProductTypeBadge = (type: string) => {
    const colors = {
      subscription: 'bg-purple-100 text-purple-800',
      one_time: 'bg-blue-100 text-blue-800',
      usage_based: 'bg-green-100 text-green-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Stripe</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No products found. Create your first product to get started.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow
                key={product.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                    {product.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </div>
                    )}
                    {product.category && (
                      <Badge variant="outline" className="mt-1 text-xs">
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
                    <div className="font-medium">
                      ${parseFloat(product.price || '0').toFixed(2)}
                    </div>
                    {product.billingInterval && (
                      <div className="text-xs text-gray-500">
                        per {product.billingInterval}
                      </div>
                    )}
                    {product.trialPeriodDays && product.trialPeriodDays > 0 && (
                      <div className="text-xs text-green-600">
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
                      <Badge variant="outline" className="text-green-600">
                        Synced
                      </Badge>
                      <a
                        href={`https://dashboard.stripe.com/products/${product.stripeProductId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Not synced
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
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
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product.id, product.name)}
                      title="Archive product"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
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
