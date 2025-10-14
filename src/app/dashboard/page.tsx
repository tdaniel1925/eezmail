'use client';

import { useState } from 'react';
import { EmailLayout } from '@/components/layout/EmailLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmailList } from '@/components/email/EmailList';
import { EmailViewer } from '@/components/email/EmailViewer';
import type { Email } from '@/db/schema';

// Mock email data
const mockEmails: Email[] = [
  {
    id: '1',
    accountId: 'account-1',
    messageId: 'msg-1',
    nylasMessageId: null,
    providerMessageId: null,
    threadId: 'thread-1',
    subject: 'Q4 Planning Meeting - Friday 2PM',
    snippet:
      'Hi there! I wanted to schedule our Q4 planning meeting for this Friday at 2 PM. Please let me know if this works for you...',
    fromAddress: {
      email: 'john.doe@acme.com',
      name: 'John Doe',
    },
    toAddresses: [
      {
        email: 'me@example.com',
        name: 'Me',
      },
    ],
    ccAddresses: [],
    bccAddresses: [],
    replyTo: [],
    bodyText:
      'Hi there!\n\nI wanted to schedule our Q4 planning meeting for this Friday at 2 PM. Please let me know if this works for you and if there are any agenda items you would like to add.\n\nBest regards,\nJohn',
    bodyHtml:
      '<p>Hi there!</p><p>I wanted to schedule our Q4 planning meeting for this Friday at 2 PM. Please let me know if this works for you and if there are any agenda items you would like to add.</p><p>Best regards,<br>John</p>',
    receivedAt: new Date('2025-10-13T10:30:00'),
    sentAt: new Date('2025-10-13T10:30:00'),
    isRead: false,
    isStarred: true,
    isImportant: true,
    isDraft: false,
    hasDrafts: false,
    hasAttachments: true,
    folderName: 'inbox',
    labelIds: [],
    screeningStatus: 'screened',
    heyView: 'imbox',
    contactStatus: 'approved',
    replyLaterUntil: null,
    replyLaterNote: null,
    setAsideAt: null,
    trackersBlocked: 2,
    aiSummary:
      'John is requesting a meeting this Friday at 2 PM to discuss Q4 planning. He is asking for confirmation and any agenda items.',
    aiQuickReplies: [
      'That time works perfectly for me!',
      'Can we do Thursday instead?',
      'Let me check my calendar and get back to you.',
    ],
    aiSmartActions: [
      {
        type: 'schedule_meeting',
        label: 'Schedule Meeting',
        value: 'friday-2pm',
      },
      { type: 'add_to_tasks', label: 'Add to Tasks' },
    ],
    aiGeneratedAt: new Date('2025-10-13T10:31:00'),
    aiCategory: 'meeting_request',
    aiPriority: 'high',
    aiSentiment: 'neutral',
    searchVector: null,
    createdAt: new Date('2025-10-13T10:30:00'),
    updatedAt: new Date('2025-10-13T10:30:00'),
  },
  {
    id: '2',
    accountId: 'account-1',
    messageId: 'msg-2',
    nylasMessageId: null,
    providerMessageId: null,
    threadId: 'thread-2',
    subject: 'Your weekly newsletter from TechCrunch',
    snippet:
      'Top stories this week: AI breakthroughs, startup funding rounds, and the latest in consumer tech...',
    fromAddress: {
      email: 'newsletter@techcrunch.com',
      name: 'TechCrunch',
    },
    toAddresses: [
      {
        email: 'me@example.com',
        name: 'Me',
      },
    ],
    ccAddresses: [],
    bccAddresses: [],
    replyTo: [],
    bodyText: 'Top stories this week...',
    bodyHtml: '<div>Top stories this week...</div>',
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
    setAsideAt: null,
    trackersBlocked: 5,
    aiSummary:
      'Weekly newsletter with top tech stories covering AI, startups, and consumer technology.',
    aiQuickReplies: [],
    aiSmartActions: [],
    aiGeneratedAt: new Date('2025-10-13T08:01:00'),
    aiCategory: 'newsletter',
    aiPriority: 'low',
    aiSentiment: 'neutral',
    searchVector: null,
    createdAt: new Date('2025-10-13T08:00:00'),
    updatedAt: new Date('2025-10-13T08:00:00'),
  },
  {
    id: '3',
    accountId: 'account-1',
    messageId: 'msg-3',
    nylasMessageId: null,
    providerMessageId: null,
    threadId: 'thread-3',
    subject: 'Your Amazon order has shipped',
    snippet:
      'Good news! Your order #123-4567890 has been shipped and is on its way...',
    fromAddress: {
      email: 'ship-confirm@amazon.com',
      name: 'Amazon.com',
    },
    toAddresses: [
      {
        email: 'me@example.com',
        name: 'Me',
      },
    ],
    ccAddresses: [],
    bccAddresses: [],
    replyTo: [],
    bodyText: 'Your order has shipped...',
    bodyHtml: '<div>Your order has shipped...</div>',
    receivedAt: new Date('2025-10-12T15:45:00'),
    sentAt: new Date('2025-10-12T15:45:00'),
    isRead: false,
    isStarred: false,
    isImportant: false,
    isDraft: false,
    hasDrafts: false,
    hasAttachments: false,
    folderName: 'inbox',
    labelIds: [],
    screeningStatus: 'screened',
    heyView: 'paper_trail',
    contactStatus: 'approved',
    replyLaterUntil: null,
    replyLaterNote: null,
    setAsideAt: null,
    trackersBlocked: 3,
    aiSummary:
      'Shipping confirmation for Amazon order #123-4567890 with tracking information.',
    aiQuickReplies: [],
    aiSmartActions: [{ type: 'track_package', label: 'Track Package' }],
    aiGeneratedAt: new Date('2025-10-12T15:46:00'),
    aiCategory: 'receipt',
    aiPriority: 'low',
    aiSentiment: 'positive',
    searchVector: null,
    createdAt: new Date('2025-10-12T15:45:00'),
    updatedAt: new Date('2025-10-12T15:45:00'),
  },
];

export default function DashboardPage(): JSX.Element {
  const [selectedEmailId, setSelectedEmailId] = useState<string | undefined>();

  const selectedEmail =
    mockEmails.find((email) => email.id === selectedEmailId) || null;

  return (
    <EmailLayout
      sidebar={<Sidebar />}
      emailList={
        <EmailList
          emails={mockEmails}
          selectedEmailId={selectedEmailId}
          onEmailSelect={setSelectedEmailId}
          title="Imbox"
        />
      }
      emailViewer={<EmailViewer email={selectedEmail} />}
    />
  );
}
