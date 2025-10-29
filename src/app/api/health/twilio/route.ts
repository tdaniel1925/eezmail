import { NextResponse } from 'next/server';
import { validateTwilioConfig } from '@/lib/twilio/client';

/**
 * GET /api/health/twilio
 * Health check endpoint for Twilio configuration
 */
export async function GET() {
  const validation = validateTwilioConfig();

  if (!validation.valid) {
    return NextResponse.json(
      {
        status: 'error',
        service: 'twilio',
        error: validation.error,
        message: 'Twilio SMS service is not properly configured',
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    service: 'twilio',
    message: 'Twilio SMS service is properly configured',
  });
}
