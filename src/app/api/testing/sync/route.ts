import { NextRequest, NextResponse } from 'next/server';
import { syncTester } from '@/lib/testing/sync-tests';

export async function GET() {
  try {
    const results = await syncTester.runAllTests();
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync tests failed:', error);
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
