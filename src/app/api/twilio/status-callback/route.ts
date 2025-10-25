import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactTimeline } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/twilio/status-callback
 * Webhook endpoint for Twilio SMS delivery status updates
 * 
 * Twilio will POST to this endpoint with status updates:
 * - queued: Message queued in Twilio
 * - sent: Message sent from Twilio
 * - delivered: Message delivered to recipient's phone
 * - undelivered: Message failed to deliver
 * - failed: Message send failed
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    
    // Extract Twilio callback parameters
    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;

    console.log('📲 Twilio Status Callback:', {
      messageSid,
      messageStatus,
      to,
      from,
      errorCode,
      errorMessage,
    });

    // Find the timeline event by message SID in metadata
    const timelineEvents = await db.query.contactTimeline.findMany({
      where: eq(contactTimeline.eventType, 'sms_sent'),
    });

    // Find the matching event
    const matchingEvent = timelineEvents.find(
      (event) => event.metadata && 
      typeof event.metadata === 'object' && 
      'messageSid' in event.metadata && 
      event.metadata.messageSid === messageSid
    );

    if (matchingEvent) {
      // Update the timeline event with delivery status
      const updatedMetadata = {
        ...(matchingEvent.metadata as Record<string, any>),
        deliveryStatus: messageStatus,
        deliveredAt: messageStatus === 'delivered' ? new Date() : null,
        errorCode,
        errorMessage,
        lastStatusUpdate: new Date(),
      };

      await db
        .update(contactTimeline)
        .set({
          metadata: updatedMetadata,
          updatedAt: new Date(),
        })
        .where(eq(contactTimeline.id, matchingEvent.id));

      console.log(`✅ Updated timeline event ${matchingEvent.id} with status: ${messageStatus}`);

      // If failed or undelivered, create a new timeline entry
      if (messageStatus === 'failed' || messageStatus === 'undelivered') {
        await db.insert(contactTimeline).values({
          contactId: matchingEvent.contactId,
          userId: matchingEvent.userId,
          eventType: 'sms_failed',
          title: 'SMS Delivery Failed',
          description: errorMessage || `SMS failed with status: ${messageStatus}`,
          metadata: {
            originalMessageSid: messageSid,
            errorCode,
            errorMessage,
            failureReason: messageStatus,
            phone: to,
          },
        });
      }
    } else {
      console.warn(`⚠️ No timeline event found for message SID: ${messageSid}`);
    }

    // Always return 200 to Twilio
    return NextResponse.json({ success: true, status: messageStatus });
  } catch (error) {
    console.error('Error processing Twilio status callback:', error);
    // Still return 200 to prevent Twilio from retrying
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 200 });
  }
}

/**
 * GET /api/twilio/status-callback
 * Handle Twilio validation requests
 */
export async function GET(req: NextRequest): Promise<Response> {
  return NextResponse.json({ 
    message: 'Twilio Status Callback Endpoint',
    status: 'active' 
  });
}

