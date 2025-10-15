import { db } from '@/lib/db';
import { emails } from '@/db/schema';

interface EmailTemplate {
  subject: string;
  from: { name: string; email: string };
  body: string;
  category: 'inbox' | 'newsfeed' | 'receipts' | 'spam' | 'archived';
  hasAttachments?: boolean;
}

const emailTemplates: Record<string, EmailTemplate[]> = {
  inbox: [
    {
      subject: 'Team Meeting Tomorrow at 10 AM',
      from: { name: 'Sarah Chen', email: 'sarah@company.com' },
      body: 'Hi team,\n\nJust a friendly reminder about our strategy meeting tomorrow at 10 AM in Conference Room A. Please bring your Q4 reports.\n\nLooking forward to seeing everyone!\n\nBest,\nSarah',
      category: 'inbox',
    },
    {
      subject: 'Project Update Required - Q4 Dashboard',
      from: { name: 'Michael Rodriguez', email: 'michael@company.com' },
      body: 'Hi,\n\nCan you provide an update on the Q4 dashboard project? We need to review the progress before the client meeting on Friday.\n\nThanks,\nMichael',
      category: 'inbox',
    },
    {
      subject: 'Lunch Plans This Week?',
      from: { name: 'Emma Watson', email: 'emma.watson@personal.com' },
      body: 'Hey!\n\nWould you like to grab lunch sometime this week? I heard about a great new Italian place downtown.\n\nLet me know!\nEmma',
      category: 'inbox',
    },
    {
      subject: 'Design Review - New Homepage Mockups',
      from: { name: 'Alex Kim', email: 'alex@design.com' },
      body: "Hi,\n\nI've finished the new homepage mockups. Can we schedule a design review session? I'm available Tuesday afternoon or Wednesday morning.\n\nAttached are the initial concepts.\n\nBest,\nAlex",
      category: 'inbox',
      hasAttachments: true,
    },
    {
      subject: 'Important: Security Update Required',
      from: { name: 'IT Department', email: 'it@company.com' },
      body: 'Dear Team Member,\n\nA critical security update needs to be installed on all company devices by end of day Friday. Please follow the instructions in the attached document.\n\nContact IT support if you need assistance.\n\nIT Department',
      category: 'inbox',
      hasAttachments: true,
    },
    {
      subject: 'Conference Call Rescheduled',
      from: { name: 'Jennifer Brown', email: 'jennifer@partner.com' },
      body: 'Hello,\n\nDue to a scheduling conflict, I need to reschedule our conference call from 2 PM to 4 PM today. Please confirm if this works for you.\n\nRegards,\nJennifer',
      category: 'inbox',
    },
    {
      subject: 'Birthday Party Invitation - Saturday',
      from: { name: 'David Lee', email: 'david.lee@personal.com' },
      body: "Hey friend!\n\nI'm throwing a birthday party this Saturday at 7 PM at my place. Would love to see you there! Feel free to bring a plus one.\n\nRSVP by Thursday.\n\nCheers,\nDavid",
      category: 'inbox',
    },
    {
      subject: 'Q4 Budget Review Meeting',
      from: { name: 'Finance Team', email: 'finance@company.com' },
      body: "Dear Department Head,\n\nYou are invited to attend the Q4 budget review meeting on Monday, October 20th at 9:30 AM. Please prepare your department's spending report.\n\nFinance Team",
      category: 'inbox',
    },
    {
      subject: 'Weekend Hiking Trip',
      from: { name: 'Outdoor Club', email: 'club@outdoor.org' },
      body: "Hi Members,\n\nWe're organizing a hiking trip to Mount Wilson this weekend. Meet at the trailhead at 7 AM Saturday. Bring plenty of water and snacks.\n\nSign up by replying to this email.\n\nHappy Trails!",
      category: 'inbox',
    },
    {
      subject: 'Contract Renewal Discussion',
      from: { name: 'Legal Department', email: 'legal@company.com' },
      body: 'Hello,\n\nWe need to discuss the renewal terms for the vendor contract expiring next month. Please schedule a meeting at your earliest convenience.\n\nLegal Team',
      category: 'inbox',
    },
  ],
  newsfeed: [
    {
      subject: 'Weekly Newsletter - Tech Trends 2025',
      from: { name: 'TechDaily', email: 'news@techdaily.com' },
      body: 'Your weekly roundup of the latest tech news and trends. This week: AI breakthroughs, new smartphone releases, and startup funding rounds.',
      category: 'newsfeed',
    },
    {
      subject: 'Product Hunt Daily - Top Products',
      from: { name: 'Product Hunt', email: 'digest@producthunt.com' },
      body: "Check out today's top products on Product Hunt. Discover innovative tools, apps, and services from makers around the world.",
      category: 'newsfeed',
    },
    {
      subject: 'LinkedIn: You Have 5 New Notifications',
      from: { name: 'LinkedIn', email: 'notifications@linkedin.com' },
      body: 'Your network is growing! Check out who viewed your profile and new job opportunities that match your skills.',
      category: 'newsfeed',
    },
    {
      subject: 'Medium Daily Digest',
      from: { name: 'Medium', email: 'noreply@medium.com' },
      body: 'Top stories for you today: "The Future of Remote Work", "Building Better Habits", and "Understanding Cryptocurrency".',
      category: 'newsfeed',
    },
    {
      subject: 'GitHub Trending Repositories',
      from: { name: 'GitHub', email: 'noreply@github.com' },
      body: 'Discover trending repositories this week. Popular projects in JavaScript, Python, and Go.',
      category: 'newsfeed',
    },
    {
      subject: 'Marketing Weekly - Industry Insights',
      from: { name: 'MarketingWeekly', email: 'news@marketingweekly.com' },
      body: 'Latest marketing trends, case studies, and expert interviews. Learn from the best in the industry.',
      category: 'newsfeed',
    },
    {
      subject: 'Your Monthly Spotify Wrapped',
      from: { name: 'Spotify', email: 'no-reply@spotify.com' },
      body: 'Check out your listening stats for this month! Your top artists, songs, and genres.',
      category: 'newsfeed',
    },
    {
      subject: 'Hacker News Digest',
      from: { name: 'Hacker News', email: 'digest@news.ycombinator.com' },
      body: 'Top stories from Hacker News: "New Programming Language Released", "Startup Success Stories", and "Open Source Projects".',
      category: 'newsfeed',
    },
    {
      subject: 'Designer News - Weekly Roundup',
      from: { name: 'Designer News', email: 'weekly@designernews.co' },
      body: 'The best design articles, resources, and inspiration from this week. UI/UX trends and portfolio showcases.',
      category: 'newsfeed',
    },
    {
      subject: 'YouTube Recommendations',
      from: { name: 'YouTube', email: 'noreply@youtube.com' },
      body: 'New videos from channels you might like. Trending content in technology, education, and entertainment.',
      category: 'newsfeed',
    },
  ],
  receipts: [
    {
      subject: 'Your Amazon Order Confirmation #123-4567890',
      from: { name: 'Amazon', email: 'auto-confirm@amazon.com' },
      body: 'Thank you for your order! Your items will be delivered by October 18th. Order total: $89.99',
      category: 'receipts',
    },
    {
      subject: 'Receipt from Starbucks',
      from: { name: 'Starbucks', email: 'receipts@starbucks.com' },
      body: 'Thanks for visiting Starbucks! Your receipt for $6.75. Earn rewards with every purchase.',
      category: 'receipts',
    },
    {
      subject: 'Uber Trip Receipt',
      from: { name: 'Uber', email: 'uber.us@uber.com' },
      body: 'Your trip from Downtown to Airport - $24.50. Thank you for riding with Uber!',
      category: 'receipts',
    },
    {
      subject: 'Netflix - Payment Received',
      from: { name: 'Netflix', email: 'info@mailer.netflix.com' },
      body: 'Your Netflix subscription has been renewed. Amount charged: $15.99. Next billing date: November 15th.',
      category: 'receipts',
    },
    {
      subject: 'Your Spotify Premium Subscription',
      from: { name: 'Spotify', email: 'noreply@spotify.com' },
      body: 'Payment successful! Your Spotify Premium subscription is active. $9.99 charged to your card.',
      category: 'receipts',
    },
    {
      subject: 'Apple Purchase Receipt',
      from: { name: 'Apple', email: 'no_reply@email.apple.com' },
      body: 'Receipt for your purchase from the App Store. Total: $4.99. Thank you for your purchase.',
      category: 'receipts',
    },
    {
      subject: 'Doordash Order Confirmed',
      from: { name: 'DoorDash', email: 'no-reply@doordash.com' },
      body: 'Your order from Italian Bistro is on its way! Total: $32.45 including delivery.',
      category: 'receipts',
    },
    {
      subject: 'Adobe Creative Cloud Invoice',
      from: { name: 'Adobe', email: 'message@adobe.com' },
      body: 'Your Adobe Creative Cloud subscription invoice. Amount: $52.99. Invoice #INV-2024-001234',
      category: 'receipts',
    },
    {
      subject: 'Microsoft 365 Subscription Receipt',
      from: { name: 'Microsoft', email: 'msonlineservicesteam@microsoft.com' },
      body: 'Your Microsoft 365 subscription has been renewed. $99.99 charged annually.',
      category: 'receipts',
    },
    {
      subject: 'Hotel Reservation Confirmation',
      from: { name: 'Booking.com', email: 'noreply@booking.com' },
      body: 'Your hotel reservation is confirmed! Check-in: Oct 25th. Total: $450 for 3 nights.',
      category: 'receipts',
      hasAttachments: true,
    },
  ],
  spam: [
    {
      subject: 'URGENT: You Won $1,000,000!!!',
      from: { name: 'Lottery Winner', email: 'winner@fake-lottery.com' },
      body: 'Congratulations! You have been selected as the winner of our international lottery. Click here to claim your prize now!',
      category: 'spam',
    },
    {
      subject: 'Lose 50 Pounds in 2 Weeks - Guaranteed!',
      from: { name: 'Health Miracle', email: 'sales@weightloss-scam.com' },
      body: "Amazing new weight loss pill that doctors don't want you to know about! Order now and get 50% off!",
      category: 'spam',
    },
    {
      subject: 'Your Account Will Be Closed',
      from: { name: 'Bank Alert', email: 'security@fake-bank.com' },
      body: 'URGENT: Your account has been compromised. Click this link immediately to verify your identity or your account will be closed.',
      category: 'spam',
    },
    {
      subject: 'Make $10,000 Per Month Working From Home',
      from: { name: 'Work Opportunity', email: 'jobs@scam-work.com' },
      body: 'Limited time offer! Join thousands making money from home. No experience required. Sign up now!',
      category: 'spam',
    },
    {
      subject: 'IRS Tax Refund Waiting',
      from: { name: 'IRS', email: 'fake@irs-scam.com' },
      body: 'You have a tax refund of $5,432.18 waiting. Fill out this form to receive your refund immediately.',
      category: 'spam',
    },
    {
      subject: 'Nigerian Prince Needs Your Help',
      from: { name: 'Prince Abdullah', email: 'prince@nigeria-scam.com' },
      body: 'I am a Nigerian prince and I need to transfer $50 million dollars. I will give you 10% if you help me.',
      category: 'spam',
    },
    {
      subject: 'Your Package Could Not Be Delivered',
      from: { name: 'Shipping', email: 'delivery@fake-ups.com' },
      body: 'We attempted to deliver your package but failed. Click here to reschedule delivery.',
      category: 'spam',
    },
    {
      subject: "Congratulations! You've Been Selected",
      from: { name: 'Survey Rewards', email: 'rewards@scam-survey.com' },
      body: "You've been randomly selected to receive a free iPhone 15 Pro. Just complete this quick survey!",
      category: 'spam',
    },
    {
      subject: 'Increase Your Credit Score Instantly',
      from: { name: 'Credit Fix', email: 'info@credit-scam.com' },
      body: 'Bad credit? No problem! We can increase your credit score by 200 points in 24 hours. Guaranteed!',
      category: 'spam',
    },
    {
      subject: 'Hot Singles in Your Area',
      from: { name: 'Dating Site', email: 'matches@spam-dating.com' },
      body: 'Meet hot singles near you tonight! No credit card required to sign up. Click now!',
      category: 'spam',
    },
  ],
};

