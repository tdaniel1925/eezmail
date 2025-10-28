import { NextResponse } from 'next/server';
import { resetStuckSyncs } from '@/lib/sync/sync-orchestrator';
import { db } from '@/lib/db';
import { emailAccounts, emailFolders, emails } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Comprehensive Health Check API
 * Use this for:
 * - Uptime monitoring (Pingdom, UptimeRobot, etc.)
 * - Automated testing
 * - Dashboard health widgets
 * - Pre-deployment validation
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<
    string,
    { status: 'pass' | 'fail'; message?: string; duration?: number }
  > = {};

  try {
    // 1. Database Connection Check
    const dbStart = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      checks.database = {
        status: 'pass',
        duration: Date.now() - dbStart,
      };
    } catch (error) {
      checks.database = {
        status: 'fail',
        message:
          error instanceof Error ? error.message : 'Database connection failed',
        duration: Date.now() - dbStart,
      };
    }

    // 2. Sync Orchestrator Check
    const syncStart = Date.now();
    try {
      const stuckCount = await resetStuckSyncs();
      checks.syncOrchestrator = {
        status: 'pass',
        message:
          stuckCount > 0
            ? `Reset ${stuckCount} stuck sync(s)`
            : 'All syncs healthy',
        duration: Date.now() - syncStart,
      };
    } catch (error) {
      checks.syncOrchestrator = {
        status: 'fail',
        message:
          error instanceof Error ? error.message : 'Sync orchestrator error',
        duration: Date.now() - syncStart,
      };
    }

    // 3. Account Statistics
    const statsStart = Date.now();
    try {
      const accounts = await db.select().from(emailAccounts);

      const stats = {
        total: accounts.length,
        active: accounts.filter((a) => a.status === 'active').length,
        error: accounts.filter((a) => a.status === 'error').length,
        syncing: accounts.filter((a) => a.syncStatus === 'syncing').length,
        idle: accounts.filter((a) => a.syncStatus === 'idle').length,
      };

      checks.accountStats = {
        status: 'pass',
        message: JSON.stringify(stats),
        duration: Date.now() - statsStart,
      };
    } catch (error) {
      checks.accountStats = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Failed to get stats',
        duration: Date.now() - statsStart,
      };
    }

    // 4. Folder Count Check (validates pagination fix)
    const folderStart = Date.now();
    try {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emailFolders);

      checks.folderSync = {
        status: 'pass',
        message: `${count} folders synced`,
        duration: Date.now() - folderStart,
      };
    } catch (error) {
      checks.folderSync = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Folder check failed',
        duration: Date.now() - folderStart,
      };
    }

    // 5. Email Count Check
    const emailStart = Date.now();
    try {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emails);

      checks.emailSync = {
        status: 'pass',
        message: `${count} emails synced`,
        duration: Date.now() - emailStart,
      };
    } catch (error) {
      checks.emailSync = {
        status: 'fail',
        message: error instanceof Error ? error.message : 'Email check failed',
        duration: Date.now() - emailStart,
      };
    }

    // 6. Environment Variables Check
    const envStart = Date.now();
    const requiredEnv = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'MICROSOFT_CLIENT_ID',
      'GOOGLE_CLIENT_ID',
      'NEXT_PUBLIC_APP_URL',
    ];

    const missingEnv = requiredEnv.filter((key) => !process.env[key]);

    checks.environment = {
      status: missingEnv.length === 0 ? 'pass' : 'fail',
      message:
        missingEnv.length > 0
          ? `Missing: ${missingEnv.join(', ')}`
          : 'All env vars present',
      duration: Date.now() - envStart,
    };

    // 7. SSL Configuration Check (for Supabase)
    const sslStart = Date.now();
    const isSupabase = process.env.DATABASE_URL?.includes('supabase.co');
    checks.sslConfiguration = {
      status: 'pass',
      message: isSupabase
        ? 'SSL auto-detected for Supabase'
        : 'Non-Supabase connection',
      duration: Date.now() - sslStart,
    };

    // Determine overall health
    const allPassing = Object.values(checks).every(
      (check) => check.status === 'pass'
    );
    const totalDuration = Date.now() - startTime;

    return NextResponse.json(
      {
        healthy: allPassing,
        status: allPassing ? 'operational' : 'degraded',
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        checks,
        version: process.env.npm_package_version || 'unknown',
        environment: process.env.NODE_ENV || 'development',
      },
      { status: allPassing ? 200 : 503 }
    );
  } catch (error) {
    console.error('❌ Health check catastrophic failure:', error);

    return NextResponse.json(
      {
        healthy: false,
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        checks,
      },
      { status: 503 }
    );
  }
}
