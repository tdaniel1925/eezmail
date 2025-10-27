# Email Notification System - Complete Guide

## Overview

EaseMail now has a comprehensive notification email system for sandbox companies. This system automatically sends beautifully designed emails to users and admins when specific events occur.

## Features

✅ **Professional Email Templates**

- HTML templates with responsive design
- Plain text fallbacks for all emails
- Consistent branding and styling
- Template variable system

✅ **Automated Notifications**

- User welcome emails when assigned to sandbox
- Admin notifications for company creation
- Admin notifications for user assignments
- User notifications when removed from sandbox

✅ **Notification Settings**

- Per-user notification preferences
- Category-based controls
- Multi-channel support (email, SMS, push)
- Database-backed settings

✅ **Admin Management UI**

- Preview all email templates
- Copy HTML/text for customization
- Test with sample data
- Customization guide included

## Architecture

### File Structure

```
src/
├── lib/
│   └── notifications/
│       ├── sandbox-email-templates.ts  # Email templates
│       └── sandbox-notifications.ts    # Notification service
├── components/
│   └── admin/
│       └── EmailTemplateManager.tsx    # Admin UI
├── app/
│   ├── admin/
│   │   └── email-templates/
│   │       └── page.tsx                # Admin page
│   └── api/
│       └── admin/
│           └── sandbox-companies/      # API routes (updated)
└── db/
    └── schema.ts                       # Database schema (updated)
```

### Database Schema

New table: `notification_settings`

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  category VARCHAR(50),
  enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Email Templates

### 1. User Welcome Email (`userWelcome`)

**Trigger:** User is assigned to a sandbox company  
**Recipients:** The assigned user  
**Purpose:** Welcome user, explain sandbox features, provide quick start guide

**Variables:**

- `userName` - User's full name
- `userEmail` - User's email address
- `companyName` - Sandbox company name
- `loginUrl` - Dashboard login URL
- `supportUrl` - Support/help URL

**Template Preview:**

- Gradient header (purple/blue)
- Feature highlights with checkmarks
- 4-step quick start guide
- Call-to-action button
- Help resources section

### 2. Admin Company Created (`adminCompanyCreated`)

**Trigger:** New sandbox company is created  
**Recipients:** The admin who created it  
**Purpose:** Confirm creation, show company details

**Variables:**

- `adminName` - Admin's full name
- `companyName` - Company name
- `companyId` - UUID for reference
- `createdDate` - Creation timestamp
- `hasTwilioCredentials` - ✅ Yes or ❌ No
- `hasOpenAICredentials` - ✅ Yes or ❌ No
- `dashboardUrl` - Link to company management

### 3. Admin User Assigned (`adminUserAssigned`)

**Trigger:** User is assigned to a sandbox company  
**Recipients:** The admin who made the assignment  
**Purpose:** Confirm assignment, show user details

**Variables:**

- `adminName` - Admin's full name
- `userName` - Assigned user's name
- `userEmail` - Assigned user's email
- `companyName` - Company name
- `companyId` - Company UUID
- `assignedDate` - Assignment timestamp
- `dashboardUrl` - Link to company dashboard

### 4. User Removed (`userRemoved`)

**Trigger:** User is removed from a sandbox company  
**Recipients:** The removed user  
**Purpose:** Inform user of access removal, provide support contact

**Variables:**

- `userName` - User's full name
- `companyName` - Company they were removed from
- `supportUrl` - Link to support

## How Notifications Are Sent

### 1. Automatic Triggers

Notifications are automatically sent when:

```typescript
// When user is assigned to company
POST /api/admin/sandbox-companies/[id]/users
→ Sends userWelcome to user
→ Sends adminUserAssigned to admin

// When company is created
POST /api/admin/sandbox-companies
→ Sends adminCompanyCreated to admin

// When user is removed
DELETE /api/admin/sandbox-companies/[id]/users/[userId]
→ Sends userRemoved to user
```

### 2. Non-Blocking Execution

All notifications are sent asynchronously and don't block the main request:

```typescript
// Send notifications (non-blocking)
Promise.all([
  sendUserWelcomeNotification(userId, companyId),
  sendAdminUserAssignedNotification(userId, companyId, adminId),
]).catch((error) => {
  console.error('Error sending notifications:', error);
  // Don't fail the request if notifications fail
});
```

### 3. Notification Preferences

Users can control which notifications they receive:

