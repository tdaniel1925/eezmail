# Phase 7: Auto-Logging Implementation Guide

**Status**: 📋 Ready to Implement  
**Priority**: Medium (Optional Enhancement)  
**Estimated Time**: 2-3 hours

---

## 🎯 Overview

Implement automatic timeline event logging when users perform actions with contacts. This creates a complete audit trail of all interactions without requiring manual entry.

---

## 📋 Auto-Logging Points

### 1. Email Sent (High Priority)

**When**: User sends an email via EmailComposer  
**File**: `src/components/email/EmailComposer.tsx`  
**Helper**: `logEmailSent(contactId, subject, emailId)`

**Implementation**:

```typescript
// In EmailComposer handleSend function
import { logEmailSent } from '@/lib/contacts/timeline-actions';

const handleSend = async () => {
  // ... existing send logic

  // After email is successfully sent
  if (sentEmail.success) {
    // Extract recipient email addresses
    const recipients = [...toAddresses, ...ccAddresses, ...bccAddresses];

    // Find contact IDs for recipients
    for (const recipient of recipients) {
      const contact = await findContactByEmail(recipient);
      if (contact) {
        await logEmailSent(contact.id, subject, sentEmail.id);
      }
    }
  }
};
```

**Required Helper Function**:

```typescript
// src/lib/contacts/helpers.ts
export async function findContactByEmail(email: string) {
  const result = await db.query.contacts.findFirst({
    where: exists(
      db
        .select()
        .from(contactEmails)
        .where(
          and(
            eq(contactEmails.email, email),
            eq(contactEmails.contactId, contacts.id)
          )
        )
    ),
  });
  return result?.id;
}
```

---

### 2. Email Received (High Priority)

**When**: New emails are synced from Nylas/IMAP  
**File**: `src/lib/email/email-sync-service.ts`  
**Helper**: `logEmailReceived(contactId, subject, emailId)`

**Implementation**:

```typescript
// In email sync service after saving new email
import { logEmailReceived } from '@/lib/contacts/timeline-actions';
import { findContactByEmail } from '@/lib/contacts/helpers';

async function processNewEmail(email: NylasEmail) {
  // ... existing email processing

  // Save email to database
  const savedEmail = await db.insert(emails).values({...}).returning();

  // Auto-log to contact timeline
  const contactId = await findContactByEmail(email.from.email);
  if (contactId) {
    await logEmailReceived(contactId, email.subject, savedEmail.id);
  }
}
```

---

### 3. Voice Message Sent (Medium Priority)

**When**: User records and sends a voice message  
**File**: `src/components/email/EmailComposer.tsx` (after voice attachment)  
**Helper**: `logVoiceMessageSent(contactId, duration?)`

**Implementation**:

```typescript
// In EmailComposer after voice message is attached and email is sent
import { logVoiceMessageSent } from '@/lib/contacts/timeline-actions';

const handleSend = async () => {
  // ... existing send logic

  // After email with voice attachment is sent
  if (sentEmail.success && hasVoiceAttachment) {
    const recipients = [...toAddresses, ...ccAddresses];

    for (const recipient of recipients) {
      const contact = await findContactByEmail(recipient);
      if (contact) {
        await logVoiceMessageSent(
          contact.id,
          voiceRecordingDuration // in seconds
        );
      }
    }
  }
};
```

---

### 4. Note Added (Low Priority - Already Implemented)

**When**: User creates a note via ContactNotes component  
**Status**: ✅ Already auto-logged  
**File**: `src/components/contacts/ContactNotes.tsx`

The `createContactNote` server action should already log this. Verify:

```typescript
// In src/lib/contacts/notes-actions.ts
export async function createContactNote(contactId: string, content: string) {
  // ... create note in database

  // Auto-log to timeline
  await addTimelineEvent(contactId, {
    eventType: 'note_added',
    title: 'Added note',
    description: content.substring(0, 100) + '...',
  });

  return { success: true, note: newNote };
}
```

---

### 5. Document Shared (Low Priority)

**When**: User attaches a file to an email  
**File**: `src/components/email/EmailComposer.tsx`  
**Helper**: `logDocumentShared(contactId, fileName, documentId?)`

**Implementation**:

```typescript
// In EmailComposer after email with attachments is sent
import { logDocumentShared } from '@/lib/contacts/timeline-actions';

const handleSend = async () => {
  // ... existing send logic

  // After email with attachments is sent
  if (sentEmail.success && attachments.length > 0) {
    const recipients = [...toAddresses, ...ccAddresses];

    for (const recipient of recipients) {
      const contact = await findContactByEmail(recipient);
      if (contact) {
        for (const attachment of attachments) {
          await logDocumentShared(
            contact.id,
            attachment.fileName,
            attachment.id
          );
        }
      }
    }
  }
};
```

