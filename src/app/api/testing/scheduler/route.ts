import { NextRequest, NextResponse } from 'next/server';
import { testScheduler } from '@/lib/testing/test-scheduler';

export async function GET() {
  try {
    const history = testScheduler.getTestHistory();
    const isRunning = testScheduler.isRunning();

    return NextResponse.json({
      success: true,
      isRunning,
      history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test scheduler status failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'start') {
      testScheduler.start();
      return NextResponse.json({
        success: true,
        message: 'Test scheduler started',
      });
    } else if (action === 'stop') {
      testScheduler.stop();
      return NextResponse.json({
        success: true,
        message: 'Test scheduler stopped',
      });
    } else if (action === 'run') {
      await testScheduler.runScheduledTest();
      return NextResponse.json({
        success: true,
        message: 'Test run completed',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Test scheduler action failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}
