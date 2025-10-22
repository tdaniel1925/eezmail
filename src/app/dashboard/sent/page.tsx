'use client';

import { useEffect, useState } from 'react';
import { EmailList } from '@/components/email/EmailList';

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
    <EmailList
      emails={emails}
      title="Sent"
      isLoading={isLoading}
      error={error || undefined}
      onRefresh={handleRefresh}
      isSyncing={isLoading}
    />
  );
}
