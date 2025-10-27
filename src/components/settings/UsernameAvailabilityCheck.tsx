'use client';

import { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsernameAvailabilityCheckProps {
  username: string;
  currentUsername?: string;
  onAvailabilityChange?: (available: boolean) => void;
}

export function UsernameAvailabilityCheck({
  username,
  currentUsername,
  onAvailabilityChange,
}: UsernameAvailabilityCheckProps) {
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't check if empty or same as current
    if (!username || username === currentUsername) {
      setAvailable(null);
      setError(null);
      onAvailabilityChange?.(false);
      return;
    }

    // Debounce the check
    const timer = setTimeout(async () => {
      setChecking(true);
      setError(null);

      try {
        const res = await fetch('/api/auth/username/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });

        const data = await res.json();

        if (res.ok) {
          setAvailable(data.available);
          setError(data.error || null);
          onAvailabilityChange?.(data.available);
        } else {
          setError(data.error || 'Failed to check availability');
          setAvailable(false);
          onAvailabilityChange?.(false);
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setError('Failed to check availability');
        setAvailable(false);
        onAvailabilityChange?.(false);
      } finally {
        setChecking(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [username, currentUsername, onAvailabilityChange]);

  if (!username || username === currentUsername) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-2 text-sm">
      {checking ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="text-gray-500">Checking availability...</span>
        </>
      ) : available === true ? (
        <>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400">
            Username is available
          </span>
        </>
      ) : available === false ? (
        <>
          <X className="h-4 w-4 text-red-500" />
          <span className="text-red-600 dark:text-red-400">
            {error || 'Username is taken'}
          </span>
        </>
      ) : null}
    </div>
  );
}
