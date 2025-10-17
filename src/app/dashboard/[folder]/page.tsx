import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface FolderPageProps {
  params: {
    folder: string;
  };
}

export default async function FolderPage({ params }: FolderPageProps) {
  const { folder } = params;

  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Map of folder names to display names
  const folderNames: Record<string, string> = {
    inbox: 'Inbox',
    'reply-queue': 'Reply Queue',
    screener: 'Screener',
    newsfeed: 'News Feed',
    starred: 'Starred',
    sent: 'Sent',
    drafts: 'Drafts',
    scheduled: 'Scheduled',
    all: 'All Mail',
    spam: 'Spam',
    trash: 'Trash',
    archived: 'Archive',
  };

  const folderDisplayName = folderNames[folder] || folder;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Folder Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {folderDisplayName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          View all emails in {folderDisplayName.toLowerCase()}
        </p>
      </div>

      {/* Email List Placeholder */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Email list for{' '}
              <span className="font-semibold">{folderDisplayName}</span> will
              appear here.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Folder ID:{' '}
              <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                {folder}
              </code>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
              This is a placeholder. The email filtering logic will be
              implemented here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
