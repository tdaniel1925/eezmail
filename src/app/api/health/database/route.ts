import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Simple connectivity check with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database health check timeout')), 5000)
    );

    const healthCheckPromise = db.execute(sql`SELECT 1`);

    await Promise.race([healthCheckPromise, timeoutPromise]);

    return NextResponse.json({
      isHealthy: true,
      score: 100,
      issues: [],
      recommendations: [],
      missingColumns: [],
      missingIndexes: [],
      enumIssues: [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json(
      {
        isHealthy: false,
        score: 0,
        issues: [`Health check failed: ${String(error)}`],
        recommendations: ['Check database connection and configuration'],
        missingColumns: [],
        missingIndexes: [],
        enumIssues: [],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
