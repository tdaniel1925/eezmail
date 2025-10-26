import { NextResponse } from 'next/server';
import { checkInngestHealth } from '@/lib/inngest/health-check';

/**
 * Health check endpoint for Inngest service
 * GET /api/inngest/health
 */
export async function GET() {
  const health = await checkInngestHealth();
  return NextResponse.json(health);
}
