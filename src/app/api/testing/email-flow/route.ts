import { NextRequest, NextResponse } from 'next/server';
import { emailFlowTester } from '@/lib/testing/email-flow-tests';

export async function GET() {
  try {
    const results = await emailFlowTester.runAllTests();
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Email flow tests failed:', error);
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


