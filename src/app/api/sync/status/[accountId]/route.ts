import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { emailAccounts, emailFolders } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await params;

    // Fetch account details
    const [account] = await db
      .select()
      .from(emailAccounts)
      .where(
        and(eq(emailAccounts.id, accountId), eq(emailAccounts.userId, user.id))
      )
      .limit(1);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Fetch folder stats
    const folders = await db
      .select()
      .from(emailFolders)
      .where(
        and(
          eq(emailFolders.accountId, accountId),
          eq(emailFolders.userId, user.id)
        )
      );

    const foldersTotal = folders.length;
    const foldersCompleted = folders.filter(
      (f) => f.lastSyncAt !== null
    ).length;

    // Calculate sync speed (emails synced in last minute)
    const syncSpeed = calculateSyncSpeed(account);

    // Calculate ETA
    const estimatedTimeRemaining = calculateETA(
      account.syncProgress ?? 0,
      account.syncTotal ?? 0,
      syncSpeed
    );

    // Determine current folder being synced
    const currentFolder = getCurrentFolder(folders);

    return NextResponse.json({
      accountId: account.id,
      emailAddress: account.emailAddress,
      status: account.status,
      syncProgress: account.syncProgress ?? 0,
      syncTotal: account.syncTotal ?? 0,
      currentFolder,
      foldersCompleted,
      foldersTotal,
      estimatedTimeRemaining,
      syncSpeed,
      lastSyncAt: account.lastSyncAt,
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}

function calculateSyncSpeed(
  account: typeof emailAccounts.$inferSelect
): number {
  // If not syncing, return 0
  if (account.status !== 'syncing') return 0;

  // If no progress or just started, estimate based on typical speed
  if (!account.syncProgress || account.syncProgress < 10) {
    return 5.0; // Default estimate: 5 emails/sec
  }

  // Calculate based on time since last sync
  if (account.lastSyncAt) {
    const timeSinceLastSync =
      Date.now() - new Date(account.lastSyncAt).getTime();
    const minutesSinceLastSync = timeSinceLastSync / 60000;

    if (minutesSinceLastSync > 0 && minutesSinceLastSync < 60) {
      // Reasonable time window
      return account.syncProgress / (minutesSinceLastSync * 60);
    }
  }

  // Default fallback
  return 3.0;
}

function calculateETA(progress: number, total: number, speed: number): string {
  if (speed <= 0 || progress >= total) return 'N/A';

  const remaining = total - progress;
  const secondsRemaining = remaining / speed;

  if (secondsRemaining < 60) {
    return `${Math.round(secondsRemaining)}s`;
  } else if (secondsRemaining < 3600) {
    const minutes = Math.round(secondsRemaining / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.round((secondsRemaining % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

function getCurrentFolder(
  folders: Array<typeof emailFolders.$inferSelect>
): string | undefined {
  // Find the most recently updated folder that's currently syncing
  const recentFolders = folders
    .filter((f) => f.lastSyncAt !== null)
    .sort(
      (a, b) =>
        new Date(b.lastSyncAt!).getTime() - new Date(a.lastSyncAt!).getTime()
    );

  if (recentFolders.length > 0) {
    return recentFolders[0].name;
  }

  return undefined;
}
