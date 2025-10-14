'use client';

import { useState } from 'react';

export function CustomerPortal() {
  const [loading, setLoading] = useState(false);

  const handlePortal = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open customer portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="text-primary hover:text-primary-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Loading...' : 'Manage subscription'}
    </button>
  );
}
