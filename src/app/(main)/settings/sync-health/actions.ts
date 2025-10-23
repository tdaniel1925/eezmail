// src/app/(main)/settings/sync-health/actions.ts
'use server';

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function getSyncHealthData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get account health summaries
  const accountsResult = await db.execute(sql`
    SELECT 
      ea.id,
      ea.email,
      ea.provider,
      ea.status,
      sh.total_syncs,
      sh.successful_syncs,
      sh.failed_syncs,
      sh.avg_duration_ms,
      sh.total_messages_processed,
      sh.total_messages_failed,
      sh.total_duplicates_found,
      sh.total_rate_limit_hits,
      sh.last_sync_at
    FROM email_accounts ea
    LEFT JOIN sync_health_summary sh ON ea.id = sh.account_id
    WHERE ea.user_id = ${user.id}
    ORDER BY ea.email
  `);

  const accounts = accountsResult.rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    provider: row.provider,
    status: row.status,
    lastSyncAt: row.last_sync_at,
    totalSyncs: parseInt(row.total_syncs || '0'),
    successfulSyncs: parseInt(row.successful_syncs || '0'),
    failedSyncs: parseInt(row.failed_syncs || '0'),
    avgDurationMs: parseFloat(row.avg_duration_ms || '0'),
    totalMessagesProcessed: parseInt(row.total_messages_processed || '0'),
    totalMessagesFailed: parseInt(row.total_messages_failed || '0'),
    totalDuplicatesFound: parseInt(row.total_duplicates_found || '0'),
    totalRateLimitHits: parseInt(row.total_rate_limit_hits || '0'),
  }));

  // Calculate overall stats
  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter(a => a.status === 'active').length;
  const healthyAccounts = accounts.filter(a => {
    const successRate = a.totalSyncs > 0 
      ? (a.successfulSyncs / a.totalSyncs) * 100 
      : 0;
    return successRate >= 90;
  }).length;
  const unhealthyAccounts = totalAccounts - healthyAccounts;

  const avgSuccessRate = accounts.length > 0
    ? accounts.reduce((sum, a) => {
        const rate = a.totalSyncs > 0 
          ? (a.successfulSyncs / a.totalSyncs) * 100 
          : 0;
        return sum + rate;
      }, 0) / accounts.length
    : 0;

  const totalMessagesProcessed = accounts.reduce(
    (sum, a) => sum + a.totalMessagesProcessed,
    0
  );

  // Get syncs in last 24 hours
  const syncCountResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM sync_metrics sm
    JOIN email_accounts ea ON sm.account_id = ea.id
    WHERE ea.user_id = ${user.id}
      AND sm.started_at > NOW() - INTERVAL '24 hours'
  `);
  const totalSyncsLast24h = parseInt((syncCountResult.rows[0] as any)?.count || '0');

  // Get recent failures
  const failuresResult = await db.execute(sql`
    SELECT 
      fsm.id,
      ea.email as account_email,
      fsm.message_id,
      fsm.subject,
      fsm.error_type,
      fsm.error_message,
      fsm.retry_count,
      fsm.created_at
    FROM failed_sync_messages fsm
    JOIN email_accounts ea ON fsm.account_id = ea.id
    WHERE ea.user_id = ${user.id}
      AND fsm.status IN ('pending', 'retrying')
    ORDER BY fsm.created_at DESC
    LIMIT 10
  `);

  const recentFailures = failuresResult.rows.map((row: any) => ({
    id: row.id,
    accountEmail: row.account_email,
    messageId: row.message_id,
    subject: row.subject,
    errorType: row.error_type,
    errorMessage: row.error_message,
    retryCount: parseInt(row.retry_count || '0'),
    createdAt: row.created_at,
  }));

  return {
    accounts,
    overall: {
      totalAccounts,
      activeAccounts,
      healthyAccounts,
      unhealthyAccounts,
      avgSuccessRate,
      totalMessagesProcessed,
      totalSyncsLast24h,
    },
    recentFailures,
  };
}

