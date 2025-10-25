import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTwilioClientForUser } from '@/lib/twilio/client-factory';

/**
 * GET /api/twilio/sms-status/[messageSid]
 * Check SMS delivery status from Twilio
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { messageSid: string } }
): Promise<Response> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageSid } = params;

    // Get Twilio client
    const { client } = await getTwilioClientForUser(user.id);

    // Fetch message status from Twilio
    const message = await client.messages(messageSid).fetch();

    return NextResponse.json({
      success: true,
      status: message.status,
      to: message.to,
      from: message.from,
      dateCreated: message.dateCreated,
      dateUpdated: message.dateUpdated,
      dateSent: message.dateSent,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      price: message.price,
      priceUnit: message.priceUnit,
    });
  } catch (error: any) {
    console.error('Error fetching SMS status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch SMS status' },
      { status: 500 }
    );
  }
}

