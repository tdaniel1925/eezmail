'use client';

import { useState } from 'react';

export function SubscriptionManager() {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/square/cancel-subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert('Subscription canceled successfully');
      window.location.reload();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel subscription');
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
