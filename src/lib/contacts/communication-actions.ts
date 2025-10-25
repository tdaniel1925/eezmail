'use server';

/**
 * Communication Actions for Contacts
 * Send SMS, make voice calls, and send emails to contacts/groups
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contacts, contactGroups, contactGroupMembers, contactEmails, contactPhones } from '@/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { sendSMS, sendBulkSMS } from '@/lib/twilio/sms';
import { makeVoiceCall } from '@/lib/twilio/voice';
import { addTimelineEvent } from '@/lib/contacts/timeline-actions';

/**
 * Send email to a contact (opens composer with pre-filled data)
 * Returns data to open email composer, doesn't actually send
 */
export async function prepareContactEmail(contactId: string): Promise<{
  success: boolean;
  email?: string;
  name?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Get primary email from contactEmails table
    const emailRecord = await db.query.contactEmails.findFirst({
      where: and(
        eq(contactEmails.contactId, contactId),
        eq(contactEmails.isPrimary, true)
      ),
    }) || await db.query.contactEmails.findFirst({
      where: eq(contactEmails.contactId, contactId),
    });

    if (!emailRecord || !emailRecord.email) {
      return { success: false, error: 'Contact has no email address' };
    }

    const email = emailRecord.email;
    const name = contact.displayName || `${contact.firstName || ''} ${contact.lastName || ''}`;

    return {
      success: true,
      email,
      name: name.trim(),
    };
  } catch (error) {
    console.error('Error preparing contact email:', error);
    return { success: false, error: 'Failed to prepare email' };
  }
}

/**
 * Send SMS to a contact
 */
export async function sendContactSMS(
  contactId: string,
  message: string
): Promise<{
  success: boolean;
  error?: string;
  messageSid?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get contact details
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Get primary phone number from contactPhones table
    const phoneRecord = await db.query.contactPhones.findFirst({
      where: and(
        eq(contactPhones.contactId, contactId),
        eq(contactPhones.isPrimary, true)
      ),
    }) || await db.query.contactPhones.findFirst({
      where: eq(contactPhones.contactId, contactId),
    });

    if (!phoneRecord || !phoneRecord.phone) {
      return { success: false, error: 'Contact has no phone number' };
    }

    const phone = phoneRecord.phone;

    // Send SMS via Twilio
    const result = await sendSMS(user.id, phone, message, contactId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Log to contact timeline with enhanced metadata
    await addTimelineEvent(contactId, {
      eventType: 'sms_sent',
      title: 'SMS Sent',
      description: message.substring(0, 100),
      metadata: {
        messageSid: result.messageSid,
        phone,
        messageLength: message.length,
        deliveryStatus: 'queued', // Initial status
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      messageSid: result.messageSid,
    };
  } catch (error) {
    console.error('Error sending contact SMS:', error);
    return { success: false, error: 'Failed to send SMS' };
  }
}

/**
 * Make voice call to a contact
 */
export async function callContact(
  contactId: string,
  message: string,
  type: 'tts' | 'recording' = 'tts'
): Promise<{
  success: boolean;
  error?: string;
  callSid?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get contact details
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });

    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Get primary phone number from contactPhones table
    const phoneRecord = await db.query.contactPhones.findFirst({
      where: and(
        eq(contactPhones.contactId, contactId),
        eq(contactPhones.isPrimary, true)
      ),
    }) || await db.query.contactPhones.findFirst({
      where: eq(contactPhones.contactId, contactId),
    });

    const phone = phoneRecord?.phone || '';

    if (!phone) {
      return { success: false, error: 'Contact has no phone number' };
    }

    // Make voice call via Twilio (only TTS supported for now)
    const result = await makeVoiceCall(user.id, phone, message, contactId);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Log to contact timeline
    await addTimelineEvent(contactId, {
      eventType: 'voice_call_made',
      title: 'Voice Call Made',
      description: type === 'tts' ? message.substring(0, 100) : 'Pre-recorded message',
      metadata: {
        callSid: result.callSid,
        phone,
        type,
      },
    });

    return {
      success: true,
      callSid: result.callSid,
    };
  } catch (error) {
    console.error('Error making voice call:', error);
    return { success: false, error: 'Failed to make call' };
  }
}

/**
 * Send SMS to all members of a contact group
 */
export async function sendGroupSMS(
  groupId: string,
  message: string
): Promise<{
  success: boolean;
  error?: string;
  summary?: {
    total: number;
    sent: number;
    failed: number;
  };
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get group members
    const members = await db.query.contactGroupMembers.findMany({
      where: eq(contactGroupMembers.groupId, groupId),
    });

    if (members.length === 0) {
      return { success: false, error: 'Group has no members' };
    }

    // Get contact details for all members
    const contactIds = members.map((m) => m.contactId);
    const groupContacts = await db.query.contacts.findMany({
      where: inArray(contacts.id, contactIds),
    });

    // Prepare recipients with phone numbers
    const recipients = groupContacts
      .filter((c) => c.phone) // Only contacts with phone numbers
      .map((c) => ({
        phone: c.phone!,
        contactId: c.id,
      }));

    if (recipients.length === 0) {
      return { success: false, error: 'No contacts in group have phone numbers' };
    }

    // Send bulk SMS
    const result = await sendBulkSMS(user.id, recipients, message);

    // Log to timeline for each contact
    for (const recipient of result.results) {
      if (recipient.success && recipient.contactId) {
        await addTimelineEvent(recipient.contactId, {
          eventType: 'sms_sent',
          title: 'Group SMS Sent',
          description: message.substring(0, 100),
          metadata: {
            messageSid: recipient.messageSid,
            phone: recipient.phone,
            groupId,
          },
        });
      }
    }

    return {
      success: result.success,
      summary: result.summary,
    };
  } catch (error) {
    console.error('Error sending group SMS:', error);
    return { success: false, error: 'Failed to send group SMS' };
  }
}

/**
 * Send email to all members of a contact group
 * Returns list of emails to open composer
 */
export async function prepareGroupEmail(groupId: string): Promise<{
  success: boolean;
  emails?: string[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get group members
    const members = await db.query.contactGroupMembers.findMany({
      where: eq(contactGroupMembers.groupId, groupId),
    });

    if (members.length === 0) {
      return { success: false, error: 'Group has no members' };
    }

    // Get contact details
    const contactIds = members.map((m) => m.contactId);
    const groupContacts = await db.query.contacts.findMany({
      where: inArray(contacts.id, contactIds),
    });

    // Extract emails
    const emails = groupContacts
      .map((c) => c.email)
      .filter((email): email is string => !!email);

    if (emails.length === 0) {
      return { success: false, error: 'No contacts in group have email addresses' };
    }

    return {
      success: true,
      emails,
    };
  } catch (error) {
    console.error('Error preparing group email:', error);
    return { success: false, error: 'Failed to prepare group email' };
  }
}

