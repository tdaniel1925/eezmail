import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's first email account
    const accounts = await db.query.emailAccounts.findMany({
      where: (accounts, { eq }) => eq(accounts.userId, user.id),
      limit: 1,
    });

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No email accounts found' },
        { status: 404 }
      );
    }

    const accountId = accounts[0].id;

    const mockEmails = [
      // Thread 1: Project Discussion (3 emails)
      {
        threadId: 'thread-1',
        subject: 'Q4 Marketing Campaign Strategy',
        from: { name: 'Sarah Chen', email: 'sarah.chen@company.com' },
        snippet:
          'Hi team, I wanted to share my thoughts on our Q4 marketing strategy...',
        bodyText:
          'Hi team,\n\nI wanted to share my thoughts on our Q4 marketing strategy. We should focus on expanding our social media presence and launching a new email campaign targeting enterprise customers.\n\nLet me know your thoughts!\n\nBest,\nSarah',
        bodyHtml:
          '<p>Hi team,</p><p>I wanted to share my thoughts on our Q4 marketing strategy.</p>',
        receivedAt: new Date('2024-01-15T09:30:00'),
        isRead: false,
        isStarred: true,
      },
      {
        threadId: 'thread-1',
        subject: 'Re: Q4 Marketing Campaign Strategy',
        from: { name: 'Mike Rodriguez', email: 'mike.r@company.com' },
        snippet:
          'Great ideas Sarah! I particularly like the enterprise focus...',
        bodyText:
          'Great ideas Sarah! I particularly like the enterprise focus. Have you considered partnering with industry influencers?',
        bodyHtml: '<p>Great ideas Sarah!</p>',
        receivedAt: new Date('2024-01-15T10:15:00'),
        isRead: false,
        isStarred: false,
      },
      {
        threadId: 'thread-1',
        subject: 'Re: Q4 Marketing Campaign Strategy',
        from: { name: 'Emily Watson', email: 'e.watson@company.com' },
        snippet: 'Love this direction! I can help with the content strategy...',
        bodyText:
          "Love this direction! I can help with the content strategy. Let's schedule a meeting.",
        bodyHtml: '<p>Love this direction!</p>',
        receivedAt: new Date('2024-01-15T11:45:00'),
        isRead: false,
        isStarred: false,
      },
      // Thread 2: Bug Report (2 emails)
      {
        threadId: 'thread-2',
        subject: 'Critical: Login Issue on Mobile App',
        from: { name: 'David Kim', email: 'david.kim@company.com' },
        snippet:
          'We have multiple users reporting they cannot log in to the mobile app...',
        bodyText:
          'Priority: HIGH\n\nWe have multiple users reporting they cannot log in to the mobile app.',
        bodyHtml: '<p><strong>Priority: HIGH</strong></p>',
        receivedAt: new Date('2024-01-15T08:20:00'),
        isRead: true,
        isStarred: true,
      },
      {
        threadId: 'thread-2',
        subject: 'Re: Critical: Login Issue on Mobile App',
        from: { name: 'Tech Support', email: 'support@company.com' },
        snippet: 'Issue identified and fixed. Deploying hotfix v2.3.2 now...',
        bodyText:
          'Issue identified and fixed. Deploying hotfix v2.3.2 now. ETA: 30 minutes.',
        bodyHtml: '<p>Issue identified and fixed.</p>',
        receivedAt: new Date('2024-01-15T09:05:00'),
        isRead: true,
        isStarred: false,
      },
      // Thread 3: Meeting Request (2 emails)
      {
        threadId: 'thread-3',
        subject: 'Meeting Request: Design Review',
        from: { name: 'Jessica Park', email: 'jessica.park@company.com' },
        snippet:
          "Hi! I'd like to schedule a design review session for the new dashboard...",
        bodyText:
          "Hi! I'd like to schedule a design review session for the new dashboard redesign.",
        bodyHtml: '<p>Hi! Design review session</p>',
        receivedAt: new Date('2024-01-14T16:30:00'),
        isRead: true,
        isStarred: false,
      },
      {
        threadId: 'thread-3',
        subject: 'Re: Meeting Request: Design Review',
        from: { name: 'Alex Thompson', email: 'alex.t@company.com' },
        snippet:
          'Tuesday 10am works for me! Looking forward to seeing the designs...',
        bodyText:
          'Tuesday 10am works for me! Looking forward to seeing the designs.',
        bodyHtml: '<p>Tuesday 10am works for me!</p>',
        receivedAt: new Date('2024-01-14T17:15:00'),
        isRead: true,
        isStarred: false,
      },
      // Standalone emails
      {
        threadId: 'thread-4',
        subject: 'Your Weekly Analytics Report',
        from: { name: 'Analytics Team', email: 'analytics@company.com' },
        snippet: "Here's your weekly performance summary...",
        bodyText: 'Weekly Summary - Active Users: 12,453 (+8%)',
        bodyHtml: '<h2>Weekly Summary</h2>',
        receivedAt: new Date('2024-01-15T07:00:00'),
        isRead: false,
        isStarred: false,
      },
      {
        threadId: 'thread-5',
        subject: 'Reminder: Team Building Event This Friday',
        from: { name: 'HR Team', email: 'hr@company.com' },
        snippet:
          "Don't forget about our team building event this Friday at 4pm...",
        bodyText: 'Team building event this Friday at 4pm at Central Park!',
        bodyHtml: '<p>Team building event</p>',
        receivedAt: new Date('2024-01-14T14:00:00'),
        isRead: false,
        isStarred: false,
      },
      {
        threadId: 'thread-6',
        subject: 'Invoice #2024-001 - Payment Received',
        from: { name: 'Billing', email: 'billing@vendor.com' },
        snippet: 'Thank you for your payment of $1,250.00...',
        bodyText: 'Thank you for your payment of $1,250.00',
        bodyHtml: '<p>Thank you for your payment!</p>',
        receivedAt: new Date('2024-01-14T11:20:00'),
        isRead: true,
        isStarred: false,
      },
    ];

    // Insert all emails
    for (const mockEmail of mockEmails) {
      await db.insert(emails).values({
        accountId,
        messageId: `mock-${mockEmail.threadId}-${Date.now()}-${Math.random()}`,
        threadId: mockEmail.threadId,
        subject: mockEmail.subject,
        snippet: mockEmail.snippet,
        fromAddress: mockEmail.from,
        toAddresses: [{ name: 'You', email: accounts[0].emailAddress }],
        ccAddresses: [],
        bccAddresses: [],
        bodyText: mockEmail.bodyText,
        bodyHtml: mockEmail.bodyHtml,
        receivedAt: mockEmail.receivedAt,
        sentAt: mockEmail.receivedAt,
        isRead: mockEmail.isRead,
        isStarred: mockEmail.isStarred,
        isImportant: false,
        folderName: 'inbox',
        folder: 'inbox',
        hasAttachments: false,
        isDraft: false,
        hasDrafts: false,
        screeningStatus: 'screened',
        contactStatus: 'approved',
        emailCategory: 'inbox',
        needsReply: false,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${mockEmails.length} test emails`,
      count: mockEmails.length,
    });
  } catch (error) {
    console.error('Error seeding emails:', error);
    return NextResponse.json(
      { error: 'Failed to seed emails', details: String(error) },
      { status: 500 }
    );
  }
}
