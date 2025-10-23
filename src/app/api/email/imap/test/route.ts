/**
 * IMAP Connection Test API
 * Tests IMAP connection without saving
 */

import { NextRequest, NextResponse } from 'next/server';
import { IMAPService } from '@/lib/email/imap-service';

// Set route timeout to 40 seconds
export const maxDuration = 40;

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

    // Create timeout promise (30 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Connection test timed out after 30 seconds'));
      }, 30000);
    });

    // Test IMAP connection
    const imapService = new IMAPService({
      host,
      port: parseInt(port),
      secure: secure === true,
      username: email,
      password,
    });

    // Race between connection test and timeout
    const isConnected = await Promise.race([
      imapService.testConnection(),
      timeoutPromise,
    ]);

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

    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide helpful error messages
      if (errorMessage.includes('ENOTFOUND')) {
        errorMessage = 'Server not found - check your IMAP host';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused - check port and firewall';
      } else if (errorMessage.includes('Timed out')) {
        errorMessage =
          'Connection timed out - wrong password or IMAP not enabled';
      } else if (errorMessage.includes('Invalid credentials')) {
        errorMessage =
          'Invalid credentials - use an app password, not your regular password';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
