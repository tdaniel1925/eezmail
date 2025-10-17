/**
 * Script to seed the inbox with dummy emails for testing
 * Run with: npx tsx scripts/seed-inbox-emails.ts
 */

import { db } from '../src/lib/db';
import { emails, emailThreads, emailAccounts } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const MOCK_EMAILS = [
  // Thread 1: Project Discussion (3 emails)
  {
    threadId: 'thread-1',
    subject: 'Q4 Marketing Campaign Strategy',
    from: { name: 'Sarah Chen', email: 'sarah.chen@company.com' },
    snippet:
      'Hi team, I wanted to share my thoughts on our Q4 marketing strategy. We should focus on...',
    bodyText:
      'Hi team,\n\nI wanted to share my thoughts on our Q4 marketing strategy. We should focus on expanding our social media presence and launching a new email campaign targeting enterprise customers.\n\nLet me know your thoughts!\n\nBest,\nSarah',
    bodyHtml:
      '<p>Hi team,</p><p>I wanted to share my thoughts on our Q4 marketing strategy. We should focus on expanding our social media presence and launching a new email campaign targeting enterprise customers.</p><p>Let me know your thoughts!</p><p>Best,<br>Sarah</p>',
    receivedAt: new Date('2024-01-15T09:30:00'),
    isRead: false,
    isStarred: true,
    isImportant: true,
  },
  {
    threadId: 'thread-1',
    subject: 'Re: Q4 Marketing Campaign Strategy',
    from: { name: 'Mike Rodriguez', email: 'mike.r@company.com' },
    snippet:
      'Great ideas Sarah! I particularly like the enterprise focus. Have you considered...',
    bodyText:
      'Great ideas Sarah! I particularly like the enterprise focus. Have you considered partnering with industry influencers? I have some contacts who might be interested.\n\nAlso, we should align this with the product roadmap.\n\nMike',
    bodyHtml:
      '<p>Great ideas Sarah! I particularly like the enterprise focus. Have you considered partnering with industry influencers? I have some contacts who might be interested.</p><p>Also, we should align this with the product roadmap.</p><p>Mike</p>',
    receivedAt: new Date('2024-01-15T10:15:00'),
    isRead: false,
    isStarred: false,
    isImportant: true,
  },
  {
    threadId: 'thread-1',
    subject: 'Re: Q4 Marketing Campaign Strategy',
    from: { name: 'Emily Watson', email: 'e.watson@company.com' },
    snippet: 'Love this direction! I can help with the content strategy...',
    bodyText:
      "Love this direction! I can help with the content strategy and have some case studies we can leverage. Let's schedule a meeting to discuss next steps.\n\nI'm free Tuesday or Thursday afternoon.\n\nEmily",
    bodyHtml:
      "<p>Love this direction! I can help with the content strategy and have some case studies we can leverage. Let's schedule a meeting to discuss next steps.</p><p>I'm free Tuesday or Thursday afternoon.</p><p>Emily</p>",
    receivedAt: new Date('2024-01-15T11:45:00'),
    isRead: false,
    isStarred: false,
    isImportant: true,
  },

  // Thread 2: Bug Report (2 emails)
  {
    threadId: 'thread-2',
    subject: 'Critical: Login Issue on Mobile App',
    from: { name: 'David Kim', email: 'david.kim@company.com' },
    snippet:
      'We have multiple users reporting they cannot log in to the mobile app...',
    bodyText:
      'Priority: HIGH\n\nWe have multiple users reporting they cannot log in to the mobile app. The error occurs after the latest update (v2.3.1).\n\nSteps to reproduce:\n1. Open app\n2. Enter credentials\n3. Tap login\n4. App crashes\n\nPlease investigate ASAP.\n\nDavid',
    bodyHtml:
      '<p><strong>Priority: HIGH</strong></p><p>We have multiple users reporting they cannot log in to the mobile app. The error occurs after the latest update (v2.3.1).</p><p><strong>Steps to reproduce:</strong><br>1. Open app<br>2. Enter credentials<br>3. Tap login<br>4. App crashes</p><p>Please investigate ASAP.</p><p>David</p>',
    receivedAt: new Date('2024-01-15T08:20:00'),
    isRead: true,
    isStarred: true,
    isImportant: true,
  },
  {
    threadId: 'thread-2',
    subject: 'Re: Critical: Login Issue on Mobile App',
    from: { name: 'Tech Support', email: 'support@company.com' },
    snippet: 'Issue identified and fixed. Deploying hotfix v2.3.2 now...',
    bodyText:
      'Issue identified and fixed. Deploying hotfix v2.3.2 now. The problem was related to the authentication token refresh logic.\n\nETA for deployment: 30 minutes\nWill monitor and provide update.\n\nTech Support Team',
    bodyHtml:
      '<p>Issue identified and fixed. Deploying hotfix v2.3.2 now. The problem was related to the authentication token refresh logic.</p><p><strong>ETA for deployment:</strong> 30 minutes<br>Will monitor and provide update.</p><p>Tech Support Team</p>',
    receivedAt: new Date('2024-01-15T09:05:00'),
    isRead: true,
    isStarred: false,
    isImportant: true,
  },

  // Thread 3: Meeting Request (2 emails)
  {
    threadId: 'thread-3',
    subject: 'Meeting Request: Design Review',
    from: { name: 'Jessica Park', email: 'jessica.park@company.com' },
    snippet:
      "Hi! I'd like to schedule a design review session for the new dashboard...",
    bodyText:
      "Hi!\n\nI'd like to schedule a design review session for the new dashboard redesign. We've completed the mockups and would love to get feedback from the team.\n\nProposed times:\n- Monday 2pm-3pm\n- Tuesday 10am-11am\n- Wednesday 3pm-4pm\n\nLet me know what works best!\n\nJessica",
    bodyHtml:
      "<p>Hi!</p><p>I'd like to schedule a design review session for the new dashboard redesign. We've completed the mockups and would love to get feedback from the team.</p><p><strong>Proposed times:</strong><br>- Monday 2pm-3pm<br>- Tuesday 10am-11am<br>- Wednesday 3pm-4pm</p><p>Let me know what works best!</p><p>Jessica</p>",
    receivedAt: new Date('2024-01-14T16:30:00'),
    isRead: true,
    isStarred: false,
    isImportant: false,
  },
  {
    threadId: 'thread-3',
    subject: 'Re: Meeting Request: Design Review',
    from: { name: 'Alex Thompson', email: 'alex.t@company.com' },
    snippet:
      'Tuesday 10am works for me! Looking forward to seeing the designs...',
    bodyText:
      'Tuesday 10am works for me! Looking forward to seeing the designs.\n\nCan you also share the mockups beforehand so we can come prepared with questions?\n\nThanks!\nAlex',
    bodyHtml:
      '<p>Tuesday 10am works for me! Looking forward to seeing the designs.</p><p>Can you also share the mockups beforehand so we can come prepared with questions?</p><p>Thanks!<br>Alex</p>',
    receivedAt: new Date('2024-01-14T17:15:00'),
    isRead: true,
    isStarred: false,
    isImportant: false,
  },

  // Standalone emails (no threads)
  {
    threadId: 'thread-4',
    subject: 'Your Weekly Analytics Report',
    from: { name: 'Analytics Team', email: 'analytics@company.com' },
    snippet: "Here's your weekly performance summary...",
    bodyText:
      'Weekly Summary (Jan 8-14)\n\n📊 Key Metrics:\n- Active Users: 12,453 (+8%)\n- Revenue: $45,231 (+12%)\n- Conversion Rate: 3.2% (+0.3%)\n- Customer Satisfaction: 4.6/5\n\nTop performing features:\n1. New Dashboard\n2. Mobile App\n3. Team Collaboration\n\nView full report: [Link]',
    bodyHtml:
      '<h2>Weekly Summary (Jan 8-14)</h2><h3>📊 Key Metrics:</h3><ul><li>Active Users: 12,453 (+8%)</li><li>Revenue: $45,231 (+12%)</li><li>Conversion Rate: 3.2% (+0.3%)</li><li>Customer Satisfaction: 4.6/5</li></ul><h3>Top performing features:</h3><ol><li>New Dashboard</li><li>Mobile App</li><li>Team Collaboration</li></ol><p><a href="#">View full report</a></p>',
    receivedAt: new Date('2024-01-15T07:00:00'),
    isRead: false,
    isStarred: false,
    isImportant: false,
  },
  {
    threadId: 'thread-5',
    subject: 'Reminder: Team Building Event This Friday',
    from: { name: 'HR Team', email: 'hr@company.com' },
    snippet: "Don't forget about our team building event this Friday at 4pm...",
    bodyText:
      "Hi everyone!\n\nJust a friendly reminder about our team building event this Friday at 4pm.\n\n📍 Location: Central Park\n🎯 Activity: Outdoor games and BBQ\n👕 Dress: Casual\n\nPlease RSVP by Wednesday if you haven't already.\n\nLooking forward to seeing everyone there!\n\nHR Team",
    bodyHtml:
      "<p>Hi everyone!</p><p>Just a friendly reminder about our team building event this Friday at 4pm.</p><p>📍 <strong>Location:</strong> Central Park<br>🎯 <strong>Activity:</strong> Outdoor games and BBQ<br>👕 <strong>Dress:</strong> Casual</p><p>Please RSVP by Wednesday if you haven't already.</p><p>Looking forward to seeing everyone there!</p><p>HR Team</p>",
    receivedAt: new Date('2024-01-14T14:00:00'),
    isRead: false,
    isStarred: false,
    isImportant: false,
  },
  {
    threadId: 'thread-6',
    subject: 'Invoice #2024-001 - Payment Received',
    from: { name: 'Billing', email: 'billing@vendor.com' },
    snippet: 'Thank you for your payment of $1,250.00...',
    bodyText:
      'Thank you for your payment!\n\nInvoice #2024-001\nAmount: $1,250.00\nDate Paid: January 14, 2024\nPayment Method: Credit Card (****4532)\n\nYour receipt has been attached to this email.\n\nIf you have any questions, please contact our billing department.\n\nBest regards,\nBilling Team',
    bodyHtml:
      '<h3>Thank you for your payment!</h3><p><strong>Invoice #2024-001</strong><br>Amount: $1,250.00<br>Date Paid: January 14, 2024<br>Payment Method: Credit Card (****4532)</p><p>Your receipt has been attached to this email.</p><p>If you have any questions, please contact our billing department.</p><p>Best regards,<br>Billing Team</p>',
    receivedAt: new Date('2024-01-14T11:20:00'),
    isRead: true,
    isStarred: false,
    isImportant: false,
  },
  {
    threadId: 'thread-7',
    subject: 'Newsletter: Top 10 Productivity Tips for 2024',
    from: { name: 'Productivity Hub', email: 'newsletter@productivity.com' },
    snippet: 'Discover the best productivity tips to kickstart your year...',
    bodyText:
      'Happy New Year! 🎉\n\nStart 2024 strong with these productivity tips:\n\n1. Time blocking for deep work\n2. The 2-minute rule\n3. Email batching\n4. Morning routines\n5. Digital decluttering\n\n...and 5 more!\n\nRead the full article: [Link]\n\nUnsubscribe | Manage Preferences',
    bodyHtml:
      '<h2>Happy New Year! 🎉</h2><p>Start 2024 strong with these productivity tips:</p><ol><li>Time blocking for deep work</li><li>The 2-minute rule</li><li>Email batching</li><li>Morning routines</li><li>Digital decluttering</li></ol><p>...and 5 more!</p><p><a href="#">Read the full article</a></p><p><small><a href="#">Unsubscribe</a> | <a href="#">Manage Preferences</a></small></p>',
    receivedAt: new Date('2024-01-14T08:00:00'),
    isRead: false,
    isStarred: false,
    isImportant: false,
  },
  {
    threadId: 'thread-8',
    subject: 'Security Alert: New Login from Unknown Device',
    from: { name: 'Security Team', email: 'security@company.com' },
    snippet:
      'We detected a new login to your account from an unknown device...',
    bodyText:
      "⚠️ Security Alert\n\nWe detected a new login to your account:\n\nDevice: MacBook Pro\nLocation: San Francisco, CA\nIP Address: 192.168.1.100\nTime: January 15, 2024 at 6:45 AM\n\nIf this was you, you can safely ignore this message.\n\nIf you don't recognize this activity, please secure your account immediately by changing your password.\n\nStay safe,\nSecurity Team",
    bodyHtml:
      "<h3>⚠️ Security Alert</h3><p>We detected a new login to your account:</p><ul><li><strong>Device:</strong> MacBook Pro</li><li><strong>Location:</strong> San Francisco, CA</li><li><strong>IP Address:</strong> 192.168.1.100</li><li><strong>Time:</strong> January 15, 2024 at 6:45 AM</li></ul><p>If this was you, you can safely ignore this message.</p><p>If you don't recognize this activity, please <strong>secure your account immediately</strong> by changing your password.</p><p>Stay safe,<br>Security Team</p>",
    receivedAt: new Date('2024-01-15T06:45:00'),
    isRead: false,
    isStarred: true,
    isImportant: true,
  },
  {
    threadId: 'thread-9',
    subject: 'Invitation: Product Demo Webinar - Jan 20',
    from: { name: 'Marketing', email: 'events@company.com' },
    snippet: "You're invited to our exclusive product demo webinar...",
    bodyText:
      "You're Invited! 🎯\n\nProduct Demo Webinar\nDate: January 20, 2024\nTime: 2:00 PM EST\nDuration: 1 hour\n\nWhat you'll learn:\n- New features overview\n- Live Q&A session\n- Best practices\n- Exclusive tips\n\nRegister now: [Link]\n\nLimited spots available!\n\nSee you there,\nMarketing Team",
    bodyHtml:
      '<h2>You\'re Invited! 🎯</h2><h3>Product Demo Webinar</h3><ul><li><strong>Date:</strong> January 20, 2024</li><li><strong>Time:</strong> 2:00 PM EST</li><li><strong>Duration:</strong> 1 hour</li></ul><h4>What you\'ll learn:</h4><ul><li>New features overview</li><li>Live Q&A session</li><li>Best practices</li><li>Exclusive tips</li></ul><p><a href="#" style="background: #FF4C5A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Register now</a></p><p><em>Limited spots available!</em></p><p>See you there,<br>Marketing Team</p>',
    receivedAt: new Date('2024-01-13T15:30:00'),
    isRead: false,
    isStarred: false,
    isImportant: false,
  },
  {
    threadId: 'thread-10',
    subject: 'Your Feedback Matters: Quick Survey',
    from: { name: 'Customer Success', email: 'feedback@company.com' },
    snippet: 'Help us improve! Take our 2-minute survey...',
    bodyText:
      "Hi there!\n\nWe'd love to hear your thoughts on our recent updates. Your feedback helps us build better products.\n\n📝 Quick Survey (2 minutes)\n[Take Survey]\n\nAs a thank you, you'll be entered to win a $50 gift card!\n\nThank you for being an amazing customer.\n\nBest,\nCustomer Success Team",
    bodyHtml:
      '<p>Hi there!</p><p>We\'d love to hear your thoughts on our recent updates. Your feedback helps us build better products.</p><p>📝 <strong>Quick Survey (2 minutes)</strong><br><a href="#" style="background: #FF4C5A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">Take Survey</a></p><p>As a thank you, you\'ll be entered to win a <strong>$50 gift card</strong>!</p><p>Thank you for being an amazing customer.</p><p>Best,<br>Customer Success Team</p>',
    receivedAt: new Date('2024-01-13T10:00:00'),
    isRead: true,
    isStarred: false,
    isImportant: false,
  },
];

