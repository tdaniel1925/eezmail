'use client';

import { use, useEffect, useState } from 'react';
import { EmailList } from '@/components/email/EmailList';
import type { Email, CustomFolder } from '@/db/schema';

interface FolderPageProps {
  params: Promise<{ folderId: string }>;
}

export default function FolderPage({ params }: FolderPageProps): JSX.Element {
  const { folderId } = use(params);
  const [folder, setFolder] = useState<CustomFolder | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch folder details and emails from database
    // For now, use mock data
    const loadData = async (): Promise<void> => {
      setIsLoading(true);

      // Mock folder data
      const mockFolder: CustomFolder = {
        id: folderId,
        userId: '1',
        name: 'Loading...',
        icon: '📁',
        color: 'gray',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setFolder(mockFolder);
      setEmails([]);
      setIsLoading(false);
    };

    loadData();
  }, [folderId]);

  return (
    <EmailList
      emails={emails}
      title={folder?.name || 'Custom Folder'}
      isLoading={isLoading}
    />
  );
}
