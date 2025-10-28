import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * GET /api/health
 * Health check endpoint to test database connection
 */
export async function GET() {
  const results: {
    timestamp: string;
    environment: string;
    database: {
      configured: boolean;
      connectionString?: string;
      connected: boolean;
      error?: string;
      userCount?: number;
      queryTest?: string;
    };
    supabase: {
      urlConfigured: boolean;
      keyConfigured: boolean;
      url?: string;
    };
  } = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    database: {
      configured: false,
      connected: false,
    },
    supabase: {
      urlConfigured: false,
      keyConfigured: false,
    },
  };

  // Check if DATABASE_URL is configured
  if (process.env.DATABASE_URL) {
    results.database.configured = true;

    // Show connection string (with password masked)
    const connStr = process.env.DATABASE_URL;
    results.database.connectionString = connStr.replace(/:[^@]+@/, ':****@');
  }

  // Check Supabase configuration
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    results.supabase.urlConfigured = true;
    results.supabase.url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    results.supabase.keyConfigured = true;
  }

  // Try to connect to database
  try {
    // Test 1: Simple query
    const testResult = await db.execute(sql`SELECT 1 as test`);
    results.database.queryTest = 'Success';

    // Test 2: Count users
    const userCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    results.database.userCount = Number(userCount[0]?.count || 0);
    results.database.connected = true;
  } catch (error) {
    results.database.connected = false;
    results.database.error =
      error instanceof Error ? error.message : String(error);
  }

  // Return status code based on database connection
  const statusCode = results.database.connected ? 200 : 503;

  return NextResponse.json(results, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
