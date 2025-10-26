/**
 * Checkout Page
 * Multi-step checkout with Stripe Elements
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getOrCreateCart, getCartWithItems } from '@/lib/ecommerce/cart';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { CartSummary } from '@/components/checkout/CartSummary';
import { ShoppingCart } from 'lucide-react';

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/checkout');
  }

  const cart = await getOrCreateCart(user.id);
  const cartWithItems = await getCartWithItems(cart.id);

  if (!cartWithItems || cartWithItems.items.length === 0) {
    redirect('/products');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-500">
              Complete your purchase securely
            </p>
          </div>
        </div>

        {/* Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <CheckoutForm cart={cartWithItems} userId={user.id} />
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary cart={cartWithItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
