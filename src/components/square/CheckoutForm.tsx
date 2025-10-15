'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';

interface CheckoutFormProps {
  planId: string;
  planName: string;
  className?: string;
}

export function CheckoutForm({
  planId,
  planName,
  className,
}: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/square/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Subscription created! Redirecting...');
      // Redirect to success page or refresh
      setTimeout(() => {
        window.location.href = '/dashboard?success=true';
      }, 1000);
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={
        className ||
        'w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
      }
    >
      {loading ? 'Loading...' : `Subscribe to ${planName}`}
    </button>
  );
}
