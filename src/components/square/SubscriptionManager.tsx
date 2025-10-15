'use client';

import { useState } from 'react';
import { toast, confirmDialog } from '@/lib/toast';

export function SubscriptionManager() {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    const confirmed = await confirmDialog(
      'Are you sure you want to cancel your subscription?'
    );
    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/square/cancel-subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Subscription canceled successfully');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Canceling...' : 'Cancel subscription'}
    </button>
  );
}