```typescript
// Check if notifications are enabled
const notificationsEnabled = await areNotificationsEnabled(
  userId,
  'sandbox_assignment'
);
if (!notificationsEnabled) {
  return { success: true }; // Skip notification
}
```

## Customization Guide

### Method 1: Edit Template Files (Recommended)

**For developers who want full control:**

1. **Open the template file:**

   ```
   src/lib/notifications/sandbox-email-templates.ts
   ```

2. **Find the template function:**

   ```typescript
   export function getUserWelcomeTemplate(
     variables: TemplateVariables
   ): EmailTemplate {
     // Edit HTML and text here
   }
   ```

3. **Edit the HTML:**
   - Change colors, fonts, layout
   - Add/remove sections
   - Modify content
   - Use template variables: `{{variableName}}`

4. **Edit the plain text version:**
   - Keep synchronized with HTML
   - Maintain formatting

5. **Restart dev server:**
   ```bash
   npm run dev
   ```

**Example Edit:**

```typescript
const html = renderTemplate(
  `
  <!DOCTYPE html>
  <html>
  <body>
    <h1 style="color: #YOUR_BRAND_COLOR;">
      Welcome to {{companyName}}!
    </h1>
    <p>Hi {{userName}},</p>
    <p>Your custom message here...</p>
  </body>
  </html>
  `,
  variables
);
```

### Method 2: Use External Email Service

**For teams using SendGrid, Postmark, Mailgun, etc.:**

1. **Access Admin Panel:**
   - Go to `/admin/email-templates`
   - Preview desired template
   - Click "Copy HTML"

2. **Create Template in Your Service:**
   - SendGrid: Marketing → Email Templates
   - Postmark: Templates → Create Template
   - Paste the HTML code

3. **Update Email Service:**

   ```typescript
   // src/lib/notifications/sandbox-notifications.ts
   async function sendEmailViaService(params: EmailParams): Promise<boolean> {
     // Replace with your service
     const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         personalizations: [{ to: [{ email: params.to }] }],
         from: { email: params.from || 'noreply@easemail.ai' },
         subject: params.subject,
         content: [
           { type: 'text/plain', value: params.text },
           { type: 'text/html', value: params.html },
         ],
       }),
     });
     return response.ok;
   }
   ```

4. **Add Environment Variables:**
   ```bash
   # .env.local
   SENDGRID_API_KEY=your_key_here
   ```

### Method 3: Configure SMTP

**For custom SMTP servers:**

1. **Install Nodemailer:**

   ```bash
   npm install nodemailer
   ```

2. **Update Email Service:**

   ```typescript
   import nodemailer from 'nodemailer';

   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: parseInt(process.env.SMTP_PORT || '587'),
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });

   async function sendEmailViaService(params: EmailParams): Promise<boolean> {
     try {
       await transporter.sendMail({
         from: params.from || 'noreply@easemail.ai',
         to: params.to,
         subject: params.subject,
         text: params.text,
         html: params.html,
       });
       return true;
     } catch (error) {
       console.error('SMTP Error:', error);
       return false;
     }
   }
   ```

3. **Add SMTP Credentials:**
   ```bash
   # .env.local
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

## Admin UI Usage

### Access Email Template Manager

1. **Navigate to Admin Panel:**

   ```
   http://localhost:3000/admin/email-templates
   ```

2. **Preview Templates:**
   - Click "Preview" on any template card
   - View HTML rendering in iframe
   - See plain text version
   - Check available variables

3. **Copy Templates:**
   - Click "Copy HTML" to copy HTML code
   - Click "Copy Text" to copy plain text
   - Click "Copy" on subject to copy subject line

4. **Customize:**
   - Follow the on-screen customization guide
   - Choose your preferred method
   - Test changes in sandbox environment

## Testing Notifications

### Test User Assignment

1. **Create Sandbox Company:**

   ```
   POST /api/admin/sandbox-companies
   Body: { name: "Test Company", ... }
   ```

   → Admin receives "Company Created" email

2. **Assign User:**

   ```
   POST /api/admin/sandbox-companies/[id]/users
   Body: { userId: "user-uuid" }
   ```

   → User receives "Welcome" email  
   → Admin receives "User Assigned" email

3. **Remove User:**
   ```
   DELETE /api/admin/sandbox-companies/[id]/users/[userId]
   ```
   → User receives "User Removed" email

### Check Console Logs

All notification events are logged:

```
📧 [Sandbox] Sending welcome notification to user abc-123
✅ [Sandbox] Welcome notification sent to john@example.com
```

Error logging:

```
❌ [Sandbox] Error sending notification: Connection timeout
```

## Environment Variables

Required variables for email sending:

```bash
# App URLs
NEXT_PUBLIC_APP_URL=https://app.easemail.ai

