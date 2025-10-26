'use client';

/**
 * Cart Summary Component
 * Displays cart items and totals
 */

import type { CartWithItems } from '@/lib/ecommerce/cart';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface CartSummaryProps {
  cart: CartWithItems;
}

export function CartSummary({ cart }: CartSummaryProps) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm sticky top-6">
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm">{item.product.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
              <Badge variant="outline" className="mt-1">
                {item.product.productType}
              </Badge>
            </div>
            <div className="text-right">
              <div className="font-medium">
                $
                {(
                  parseFloat(item.product.price || '0') * item.quantity
                ).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                ${parseFloat(item.product.price || '0').toFixed(2)} each
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">${cart.subtotal}</span>
        </div>
        {parseFloat(cart.discountAmount || '0') > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${cart.discountAmount}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">${cart.taxAmount}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total</span>
          <span>${cart.totalAmount}</span>
        </div>
      </div>

      {/* Security Badge */}
      <div className="mt-6 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Secure checkout powered by Stripe</span>
        </div>
      </div>
    </div>
  );
}
