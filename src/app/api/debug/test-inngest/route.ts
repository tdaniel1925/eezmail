import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

/**
 * DEBUG: Test if Inngest is working
 * Visit: http://localhost:3000/api/debug/test-inngest
 */
export async function GET() {
  try {
    console.log('🧪 Testing Inngest connection...');

    // Try to send a test event
    const result = await inngest.send({
      name: 'test/debug',
      data: {
        message: 'Testing from debug endpoint',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Inngest event sent:', result);

    return NextResponse.json({
      success: true,
      message: 'Inngest is working!',
      eventIds: result.ids,
      instructions: [
        '1. Check Inngest dashboard: http://localhost:8288',
        '2. Look in Events tab for test/debug event',
        '3. If you see it, Inngest is connected properly',
      ],
    });
  } catch (error) {
    console.error('❌ Inngest test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Inngest is NOT working',
        troubleshooting: [
          '1. Make sure Inngest dev server is running: npx inngest-cli@latest dev',
          '2. Check that it shows "ready at http://localhost:8288"',
          '3. Restart Next.js dev server',
          '4. Try again',
        ],
      },
      { status: 500 }
    );
  }
}