---

### 6. Meeting Scheduled (Future Enhancement)

**When**: Calendar integration is implemented  
**Status**: ⏳ Pending calendar feature  
**Helper**: `logMeetingScheduled(contactId, title, date)`

**Future Implementation**:

```typescript
// In future calendar integration
import { logMeetingScheduled } from '@/lib/contacts/timeline-actions';

async function scheduleMeeting(meeting: Meeting) {
  // ... create meeting in calendar

  // Log to all attendee timelines
  for (const attendee of meeting.attendees) {
    const contact = await findContactByEmail(attendee.email);
    if (contact) {
      await logMeetingScheduled(contact.id, meeting.title, meeting.startDate);
    }
  }
}
```

---

### 7. Contact Created (Low Priority)

**When**: New contact is created from email or manually  
**Files**:

- `src/app/api/contacts/route.ts` (manual creation)
- Email sync (automatic from email)

**Implementation**:

```typescript
// In contact creation handler
import { createContactTimelineEvent } from '@/lib/contacts/timeline-actions';

async function createContact(contactData: ContactData) {
  // ... create contact in database

  // Auto-log creation event
  await createContactTimelineEvent({
    contactId: newContact.id,
    eventType: 'contact_created',
    title: 'Contact created',
    description: `Added from ${source}`, // e.g., "Added from email exchange"
    metadata: { source },
  });

  return newContact;
}
```

---

## 🔧 Implementation Steps

### Step 1: Create Helper Function

Create `src/lib/contacts/helpers.ts`:

```typescript
'use server';

import { db } from '@/lib/db';
import { contacts, contactEmails } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

/**
 * Find a contact by email address
 * Returns contact ID if found, null otherwise
 */
export async function findContactByEmail(
  email: string
): Promise<string | null> {
  const { userId } = auth();
  if (!userId) return null;

  try {
    // Find contact with matching email
    const result = await db
      .select({ id: contacts.id })
      .from(contacts)
      .innerJoin(contactEmails, eq(contactEmails.contactId, contacts.id))
      .where(
        and(
          eq(contacts.userId, userId),
          eq(contactEmails.email, email.toLowerCase())
        )
      )
      .limit(1);

    return result[0]?.id || null;
  } catch (error) {
    console.error('Error finding contact by email:', error);
    return null;
  }
}

/**
 * Find contacts for multiple email addresses
 * Returns map of email -> contactId
 */
export async function findContactsByEmails(
  emails: string[]
): Promise<Record<string, string>> {
  const { userId } = auth();
  if (!userId) return {};

  try {
    const results = await db
      .select({
        email: contactEmails.email,
        contactId: contacts.id,
      })
      .from(contacts)
      .innerJoin(contactEmails, eq(contactEmails.contactId, contacts.id))
      .where(
        and(
          eq(contacts.userId, userId),
          sql`${contactEmails.email} = ANY(${emails.map((e) => e.toLowerCase())})`
        )
      );

    return Object.fromEntries(results.map((r) => [r.email, r.contactId]));
  } catch (error) {
    console.error('Error finding contacts by emails:', error);
    return {};
  }
}
```

### Step 2: Update EmailComposer

Add auto-logging to `src/components/email/EmailComposer.tsx`:

```typescript
import {
  logEmailSent,
  logVoiceMessageSent,
  logDocumentShared,
} from '@/lib/contacts/timeline-actions';
import { findContactsByEmails } from '@/lib/contacts/helpers';

// In handleSend, after successful send
const handleSend = async () => {
  try {
    // ... existing send logic
    const result = await sendEmail(emailData);

    if (result.success) {
      // Collect all recipient emails
      const recipientEmails = [
        ...toAddresses,
        ...ccAddresses,
        ...bccAddresses,
      ].map((addr) => addr.email);

      // Find all contacts
      const contactMap = await findContactsByEmails(recipientEmails);

      // Log email sent to each contact
      for (const [email, contactId] of Object.entries(contactMap)) {
        await logEmailSent(contactId, subject, result.emailId);

        // If has voice attachment
        if (voiceRecordingBlob) {
          await logVoiceMessageSent(contactId, voiceRecordingDuration);
        }

        // If has file attachments
        if (attachments.length > 0) {
          for (const attachment of attachments) {
            await logDocumentShared(
              contactId,
              attachment.fileName,
              attachment.id
            );
          }
        }
      }

      toast.success('Email sent and logged to contacts');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    toast.error('Failed to send email');
  }
};
```

### Step 3: Update Email Sync Service

Add auto-logging to `src/lib/email/email-sync-service.ts`:

