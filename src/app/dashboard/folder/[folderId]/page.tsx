'use client';

import { use, useEffect, useState } from 'react';
import { EmailList } from '@/components/email/EmailList';
import type { Email, CustomFolder } from '@/db/schema';
import { toast } from 'sonner';

interface FolderPageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderPage({ params }: FolderPageProps): JSX.Element {
  const { folderId } = use(params);
  const [folder, setFolder] = useState<CustomFolder | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setIsLoading(true);

        // Fetch folder details and emails from API
        const response = await fetch(
          `/api/email/folder/${folderId}?limit=50&offset=0`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch folder data');
        }

        const data = await response.json();

        if (data.success) {
          setFolder(data.folder);
          setEmails(data.emails);
        } else {
          throw new Error('Failed to fetch folder data');
        }
      } catch (error) {
        console.error('Error loading folder:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to load folder'
        );
        setFolder(null);
        setEmails([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [folderId]);

  return (
    <EmailList
      emails={emails}
      title={folder ? `${folder.icon} ${folder.name}` : 'Custom Folder'}
      isLoading={isLoading}
    />
  );
}
