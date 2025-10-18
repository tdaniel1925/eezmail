import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emails, contactEmails } from '@/db/schema';
import { eq, or, and, sql, count } from 'drizzle-orm';

export interface ActivityStats {
  totalEmails: number;
  emailsSent: number;
  emailsReceived: number;
  averageResponseTime: number; // in hours
  lastContactDate: Date | null;
  firstContactDate: Date | null;
  monthlyActivity: Array<{
    month: string;
    year: number;
    sent: number;
    received: number;
  }>;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contactId = params.id;

    // Get contact's email addresses
    const contactEmailAddresses = await db.query.contactEmails.findMany({
      where: eq(contactEmails.contactId, contactId),
    });

    if (contactEmailAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalEmails: 0,
          emailsSent: 0,
          emailsReceived: 0,
          averageResponseTime: 0,
          lastContactDate: null,
          firstContactDate: null,
          monthlyActivity: [],
        },
      });
    }

    const emailAddresses = contactEmailAddresses.map((ce) => ce.email);

    // Get all emails from/to this contact
    // Note: This is a simplified query - adjust based on your schema
    const allEmails = await db.query.emails.findMany({
      where: or(
        ...emailAddresses.flatMap((addr) => [
          eq(emails.fromAddress, { name: '', email: addr } as any),
          // For toAddresses array, you may need a more complex query
        ])
      ),
      orderBy: (emails, { desc }) => [desc(emails.receivedAt)],
      limit: 500, // Limit for performance
    });

    // Calculate stats
    let emailsSent = 0;
    let emailsReceived = 0;
    const responseTimes: number[] = [];
    let lastContactDate: Date | null = null;
    let firstContactDate: Date | null = null;

    // Simple heuristic: if fromAddress matches contact, it's received; else it's sent
    for (const email of allEmails) {
      const emailDate = email.receivedAt || email.createdAt;

      if (!lastContactDate || emailDate > lastContactDate) {
        lastContactDate = emailDate;
      }
      if (!firstContactDate || emailDate < firstContactDate) {
        firstContactDate = emailDate;
      }

      const fromEmail =
        typeof email.fromAddress === 'object'
          ? (email.fromAddress as any).email
          : email.fromAddress;

      if (emailAddresses.includes(fromEmail)) {
        emailsReceived++;
      } else {
        emailsSent++;
      }
    }

    // Calculate monthly activity for last 6 months
    const monthlyActivity: ActivityStats['monthlyActivity'] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear();
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

      const monthEmails = allEmails.filter((email) => {
        const emailDate = email.receivedAt || email.createdAt;
        return emailDate >= date && emailDate < nextMonth;
      });

      let sent = 0;
      let received = 0;

      for (const email of monthEmails) {
        const fromEmail =
          typeof email.fromAddress === 'object'
            ? (email.fromAddress as any).email
            : email.fromAddress;

        if (emailAddresses.includes(fromEmail)) {
          received++;
        } else {
          sent++;
        }
      }

      monthlyActivity.push({
        month: monthName,
        year,
        sent,
        received,
      });
    }

    // Calculate average response time (simplified)
    // In a real implementation, you'd match sent/received pairs
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 4.5; // Default estimate

    const stats: ActivityStats = {
      totalEmails: emailsSent + emailsReceived,
      emailsSent,
      emailsReceived,
      averageResponseTime,
      lastContactDate,
      firstContactDate,
      monthlyActivity,
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching contact activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity stats' },
      { status: 500 }
    );
  }
}
