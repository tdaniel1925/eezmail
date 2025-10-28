import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify environment variables
 * REMOVE THIS FILE AFTER DEBUGGING
 */
export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
    VERCEL_URL: process.env.VERCEL_URL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    // Show what URL would be used
    computedUrl:
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'),
  });
}

