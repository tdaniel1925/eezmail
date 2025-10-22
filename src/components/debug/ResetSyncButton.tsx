'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function ResetSyncButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm('Reset sync and fetch ALL emails from scratch? This may take a few minutes.')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/debug/reset-sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Success! ${data.message}`);
        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleReset}
        disabled={loading}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Resetting...' : 'Reset & Re-Sync All Emails'}
      </Button>
      {result && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{result}</p>
      )}
    </div>
  );
}



