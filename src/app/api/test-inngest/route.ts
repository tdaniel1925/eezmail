import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

/**
 * Test endpoint to trigger Inngest sync
 * Visit: http://localhost:3000/api/test-inngest
 */
export async function GET() {
  try {
    console.log('🚀 Triggering test Inngest function...');

    // Trigger the test function
    const result = await inngest.send({
      name: 'test/sync',
      data: {
        message: 'Hello from test endpoint!',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ Inngest function triggered:', result);

    return NextResponse.json({
      success: true,
      message: 'Inngest test function triggered!',
      inngestEventId: result.ids[0],
      instructions: [
        '1. Run: npx inngest-cli@latest dev',
        '2. Open: http://localhost:8288',
        '3. You should see your test-sync function running with 3 steps!',
      ],
    });
  } catch (error) {
    console.error('❌ Error triggering Inngest:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          "Make sure you've installed Inngest: npm install inngest",
          'Run the Inngest dev server: npx inngest-cli@latest dev',
        ],
      },
      { status: 500 }
    );
  }
}
