/**
 * Contact Communication Actions
 * Send SMS and Email to contacts
 */

'use server';

import { db } from '@/db';
import { contacts, contactEmails, contactPhones } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { sendSMS } from '@/lib/twilio/sms';
import { addTimelineEvent } from './timeline-actions';
import { createClient } from '@/lib/supabase/server';
import { getSMSRate, chargeSMS } from '@/lib/billing/pricing';

// ============================================================================
// SMS
// ============================================================================

export async function sendContactSMS(
  contactId: string,
  message: string
): Promise<{ success: boolean; error?: string; messageSid?: string }> {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get contact
    const contact = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, contactId), eq(contacts.userId, user.id)),
    });

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Get primary phone number from contactPhones table
    const phoneRecord =
      (await db.query.contactPhones.findFirst({
        where: and(
          eq(contactPhones.contactId, contactId),
          eq(contactPhones.isPrimary, true)
        ),
      })) ||
      (await db.query.contactPhones.findFirst({
        where: eq(contactPhones.contactId, contactId),
      }));

    if (!phoneRecord || !phoneRecord.phone) {
      return { success: false, error: 'Contact has no phone number' };
    }

    const phone = phoneRecord.phone;

    // Send SMS via Twilio FIRST (before charging)
    const result = await sendSMS(user.id, phone, message, contactId);

    if (!result.success) {
      // No charge if SMS failed to send
      console.error('❌ SMS failed to send:', result.error);
      return { success: false, error: result.error };
    }

    // Get SMS rate for this user
    const rate = await getSMSRate(user.id);
    console.log(`📤 SMS rate for user ${user.id}: $${rate}`);

    // Charge for SMS AFTER successful send
    const chargeResult = await chargeSMS(user.id, rate, {
      contactId,
      phoneNumber: phone,
      messageSid: result.messageSid,
    });

    if (!chargeResult.success) {
      // SMS sent but charge failed - log for manual review
      console.error(
        '⚠️ SMS sent successfully but charge failed:',
        chargeResult.error
      );
      console.error(
        '⚠️ Manual billing review needed for messageSid:',
        result.messageSid
      );
      // Still return success since SMS was sent
      // Admin can review and bill manually later
    } else {
      console.log(
        `✅ SMS charged: $${chargeResult.amount} from ${chargeResult.chargedFrom}`
      );
    }

    // Add to timeline
    await addTimelineEvent(contactId, {
      eventType: 'sms_sent',
      title: 'SMS Sent',
      description: message ? message.substring(0, 100) : '(No message)',
      metadata: {
        messageSid: result.messageSid,
        phone,
        messageLength: message?.length || 0,
        deliveryStatus: 'queued',
        sentAt: new Date(),
        cost: chargeResult.success ? chargeResult.amount : 0,
        chargedFrom: chargeResult.success
          ? chargeResult.chargedFrom
          : 'pending_manual_review',
        chargeStatus: chargeResult.success ? 'charged' : 'charge_failed',
      },
    });

    console.log(`✅ SMS sent to contact ${contactId} at ${phone}`);

    return {
      success: true,
      messageSid: result.messageSid, // ✅ Return messageSid for status tracking
    };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

// ============================================================================
// EMAIL
// ============================================================================

export async function prepareContactEmail(contactId: string): Promise<{
  success: boolean;
  email?: string;
  name?: string;
  error?: string;
}> {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get contact
    const contact = await db.query.contacts.findFirst({
      where: and(eq(contacts.id, contactId), eq(contacts.userId, user.id)),
    });

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Get primary email from contactEmails table
    const emailRecord =
      (await db.query.contactEmails.findFirst({
        where: and(
          eq(contactEmails.contactId, contactId),
          eq(contactEmails.isPrimary, true)
        ),
      })) ||
      (await db.query.contactEmails.findFirst({
        where: eq(contactEmails.contactId, contactId),
      }));

    if (!emailRecord || !emailRecord.email) {
      return { success: false, error: 'Contact has no email address' };
    }

    const email = emailRecord.email;
    const name =
      contact.displayName ||
      `${contact.firstName || ''} ${contact.lastName || ''}`;

    return {
      success: true,
      email,
      name: name.trim(),
    };
  } catch (error) {
    console.error('❌ Error preparing email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare email',
    };
  }
}

export async function logEmailSent(
  contactId: string,
  subject: string,
  preview: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Add to timeline
    await addTimelineEvent(contactId, {
      eventType: 'email_sent',
      title: `Email: ${subject}`,
      description: preview.substring(0, 200),
      metadata: {
        subject,
        sentAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error logging email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log email',
    };
  }
}
