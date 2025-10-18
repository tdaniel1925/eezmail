'use client';

import { Tag } from 'lucide-react';

export function PromotionsManager() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Tag className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Manage Promotions in Stripe
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Create and manage promotion codes directly in your Stripe Dashboard for full control over discounts and coupons.
      </p>
      <a
        href="https://dashboard.stripe.com/coupons"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        Open Stripe Coupons
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
      
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          <strong>💡 Tip:</strong> Stripe Coupons automatically sync with your application through webhooks. Create percentage-based or fixed-amount discounts for any duration.
        </p>
      </div>
    </div>
  );
}

