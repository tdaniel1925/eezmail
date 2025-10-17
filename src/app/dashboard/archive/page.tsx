'use client';

import { EmailList } from '@/components/email/EmailList';
import { ChatBot } from '@/components/ai/ChatBot';
import type { Email } from '@/db/schema';

const mockArchivedEmails: Email[] = [];

export default function ArchivePage(): JSX.Element {
  return (
    <>
      <EmailList
        emails={mockArchivedEmails}
        title="Archive"
        isLoading={false}
      />
      <ChatBot />
    </>
  );
}
