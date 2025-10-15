'use client';

import { EmailLayout } from '@/components/layout/EmailLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmailList } from '@/components/email/EmailList';
import type { Email } from '@/db/schema';

const mockArchivedEmails: Email[] = [];

export default function ArchivePage(): JSX.Element {
  return (
    <EmailLayout
      sidebar={<Sidebar />}
      emailList={
        <EmailList
          emails={mockArchivedEmails}
          title="Archive"
          isLoading={false}
        />
      }
    />
  );
}
