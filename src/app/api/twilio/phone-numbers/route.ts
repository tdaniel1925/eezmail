import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

/**
 * GET /api/twilio/phone-numbers
 * Fetch all A2P certified phone numbers from Twilio account
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credentials from query params or use system defaults
    const { searchParams } = new URL(req.url);
    const accountSid = searchParams.get('accountSid') || process.env.TWILIO_ACCOUNT_SID;
    const authToken = searchParams.get('authToken') || process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Twilio credentials not configured' },
        { status: 400 }
      );
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Fetch all phone numbers
    const phoneNumbers = await client.incomingPhoneNumbers.list();

    // Filter for A2P certified numbers and format the response
    const formattedNumbers = phoneNumbers
      .filter((number) => {
        // A2P numbers typically have capabilities and are not trial numbers
        return (
          number.capabilities &&
          number.capabilities.sms &&
          !number.friendlyName?.toLowerCase().includes('trial')
        );
      })
      .map((number) => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: number.capabilities,
        sid: number.sid,
        // A2P status might be in voiceApplicationSid or other fields
        // Twilio doesn't always expose A2P status directly via API
      }));

    return NextResponse.json({
      success: true,
      phoneNumbers: formattedNumbers,
      total: formattedNumbers.length,
    });
  } catch (error: any) {
    console.error('Error fetching Twilio phone numbers:', error);
    
    // Handle specific Twilio errors
    if (error.code === 20003) {
      return NextResponse.json(
        { error: 'Invalid Twilio credentials' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch phone numbers',
        success: false,
      },
      { status: 500 }
    );
  }
}

