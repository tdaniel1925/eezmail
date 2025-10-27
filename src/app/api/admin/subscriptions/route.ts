import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin/auth';
import { db } from '@/db';
import { subscriptions, users } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all subscriptions with user details
    const allSubscriptions = await db
      .select({
        subscription: subscriptions,
        user: users,
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.startDate));

    // Calculate statistics
    const totalSubscriptions = allSubscriptions.length;
    const activeSubscriptions = allSubscriptions.filter(
      (s) => s.subscription.status === 'active'
    ).length;

    // Calculate monthly revenue (sum of all active subscriptions)
    const monthlyRevenue = allSubscriptions
      .filter((s) => s.subscription.status === 'active')
      .reduce((sum, s) => {
        return sum + parseFloat(s.subscription.monthlyAmount || '0');
      }, 0);

    // Calculate churn rate (canceled in last 30 days / total active 30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const canceledRecently = allSubscriptions.filter((s) => {
      const cancelDate = s.subscription.cancelDate;
      return (
        cancelDate &&
        new Date(cancelDate) >= thirtyDaysAgo &&
        s.subscription.status === 'canceled'
      );
    }).length;

    const churnRate =
      totalSubscriptions > 0
        ? (canceledRecently / totalSubscriptions) * 100
        : 0;

    return NextResponse.json({
      subscriptions: allSubscriptions.map((s) => ({
        ...s.subscription,
        user: s.user,
      })),
      stats: {
        totalSubscriptions,
        activeSubscriptions,
        monthlyRevenue,
        churnRate,
      },
    });
  } catch (error) {
    console.error('[Admin Subscriptions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