async function seedInboxEmails() {
  try {
    console.log('🌱 Starting to seed inbox emails...\n');

    // Get the first email account
    const accounts = await db.select().from(emailAccounts).limit(1);

    if (accounts.length === 0) {
      console.error(
        '❌ No email accounts found. Please add an email account first.'
      );
      process.exit(1);
    }

    const accountId = accounts[0].id;
    console.log(`📧 Using account: ${accounts[0].emailAddress}\n`);

    // Insert emails
    let insertedCount = 0;
    for (const mockEmail of MOCK_EMAILS) {
      const emailData = {
        accountId,
        messageId: `mock-${mockEmail.threadId}-${Date.now()}-${Math.random()}`,
        threadId: mockEmail.threadId,
        subject: mockEmail.subject,
        snippet: mockEmail.snippet,
        fromAddress: mockEmail.from,
        toAddresses: [{ name: 'You', email: accounts[0].emailAddress }],
        bodyText: mockEmail.bodyText,
        bodyHtml: mockEmail.bodyHtml,
        receivedAt: mockEmail.receivedAt,
        sentAt: mockEmail.receivedAt,
        isRead: mockEmail.isRead,
        isStarred: mockEmail.isStarred,
        isImportant: mockEmail.isImportant,
        folderName: 'inbox',
        folder: 'inbox',
        hasAttachments: false,
        isDraft: false,
        hasDrafts: false,
        isTrashed: false,
        isArchived: false,
        screeningStatus: 'screened' as const,
        contactStatus: 'approved' as const,
        category: 'primary' as const,
      };

      await db.insert(emails).values(emailData);
      insertedCount++;
      console.log(`✅ Added: ${mockEmail.subject}`);
    }

    console.log(`\n🎉 Successfully seeded ${insertedCount} emails!`);
    console.log(`\n📊 Summary:`);
    console.log(
      `   - 3 threaded conversations (Thread 1: 3 emails, Thread 2: 2 emails, Thread 3: 2 emails)`
    );
    console.log(`   - 7 standalone emails`);
    console.log(`   - Total: ${insertedCount} emails`);
  } catch (error) {
    console.error('❌ Error seeding emails:', error);
    process.exit(1);
  }
}

// Run the seed function
seedInboxEmails()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
