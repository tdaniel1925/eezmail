'use client';

/**
 * Checkout Form Component
 * Multi-step checkout with Stripe Elements
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { CartWithItems } from '@/lib/ecommerce/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, User, MapPin } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CheckoutFormProps {
  cart: CartWithItems;
  userId: string;
}

function CheckoutFormInner({ cart, userId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'billing' | 'payment'>('billing');
  const [billingInfo, setBillingInfo] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  const handleBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartId: cart.id,
          billingInfo,
        }),
      });

      const { clientSecret, orderId } = await response.json();

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
        },
      });

      if (error) {
        console.error('[Payment] Error:', error);
        alert(error.message);
      }
    } catch (error) {
      console.error('[Checkout] Error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'billing') {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Billing Information</h2>
        </div>

        <form onSubmit={handleBillingSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              required
              value={billingInfo.name}
              onChange={(e) =>
                setBillingInfo({ ...billingInfo, name: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={billingInfo.email}
              onChange={(e) =>
                setBillingInfo({ ...billingInfo, email: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              required
              value={billingInfo.address}
              onChange={(e) =>
                setBillingInfo({ ...billingInfo, address: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                required
                value={billingInfo.city}
                onChange={(e) =>
                  setBillingInfo({ ...billingInfo, city: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                required
                value={billingInfo.state}
                onChange={(e) =>
                  setBillingInfo({ ...billingInfo, state: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                required
                value={billingInfo.zip}
                onChange={(e) =>
                  setBillingInfo({ ...billingInfo, zip: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                required
                value={billingInfo.country}
                onChange={(e) =>
                  setBillingInfo({ ...billingInfo, country: e.target.value })
                }
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Continue to Payment
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Payment Details</h2>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-6">
        <PaymentElement />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('billing')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : `Pay $${cart.totalAmount}`}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function CheckoutForm(props: CheckoutFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');

  // Load client secret on mount
  useState(() => {
    fetch('/api/checkout/setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartId: props.cart.id }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  });

  if (!clientSecret) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="animate-pulse">Loading checkout...</div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <CheckoutFormInner {...props} />
    </Elements>
  );
}
