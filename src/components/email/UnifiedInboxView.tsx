'use client';

import { useState, useEffect } from 'react';
import { EmailList } from './EmailList';
import type { Email } from '@/db/schema';

interface UnifiedInboxViewProps {
  accounts: any[];
}

export function UnifiedInboxView({ accounts }: UnifiedInboxViewProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const fetchUnifiedEmails = async () => {
    try {
      setIsLoading(true);

      // Fetch emails from all accounts or specific account
      const response = await fetch(
        `/api/email/unified-inbox?accountId=${selectedAccountId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch unified inbox');
      }

      const data = await response.json();
      setEmails(data.emails || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching unified inbox:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnifiedEmails();
  }, [selectedAccountId]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with account filter */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 dark:border-gray-800 bg-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl">
            📬
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Unified Inbox</h2>
            <p className="text-sm text-gray-300">
              {selectedAccountId === 'all'
                ? `All ${accounts.length} accounts`
                : accounts.find((a) => a.id === selectedAccountId)
                    ?.emailAddress}
            </p>
          </div>
        </div>

        {/* Account filter dropdown */}
        <select
          value={selectedAccountId}
          onChange={(e) => setSelectedAccountId(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-600 bg-slate-700 text-white hover:bg-slate-600 transition-colors"
        >
          <option value="all">All Accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.emailAddress}
            </option>
          ))}
        </select>
      </div>

      {/* Email list */}
      <EmailList emails={emails} isLoading={isLoading} error={error} title="" />
    </div>
  );
}