```typescript
import { logEmailReceived } from '@/lib/contacts/timeline-actions';
import { findContactByEmail } from '@/lib/contacts/helpers';

// In email sync function
async function syncNewEmails(userId: string) {
  // ... fetch new emails from Nylas

  for (const nylasEmail of newEmails) {
    // Save email to database
    const savedEmail = await db
      .insert(emails)
      .values({
        // ... email data
      })
      .returning();

    // Auto-log to contact timeline
    try {
      const contactId = await findContactByEmail(nylasEmail.from.email);
      if (contactId) {
        await logEmailReceived(contactId, nylasEmail.subject, savedEmail[0].id);
      }
    } catch (error) {
      // Don't fail sync if logging fails
      console.error('Failed to log email to contact:', error);
    }
  }
}
```

### Step 4: Update Contact Creation

Add auto-logging to `src/app/api/contacts/route.ts`:

```typescript
import { createContactTimelineEvent } from '@/lib/contacts/timeline-actions';

export async function POST(request: Request) {
  // ... create contact

  const newContact = await db
    .insert(contacts)
    .values({
      // ... contact data
    })
    .returning();

  // Auto-log creation
  await createContactTimelineEvent({
    contactId: newContact[0].id,
    eventType: 'contact_created',
    title: 'Contact created',
    description: 'Manually added to contacts',
    metadata: { source: 'manual' },
  });

  return NextResponse.json({ success: true, contact: newContact[0] });
}
```

---

## 🧪 Testing Checklist

### Email Sent Logging

- [ ] Send email to single contact
- [ ] Verify event appears in contact timeline
- [ ] Send email to multiple contacts
- [ ] Verify all contacts get timeline event
- [ ] Send email with voice attachment
- [ ] Verify voice message event logged

### Email Received Logging

- [ ] Trigger email sync manually
- [ ] Send email to test account from known contact
- [ ] Verify received event appears in timeline
- [ ] Check event includes correct subject and link

### Document Sharing Logging

- [ ] Send email with attachment
- [ ] Verify document shared event logged
- [ ] Verify multiple attachments create multiple events

### Contact Creation Logging

- [ ] Create new contact manually
- [ ] Verify creation event appears immediately
- [ ] Check event metadata contains source

---

## 🚨 Error Handling

All auto-logging should be wrapped in try-catch to prevent failures from breaking main flows:

```typescript
try {
  await logEmailSent(contactId, subject, emailId);
} catch (error) {
  // Log error but don't throw
  console.error('Failed to log email to contact timeline:', error);
  // Optionally: send to error tracking service
}
```

**Rationale**: Timeline logging is nice-to-have, not critical. Don't fail email sends if logging fails.

---

## 📊 Expected Timeline Events

After full implementation, contacts will automatically have:

- ✅ **Email Sent**: Every outgoing email
- ✅ **Email Received**: Every incoming email
- ✅ **Voice Message Sent**: Every voice message attachment
- ✅ **Note Added**: Every manual note
- ✅ **Document Shared**: Every file attachment
- ✅ **Contact Created**: When contact is added
- ⏳ **Meeting Scheduled**: Future (when calendar integrated)
- ⏳ **Call Made**: Future (when call tracking added)

---

## 🎯 Success Criteria

- [ ] Email sends automatically log to recipient contacts
- [ ] Email sync automatically logs to sender contacts
- [ ] Voice messages create separate timeline events
- [ ] File attachments create document shared events
- [ ] No auto-logging errors prevent email sending
- [ ] Timeline events appear immediately (no delay)
- [ ] Multiple recipients all get logged
- [ ] Performance impact < 100ms per email

---

## 💡 Optimization Tips

### 1. Batch Operations

When sending to multiple contacts, batch the timeline inserts:

```typescript
// Instead of:
for (const contactId of contactIds) {
  await logEmailSent(contactId, subject, emailId);
}

// Do:
await Promise.all(
  contactIds.map((contactId) => logEmailSent(contactId, subject, emailId))
);
```

### 2. Background Processing

For email sync, consider queue-based logging:

```typescript
// Add to queue instead of waiting
await queue.add('logEmailReceived', {
  contactId,
  emailSubject,
  emailId,
});
```

### 3. Rate Limiting

Prevent spam by checking last event time:

```typescript
// Don't log if same email sent < 5 seconds ago
const lastEvent = await getLastContactEvent(contactId, 'email_sent');
if (lastEvent && Date.now() - lastEvent.createdAt < 5000) {
  return; // Skip duplicate
}
```

---

## 📝 Documentation Updates

After implementation, update:

- `PHASE_7_AUTO_LOGGING_COMPLETE.md` - Implementation summary
- `RIGHT_SIDEBAR_TABS_INTEGRATION.md` - Add auto-logging section
- `README.md` - Mention automatic contact tracking

---

**Phase 7 Ready to Implement!**

This guide provides everything needed to add automatic timeline event logging throughout the application.
