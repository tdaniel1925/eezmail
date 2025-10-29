import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { emailAccounts } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/aurinko/imap
 * Direct IMAP authentication via Aurinko (no OAuth)
 *
 * Body: {
 *   email: string,
 *   password: string,
 *   imapHost: string,
 *   imapPort: number,
 *   smtpHost: string,
 *   smtpPort: number
 * }
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, password, imapHost, imapPort, smtpHost, smtpPort } = body;

    // Validate required fields
    if (
      !email ||
      !password ||
      !imapHost ||
      !imapPort ||
      !smtpHost ||
      !smtpPort
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const clientId = process.env.AURINKO_CLIENT_ID;
    const clientSecret = process.env.AURINKO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('❌ Aurinko configuration missing');
      return NextResponse.json(
        { error: 'Aurinko not configured' },
        { status: 500 }
      );
    }

    console.log('📧 Authenticating IMAP account:', email);

    // Call Aurinko's OAuth authorization endpoint with IMAP service type
    // For IMAP, Aurinko handles the actual connection internally
    // Reference: https://docs.aurinko.io/unified-apis/direct-api
    const authUrl = new URL('https://api.aurinko.io/v1/auth/authorize');
    authUrl.searchParams.set('clientId', clientId);
    authUrl.searchParams.set('serviceType', 'IMAP');
    authUrl.searchParams.set('responseType', 'code');
    authUrl.searchParams.set('email', email);
    authUrl.searchParams.set('password', password);
    authUrl.searchParams.set('imapHost', imapHost);
    authUrl.searchParams.set('imapPort', imapPort.toString());
    authUrl.searchParams.set('smtpHost', smtpHost);
    authUrl.searchParams.set('smtpPort', smtpPort.toString());
    
    // Make direct API call to exchange credentials for access token
    const aurinkoResponse = await fetch(authUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!aurinkoResponse.ok) {
      const errorData = await aurinkoResponse.json();
      console.error('❌ Aurinko IMAP auth failed:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Failed to authenticate with IMAP' },
        { status: aurinkoResponse.status }
      );
    }

    const aurinkoData = await aurinkoResponse.json();
    console.log('✅ Aurinko account created:', aurinkoData.account);

    // Store the Aurinko account in our database
    const [account] = await db
      .insert(emailAccounts)
      .values({
        userId: user.id,
        email: email,
        provider: 'imap',
        aurinkoAccountId: aurinkoData.account,
        aurinkoAccessToken: aurinkoData.accessToken,
        aurinkoRefreshToken: aurinkoData.refreshToken,
        aurinkoProvider: 'IMAP',
        useAurinko: true,
        aurinkoTokenExpiresAt: aurinkoData.expiresAt
          ? new Date(aurinkoData.expiresAt * 1000)
          : null,
        syncEnabled: true,
      })
      .returning();

    console.log('✅ Email account saved to database:', account.id);

    return NextResponse.json({
      success: true,
      accountId: account.id,
      email: account.email,
    });
  } catch (error) {
    console.error('Error authenticating IMAP account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
