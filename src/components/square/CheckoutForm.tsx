'use client';

import { useState } from 'react';

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
        alert(data.error);
        return;
      }

      // Redirect to success page or refresh
      window.location.href = '/dashboard?success=true';
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create subscription');
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