# Email Service (Choose one method)

# Method 1: SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# Method 2: Postmark
POSTMARK_API_KEY=your_postmark_key

# Method 3: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## Troubleshooting

### Emails Not Sending

1. **Check console logs:**

   ```
   📧 [Sandbox Notification] Sending email: { to: '...', subject: '...' }
   ```

2. **Verify sendEmailViaService implementation:**
   - Currently uses console.log placeholder
   - Replace with actual email service

3. **Check user notification settings:**
   ```sql
   SELECT * FROM notification_settings
   WHERE user_id = 'user-uuid'
   AND category = 'sandbox_assignment';
   ```

### Template Variables Not Rendering

1. **Check variable names:**
   - Must match exactly: `{{userName}}` not `{{user_name}}`
   - Case-sensitive

2. **Verify data passed to template:**
   ```typescript
   const variables: TemplateVariables = {
     userName: user.fullName || 'User', // Fallback if null
     // ...
   };
   ```

### HTML Not Displaying Correctly

1. **Test in email client preview tools:**
   - Litmus
   - Email on Acid
   - Mailtrap

2. **Validate HTML:**
   - Use W3C validator
   - Check for unclosed tags

3. **Test plain text fallback:**
   - Some clients prefer plain text

## API Reference

### Notification Functions

```typescript
// Send welcome email to user
await sendUserWelcomeNotification(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error?: string }>

// Send company created notification to admin
await sendAdminCompanyCreatedNotification(
  companyId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }>

// Send user assigned notification to admin
await sendAdminUserAssignedNotification(
  userId: string,
  companyId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }>

// Send removal notification to user
await sendUserRemovedNotification(
  userId: string,
  companyName: string
): Promise<{ success: boolean; error?: string }>
```

### Template Functions

```typescript
// Get rendered template
const template = SANDBOX_TEMPLATES.userWelcome({
  userName: 'John Doe',
  companyName: 'Acme Corp',
  // ... other variables
});

// Returns:
// {
//   subject: string,
//   html: string,
//   text: string
// }
```

## Best Practices

### 1. Email Design

- ✅ Use responsive design (mobile-friendly)
- ✅ Keep important content above the fold
- ✅ Use clear call-to-action buttons
- ✅ Include plain text versions
- ✅ Test in multiple email clients

### 2. Template Variables

- ✅ Always provide fallback values
- ✅ Sanitize user input to prevent XSS
- ✅ Use descriptive variable names
- ✅ Document available variables

### 3. Notification Timing

- ✅ Send immediately for time-sensitive actions
- ✅ Batch non-urgent notifications
- ✅ Respect user timezone preferences
- ✅ Don't spam users with too many emails

### 4. Error Handling

- ✅ Log all email sending attempts
- ✅ Don't fail main operations if email fails
- ✅ Implement retry logic for transient errors
- ✅ Monitor email delivery rates

### 5. Compliance

- ✅ Include unsubscribe links (for marketing emails)
- ✅ Respect Do Not Disturb settings
- ✅ Follow CAN-SPAM regulations
- ✅ Include physical mailing address
- ✅ Honor opt-out requests immediately

## Future Enhancements

### Planned Features

1. **Visual Template Editor**
   - Drag-and-drop interface
   - Live preview
   - No code required

2. **A/B Testing**
   - Test subject lines
   - Test content variations
   - Automatic winner selection

3. **Advanced Analytics**
   - Open rates
   - Click-through rates
   - Conversion tracking

4. **Scheduled Notifications**
   - Send at optimal times
   - Timezone-aware delivery
   - Batch processing

5. **Multi-language Support**
   - Detect user language
   - Load appropriate template
   - Maintain translations

6. **Email Campaign Builder**
   - Drip campaigns
   - Onboarding sequences
   - Re-engagement campaigns

## Support

For questions or issues:

1. **Check Documentation:**
   - This guide (EMAIL_NOTIFICATION_SYSTEM.md)
   - Template comments in code
   - API documentation

2. **Review Console Logs:**
   - All operations are logged
   - Error messages included

3. **Test in Sandbox:**
   - Use sandbox companies
   - Assign test users
   - Verify email delivery

4. **Contact Support:**
   - Open GitHub issue
   - Email: support@easemail.ai
   - Slack: #email-notifications

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Maintainer:** EaseMail Development Team
