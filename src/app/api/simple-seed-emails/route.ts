import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emails, emailAccounts } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌱 Starting simple email seeding for user:', user.id);

    // Get user's first email account
    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, user.id),
      limit: 1,
    });

    if (accounts.length === 0) {
      console.log('❌ No email accounts found for user');
      return NextResponse.json(
        { error: 'No email accounts found. Please connect an account first.' },
        { status: 404 }
      );
    }

    const accountId = accounts[0].id;
    console.log('📧 Using account:', accounts[0].emailAddress);

    // Simple test emails
    const testEmails = [
      {
        subject: 'Welcome to Your New Email Client!',
        from: { name: 'Support Team', email: 'support@example.com' },
        snippet:
          'Welcome to your new AI-powered email client. This is a test email to get you started.',
        bodyText:
          'Welcome to your new AI-powered email client!\n\nThis is a test email to help you get started. You can now enjoy all the features of your new email system.\n\nBest regards,\nThe Support Team',
        bodyHtml:
          '<p>Welcome to your new AI-powered email client!</p><p>This is a test email to help you get started.</p>',
        receivedAt: new Date(),
        isRead: false,
        isStarred: false,
      },
      {
        subject: 'Meeting Reminder: Project Review',
        from: { name: 'John Smith', email: 'john.smith@company.com' },
        snippet:
          'Just a reminder about our project review meeting tomorrow at 2 PM.',
        bodyText:
          'Hi there,\n\nJust a reminder about our project review meeting tomorrow at 2 PM in the conference room.\n\nPlease bring your project updates and any questions you might have.\n\nThanks,\nJohn',
        bodyHtml:
          '<p>Hi there,</p><p>Just a reminder about our project review meeting tomorrow at 2 PM.</p>',
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: true,
        isStarred: true,
      },
      {
        subject: 'Newsletter: Weekly Tech Updates',
        from: { name: 'Tech Weekly', email: 'newsletter@techweekly.com' },
        snippet:
          'This week in tech: AI breakthroughs, new frameworks, and industry insights.',
        bodyText:
          'This week in technology:\n\n- New AI models released\n- Framework updates\n- Industry insights\n\nRead more on our website!',
        bodyHtml:
          '<p>This week in technology:</p><ul><li>New AI models released</li><li>Framework updates</li></ul>',
        receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: false,
        isStarred: false,
      },
    ];

    let insertedCount = 0;

    for (const email of testEmails) {
      try {
        await db.insert(emails).values({
          accountId,
          messageId: `test-${Date.now()}-${Math.random()}`,
          subject: email.subject,
          snippet: email.snippet,
          fromAddress: email.from,
          toAddresses: [{ name: 'You', email: accounts[0].emailAddress }],
          bodyText: email.bodyText,
          bodyHtml: email.bodyHtml,
          receivedAt: email.receivedAt,
          sentAt: email.receivedAt,
          isRead: email.isRead,
          isStarred: email.isStarred,
          folderName: 'inbox',
          emailCategory: 'inbox',
          hasAttachments: false,
          isDraft: false,
          hasDrafts: false,
          isTrashed: false,
          isArchived: false,
          screeningStatus: 'screened',
          screenedBy: 'test_seeder',
          screenedAt: email.receivedAt,
        });

        insertedCount++;
        console.log(`✅ Added: ${email.subject}`);
      } catch (error) {
        console.error(`❌ Error inserting email "${email.subject}":`, error);
      }
    }

    console.log(`🎉 Successfully seeded ${insertedCount} test emails!`);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${insertedCount} test emails`,
      count: insertedCount,
    });
  } catch (error) {
    console.error('❌ Error seeding emails:', error);
    return NextResponse.json(
      { error: 'Failed to seed emails', details: String(error) },
      { status: 500 }
    );
  }
}


