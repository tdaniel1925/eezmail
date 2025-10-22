'use client';

import { useEffect, useState } from 'react';
import { EmailList } from '@/components/email/EmailList';
import { Send } from 'lucide-react';

interface SentEmail {
  id: string;
  subject: string;
  toAddresses: any[];
  receivedAt: string;
  bodyPreview: string;
  isRead: boolean;
  hasAttachments: boolean;
  folderName: string;
}

export default function SentPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSentEmails() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/email/sent?limit=50');

        if (!response.ok) {
          throw new Error('Failed to fetch sent emails');
        }

        const data = await response.json();

        if (data.success) {
          setEmails(data.emails || []);
        } else {
          throw new Error(data.error || 'Failed to fetch sent emails');
        }
      } catch (err) {
        console.error('Error fetching sent emails:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSentEmails();
  }, []);

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/email/sent?limit=50');

      if (!response.ok) {
        throw new Error('Failed to fetch sent emails');
      }

      const data = await response.json();

      if (data.success) {
        setEmails(data.emails || []);
      } else {
        throw new Error(data.error || 'Failed to fetch sent emails');
      }
    } catch (err) {
      console.error('Error fetching sent emails:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Send className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Sent
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {emails.length} {emails.length === 1 ? 'email' : 'emails'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="flex-1 overflow-hidden">
        <EmailList
          emails={emails}
          title="Sent"
          isLoading={isLoading}
          error={error || undefined}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
