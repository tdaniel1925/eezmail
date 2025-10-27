# 🚀 Quick Start - Notification Templates

## Step 1: Run the Migration (2 minutes)

1. Open your Supabase project
2. Go to SQL Editor
3. Create a new query
4. Copy the entire contents of `migrations/create_notification_templates.sql`
5. Click "Run"
6. ✅ You now have 3 new tables and 2 default templates!

## Step 2: Configure Resend (5 minutes)

### Get your API Key

1. Go to https://resend.com
2. Sign up for a free account
3. Verify your domain (or use their test domain for development)
4. Go to API Keys → Create API Key
5. Copy the key (starts with `re_`)

### Add to Environment

Edit `.env.local`:

```bash
RESEND_API_KEY=re_your_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPPORT_EMAIL=support@easemail.ai
```

## Step 3: Test It! (3 minutes)

### Option A: Send a Test Email via API

```bash
# 1. Get a template ID
curl http://localhost:3000/api/admin/templates

# 2. Send test email
curl -X POST http://localhost:3000/api/admin/templates/{template-id}/test \
  -H "Content-Type: application/json" \
  -d '{
    "testEmail": "your-email@example.com",
    "variables": {
      "userName": "Test User",
      "dashboardLink": "http://localhost:3000/dashboard"
    }
  }'
```

### Option B: Send via Code

```typescript
// In any server action or API route
import { sendNotification } from '@/lib/notifications/notification-service';

// Send welcome email
const result = await sendNotification({
  templateSlug: 'welcome-all-users',
  recipientId: 'user-uuid-here', // Must be existing user ID
  variables: {
    userName: 'John Doe',
    dashboardLink: 'http://localhost:3000/dashboard',
    supportEmail: 'support@easemail.ai',
    currentYear: '2025',
  },
});

console.log(result.success ? '✅ Email sent!' : `❌ Failed: ${result.error}`);
```

## Step 4: Create Your First Custom Template

### Via API:

```typescript
const response = await fetch('http://localhost:3000/api/admin/templates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Password Reset',
    slug: 'password-reset',
    type: 'transactional',
    audience: 'all',
    status: 'active',
    subject: 'Reset Your Password',
    htmlContent: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h1>Password Reset Request</h1>
          <p>Hi {{userName}},</p>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetLink}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>This link expires in {{expiryTime}}.</p>
        </body>
      </html>
    `,
    textContent:
      'Hi {{userName}}, Click this link to reset your password: {{resetLink}}. Expires in {{expiryTime}}.',
    variables: ['userName', 'resetLink', 'expiryTime'],
    fromName: 'EaseMail Security',
    fromEmail: 'security@easemail.ai',
  }),
});

const { template } = await response.json();
console.log('Template created:', template.id);
```

## Step 5: Set Up Automated Processing (Optional)

### Add to Inngest (if using Inngest):

```typescript
// src/inngest/functions/process-notifications.ts
import { inngest } from '@/inngest/client';
import { processScheduledNotifications } from '@/lib/notifications/notification-service';

export const processNotifications = inngest.createFunction(
  {
    id: 'process-scheduled-notifications',
    name: 'Process Scheduled Notifications',
  },
  { cron: '*/5 * * * *' }, // Every 5 minutes
  async ({ step }) => {
    return await step.run('process-notifications', async () => {
      return await processScheduledNotifications();
    });
  }
);
```

### Or use a simple cron (Node-Cron):

```typescript
// Add to your server startup
import cron from 'node-cron';
import { processScheduledNotifications } from '@/lib/notifications/notification-service';

// Every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await processScheduledNotifications();
});
```

---

## 🎯 Common Use Cases

### 1. Welcome Email (New User Signup)

```typescript
// In your signup handler
await sendNotification({
  templateSlug: 'welcome-all-users',
  recipientId: newUser.id,
  variables: {
    userName: newUser.fullName,
    dashboardLink: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  },
});
```

### 2. Password Reset

```typescript
// In password reset request handler
await sendNotification({
  templateSlug: 'password-reset',
  recipientId: user.id,
  variables: {
    userName: user.fullName,
    resetLink: generateResetLink(user.id),
    expiryTime: '24 hours',
  },
});
```

### 3. Sandbox User Welcome

```typescript
// When assigning user to sandbox company
await sendNotification({
  templateSlug: 'welcome-sandbox-user',
  recipientId: user.id,
  variables: {
    userName: user.fullName,
    companyName: sandboxCompany.name,
    loginLink: `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`,
  },
});
```

### 4. Bulk Announcement (All Enterprise Users)

```typescript
// Get all enterprise users
const enterpriseUsers = await db
  .select({ id: users.id })
  .from(users)
  .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
  .where(eq(subscriptions.tier, 'enterprise'));

// Send bulk notification
await sendBulkNotification({
  templateSlug: 'enterprise-feature-announcement',
  recipientIds: enterpriseUsers.map((u) => u.id),
  variables: {
    featureName: 'Advanced Analytics Dashboard',
    launchDate: 'November 1, 2025',
  },
});
```

---

## 🔍 Troubleshooting

### Email not sending?

1. Check Resend API key is set in `.env.local`
2. Check recipient exists in `users` table
3. Check template status is 'active'
4. Check template audience matches user type
5. Look for errors in terminal/logs

### Template not found?

1. Verify template `slug` is correct
2. Check template `status` is 'active'
3. Run migration if templates table is empty

### Variables not substituting?

1. Make sure variable names match: `{{userName}}` (not `{{username}}`)
2. Check you're passing variables object
3. Verify variable names are in template's `variables` array

### Can't send to test email?

1. Test email must belong to an existing user in database
2. Create a test user first, then use their email

---

## 📚 Full Documentation

For complete documentation, see:

- **NOTIFICATION_TEMPLATE_SYSTEM.md** - Complete reference
- **NOTIFICATION_IMPLEMENTATION_SUMMARY.md** - What was built

---

## ✅ You're Done!

You now have a production-ready notification system! 🎉

**Next**: Build an admin UI to manage templates visually, or continue using the APIs directly.
