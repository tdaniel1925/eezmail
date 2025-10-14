'use client';

import { useState } from 'react';
import { STRIPE_PLANS } from '@/lib/stripe/plans';
import { CheckoutButton as StripeCheckout } from '@/components/stripe/CheckoutButton';
import { CheckoutForm as SquareCheckout } from '@/components/square/CheckoutForm';
import type { PaymentProcessor } from '@/lib/payments/types';

export function PricingTable() {
  const [processor, setProcessor] = useState<PaymentProcessor>('stripe');

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-gray-600 mb-8">
          Select the perfect plan for your email management needs
        </p>

        {/* Payment Processor Toggle */}
        <div className="inline-flex items-center gap-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setProcessor('stripe')}
            className={`px-6 py-2 rounded-md transition-colors ${
              processor === 'stripe'
                ? 'bg-white shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pay with Stripe
          </button>
          <button
            onClick={() => setProcessor('square')}
            className={`px-6 py-2 rounded-md transition-colors ${
              processor === 'square'
                ? 'bg-white shadow-sm font-medium'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pay with Square
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
          <h3 className="text-2xl font-bold mb-2">Free</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {STRIPE_PLANS.free.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full bg-gray-300 text-gray-600 py-2 px-4 rounded-md cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="bg-white rounded-lg shadow-md p-8 border-2 border-primary relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
          <h3 className="text-2xl font-bold mb-2">Pro</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold">$15</span>
            <span className="text-gray-600">/month</span>
          </div>
          <ul className="space-y-3 mb-8">
            {STRIPE_PLANS.pro.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
          {processor === 'stripe' && STRIPE_PLANS.pro.priceId ? (
            <StripeCheckout priceId={STRIPE_PLANS.pro.priceId} planName="Pro" />
          ) : (
            <SquareCheckout
              planId={process.env.NEXT_PUBLIC_SQUARE_PLAN_ID_PRO_MONTHLY || ''}
              planName="Pro"
            />
          )}
        </div>

        {/* Team Plan */}
        <div className="bg-white rounded-lg shadow-md p-8 border-2 border-gray-200">
          <h3 className="text-2xl font-bold mb-2">Team</h3>
          <div className="mb-4">
            <span className="text-4xl font-bold">$12</span>
            <span className="text-gray-600">/user/month</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Minimum 5 users</p>
          <ul className="space-y-3 mb-8">
            {STRIPE_PLANS.team.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
          {processor === 'stripe' && STRIPE_PLANS.team.priceId ? (
            <StripeCheckout
              priceId={STRIPE_PLANS.team.priceId}
              planName="Team"
            />
          ) : (
            <SquareCheckout
              planId={process.env.NEXT_PUBLIC_SQUARE_PLAN_ID_TEAM_MONTHLY || ''}
              planName="Team"
            />
          )}
        </div>
      </div>
    </div>
  );
}
