/**
 * Admin Products Management Page
 * Manage products with automatic Stripe sync
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { products } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ProductsTable } from '@/components/admin/ProductsTable';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import Link from 'next/link';

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'super_admin' && userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get all products
  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products</h1>
              <p className="text-sm text-gray-500">
                Manage products with automatic Stripe synchronization
              </p>
            </div>
          </div>

          <Link href="/admin/products/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {allProducts.length}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {allProducts.filter((p) => p.status === 'active').length}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm font-medium text-gray-500">
              Synced to Stripe
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {allProducts.filter((p) => p.stripeProductId).length}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <p className="text-sm font-medium text-gray-500">Subscriptions</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {
                allProducts.filter((p) => p.productType === 'subscription')
                  .length
              }
            </p>
          </div>
        </div>

        {/* Products Table */}
        <Suspense
          fallback={
            <div className="rounded-lg border bg-white p-8 text-center">
              <div className="animate-pulse">Loading products...</div>
            </div>
          }
        >
          <ProductsTable products={allProducts} />
        </Suspense>
      </div>
    </div>
  );
}
