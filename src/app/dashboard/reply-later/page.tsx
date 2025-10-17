'use client';

import { EmailList } from '@/components/email/EmailList';
import { ChatBot } from '@/components/ai/ChatBot';
import type { Email } from '@/db/schema';

// Mock Reply Later emails
const mockReplyLaterEmails: Email[] = [
  {
    id: '1',
    accountId: 'account-1',
    messageId: 'msg-1',
    nylasMessageId: null,
    providerMessageId: null,
    threadId: 'thread-1',
    subject: 'Follow up on Q4 Budget Proposal',
    snippet:
      'Thanks for sending over the proposal. I have a few questions about the timeline...',
    fromAddress: {
      email: 'sarah@company.com',
      name: 'Sarah Johnson',
    },
    toAddresses: [{ email: 'me@example.com', name: 'Me' }],
    ccAddresses: [],
    bccAddresses: [],
    replyTo: [],
    bodyText: 'Thanks for sending over the proposal...',
    bodyHtml: '<p>Thanks for sending over the proposal...</p>',
    receivedAt: new Date('2025-10-12T14:30:00'),
    sentAt: new Date('2025-10-12T14:30:00'),
    isRead: true,
    isStarred: false,
    isImportant: false,
    isDraft: false,
    hasDrafts: false,
    hasAttachments: false,
    folderName: 'inbox',
    labelIds: [],
    screeningStatus: 'screened',
    heyView: 'imbox',
    contactStatus: 'approved',
    replyLaterUntil: new Date('2025-10-15T09:00:00'),
    replyLaterNote: 'Reply after review meeting',
    setAsideAt: null,
    customFolderId: null,
    trackersBlocked: 0,
    aiSummary: 'Budget proposal follow-up with timeline questions.',
    aiQuickReplies: [],
    aiSmartActions: [],
    aiGeneratedAt: new Date('2025-10-12T14:31:00'),
    aiCategory: 'work',
    aiPriority: 'high',
    aiSentiment: 'neutral',
    searchVector: null,
    createdAt: new Date('2025-10-12T14:30:00'),
    updatedAt: new Date('2025-10-12T14:30:00'),
  },
];

export default function ReplyLaterPage(): JSX.Element {
  return (
    <>
      <EmailList
        emails={mockReplyLaterEmails}
        title="Reply Later"
        isLoading={false}
      />
      <ChatBot />
    </>
  );
}
