import { NextRequest, NextResponse } from 'next/server';
import { voiceTester } from '@/lib/testing/voice-tests';

export async function GET() {
  try {
    const results = await voiceTester.runAllTests();
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Voice tests failed:', error);
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


