'use client';

import { EmailList } from '@/components/email/EmailList';
import type { Email } from '@/db/schema';

// Mock Set Aside emails
const mockSetAsideEmails: Email[] = [
  {
    id: '1',
    accountId: 'account-1',
    messageId: 'msg-1',
    nylasMessageId: null,
    providerMessageId: null,
    threadId: 'thread-1',
    subject: 'Weekend Reading: Top 10 Productivity Tips',
    snippet:
      'Check out these amazing productivity tips that will transform your workflow...',
    fromAddress: {
      email: 'newsletter@productivity.com',
      name: 'Productivity Weekly',
    },
    toAddresses: [{ email: 'me@example.com', name: 'Me' }],
    ccAddresses: [],
    bccAddresses: [],
    replyTo: [],
    bodyText: 'Check out these amazing productivity tips...',
    bodyHtml: '<p>Check out these amazing productivity tips...</p>',
    receivedAt: new Date('2025-10-13T08:00:00'),
    sentAt: new Date('2025-10-13T08:00:00'),
    isRead: true,
    isStarred: false,
    isImportant: false,
    isDraft: false,
    hasDrafts: false,
    hasAttachments: false,
    folderName: 'inbox',
    labelIds: [],
    screeningStatus: 'screened',
    heyView: 'feed',
    contactStatus: 'approved',
    replyLaterUntil: null,
    replyLaterNote: null,
    setAsideAt: new Date('2025-10-13T08:05:00'),
    customFolderId: null,
    trackersBlocked: 3,
    aiSummary: 'Newsletter with productivity tips for weekend reading.',
    aiQuickReplies: [],
    aiSmartActions: [],
    aiGeneratedAt: new Date('2025-10-13T08:01:00'),
    aiCategory: 'newsletter',
    aiPriority: 'low',
    aiSentiment: 'positive',
    searchVector: null,
    createdAt: new Date('2025-10-13T08:00:00'),
    updatedAt: new Date('2025-10-13T08:05:00'),
  },
];

export default function SetAsidePage(): JSX.Element {
  return (
    <>
      <EmailList
        emails={mockSetAsideEmails}
        title="Set Aside"
        isLoading={false}
      />    </>
  );
}