export async function generateTestEmails(userId: string, accountId: string) {
  console.log('🌱 Starting test email generation...');
  let totalCreated = 0;

  for (const [folder, templates] of Object.entries(emailTemplates)) {
    console.log(`📁 Creating ${templates.length} emails for ${folder}...`);

    for (const template of templates) {
      try {
        // Generate random date within last 30 days
        const daysAgo = Math.random() * 30;
        const receivedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        await db.insert(emails).values({
          accountId,
          messageId: `test-${Date.now()}-${Math.random()}-${folder}`,
          subject: template.subject,
          fromAddress: template.from,
          toAddresses: [{ name: 'You', email: 'you@example.com' }],
          bodyText: template.body,
          bodyHtml: `<p>${template.body.replace(/\n/g, '<br>')}</p>`,
          snippet: template.body.substring(0, 100),
          receivedAt,
          folderName: folder,
          emailCategory: template.category,
          isRead: Math.random() > 0.6, // 40% unread
          isStarred: Math.random() > 0.9, // 10% starred
          hasAttachments: template.hasAttachments || false,
          screeningStatus: 'screened',
          screenedBy: 'test_generator',
          screenedAt: receivedAt,
        } as any);

        totalCreated++;
      } catch (error) {
        console.error(`❌ Error creating email in ${folder}:`, error);
      }
    }
  }

  console.log(`✅ Successfully created ${totalCreated} test emails!`);
  return { success: true, count: totalCreated };
}
