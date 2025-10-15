/**
 * IMAP Connection Test API
 * Tests IMAP connection without saving
 */

import { NextRequest, NextResponse } from 'next/server';
import { IMAPService } from '@/lib/email/imap-service';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, password, host, port, secure } = body;

    if (!email || !password || !host || !port) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing IMAP connection:', {
      email,
      host,
      port,
      secure,
    });

    // Test IMAP connection
    const imapService = new IMAPService({
      host,
      port: parseInt(port),
      secure: secure === true,
      username: email,
      password,
    });

    const isConnected = await imapService.testConnection();

    if (isConnected) {
      console.log('✅ IMAP connection successful');
      return NextResponse.json({ success: true });
    } else {
      console.log('❌ IMAP connection failed');
      return NextResponse.json(
        { success: false, error: 'Connection failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ IMAP test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
