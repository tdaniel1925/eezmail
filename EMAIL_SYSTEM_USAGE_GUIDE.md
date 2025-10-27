# 📧 EaseMail Template System - Complete Usage Guide

## 🎯 Quick Start (3 Steps)

### Step 1: Run the Database Migration

```sql
-- In Supabase SQL Editor, copy and paste the templates
-- I've created the structure - you'll need to add the full HTML
-- from your template to each INSERT statement
```

### Step 2: Send Your First Email

```typescript
import { sendWelcomeEmail } from '@/lib/notifications/email-helpers';

// Send welcome email to new user
await sendWelcomeEmail('user-id-here');
```

### Step 3: Done! ✅

---

## 📚 All Available Email Functions

### Welcome Emails

```typescript
import { emailHelpers } from '@/lib/notifications/email-helpers';

// Regular user welcome
await emailHelpers.sendWelcomeEmail(userId);

// Sandbox user welcome
await emailHelpers.sendSandboxWelcomeEmail(userId, companyId);
```

### Authentication & Security

```typescript
// Password reset
await emailHelpers.sendPasswordResetEmail(userId, 'reset-token-123', {
  ip: '192.168.1.1',
  location: 'San Francisco, CA',
});

// Email verification
await emailHelpers.sendEmailVerification(
  userId,
  'verification-token',
  '123456' // 6-digit code
);

// Security alert
await emailHelpers.sendSecurityAlert(userId, {
  type: 'New Login Detected',
  time: new Date(),
  ip: '192.168.1.1',
  location: 'San Francisco, CA',
  device: 'Chrome on macOS',
  actionRequired: 'Review your recent activity',
});
```

### Subscription Management

```typescript
// Subscription confirmed
await emailHelpers.sendSubscriptionConfirmation(userId);

// Payment failed
await emailHelpers.sendPaymentFailedEmail(
  userId,
  new Date('2025-11-01') // Next retry date
);

// Trial ending
await emailHelpers.sendTrialEndingEmail(userId);
```

### Support & Features

```typescript
// Support ticket response
await emailHelpers.sendSupportTicketResponse(userId, {
  id: 'TICKET-123',
  subject: 'Login Issue',
  status: 'resolved',
  agentName: 'John Doe',
  agentEmail: 'john@easemail.ai',
});

// Feature announcement (to all users)
await emailHelpers.sendFeatureAnnouncement(
  {
    name: 'AI Smart Compose',
    description: 'Write emails 10x faster with AI',
    launchDate: new Date('2025-11-01'),
    link: 'https://app.easemail.ai/features/ai-compose',
  },
  'all'
); // or 'individual', 'team', 'enterprise'
```

---

## 🎨 All 15 Email Templates

| #   | Template Name          | Slug                      | When to Use                     |
| --- | ---------------------- | ------------------------- | ------------------------------- |
| 1   | Welcome - All Users    | `welcome-all-users`       | New user signs up               |
| 2   | Welcome - Sandbox      | `welcome-sandbox-user`    | User assigned to sandbox        |
| 3   | Password Reset         | `password-reset`          | User requests password reset    |
| 4   | Email Verification     | `email-verification`      | Email needs verification        |
| 5   | Subscription Confirmed | `subscription-confirmed`  | User upgrades to paid plan      |
| 6   | Payment Failed         | `payment-failed`          | Payment method fails            |
| 7   | Subscription Cancelled | `subscription-cancelled`  | User cancels subscription       |
| 8   | Trial Ending Soon      | `trial-ending-soon`       | 3 days before trial ends        |
| 9   | Security Alert         | `security-alert`          | Suspicious activity detected    |
| 10  | Account Locked         | `account-locked`          | Too many failed login attempts  |
| 11  | Email Changed          | `email-changed`           | User changes email address      |
| 12  | Support Response       | `support-ticket-response` | Agent responds to ticket        |
| 13  | Feature Announcement   | `feature-announcement`    | New feature launched            |
| 14  | Weekly Digest          | `weekly-digest`           | Weekly summary email            |
| 15  | Upgrade Prompt         | `upgrade-prompt`          | Encourage free users to upgrade |

---

## 🔧 Advanced: Custom Templates

### Send with Custom Variables

```typescript
import { sendNotification } from '@/lib/notifications/notification-service';
import { getCombinedVariables } from '@/lib/notifications/template-variables';

const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

const variables = getCombinedVariables({
  user,
  customVariables: {
    customField1: 'Custom Value 1',
    customField2: 'Custom Value 2',
    mySpecialLink: 'https://example.com/special',
  },
});

await sendNotification({
  templateId: 'your-custom-template-slug',
  recipientId: userId,
  variables,
});
```

### Schedule Email for Later

```typescript
const sendAt = new Date('2025-11-01T09:00:00Z');

await sendNotification({
  templateId: 'weekly-digest',
  recipientId: userId,
  variables,
  scheduledFor: sendAt,
});
```

### Send to External Email (Not in DB)

```typescript
await sendNotification({
  templateId: 'feature-announcement',
  recipientEmail: 'external@example.com',
  variables: {
    userName: 'External User',
    // ... other variables
  },
});
```

---

## 📊 Variable Reference

### Always Available (All Templates)

```typescript
{
  userName: 'John Doe',
  userEmail: 'john@example.com',
  dashboardLink: 'https://app.easemail.ai/dashboard',
  loginLink: 'https://app.easemail.ai/auth/login',
  helpCenterLink: 'https://app.easemail.ai/help',
  supportEmail: 'support@easemail.ai',
  currentYear: '2025',
  privacyPolicyLink: 'https://easemail.ai/privacy',
  termsOfServiceLink: 'https://easemail.ai/terms',
  unsubscribeLink: 'https://app.easemail.ai/unsubscribe',
}
```

### Sandbox-Specific

```typescript
{
  companyName: 'Acme Corp',
  companyId: 'company-uuid',
  sandboxFeatures: 'Full EaseMail feature set',
  expiryDate: 'December 31, 2025',
  daysRemaining: '30',
}
```

### Subscription-Specific

```typescript
{
  subscriptionTier: 'team',
  billingCycle: 'monthly',
  nextBillingDate: 'November 1, 2025',
  billingAmount: '$49.99',
  invoiceLink: 'https://app.easemail.ai/billing/invoices',
}
```

---

## 🚀 Integration Examples

### After User Signup

```typescript
// src/app/auth/signup/actions.ts
export async function signUpUser(email: string, password: string) {
  // Create user in Supabase
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (!error && data.user) {
    // Send welcome email
    await sendWelcomeEmail(data.user.id);
  }

  return { data, error };
}
```

### After Subscription

```typescript
// src/app/api/webhooks/stripe/route.ts
export async function POST(req: Request) {
  const event = await verifyStripeWebhook(req);

  if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object;
    const userId = subscription.metadata.userId;

    // Send confirmation email
    await sendSubscriptionConfirmation(userId);
  }

  return NextResponse.json({ received: true });
}
```

### Password Reset Flow

```typescript
// src/app/api/auth/forgot-password/route.ts
export async function POST(req: Request) {
  const { email } = await req.json();

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (user) {
    const resetToken = generateSecureToken();

    // Save token to database
    await saveResetToken(user.id, resetToken);

    // Send reset email
    await sendPasswordResetEmail(user.id, resetToken, {
      ip: getClientIp(req),
      location: await getLocationFromIp(getClientIp(req)),
    });
  }

  return NextResponse.json({ success: true });
}
```

---

## ✅ Checklist: Getting Started

- [ ] Run database migration (`seed_email_templates.sql`)
- [ ] Set `RESEND_API_KEY` in `.env.local`
- [ ] Set `NEXT_PUBLIC_APP_URL` in `.env.local`
- [ ] Test welcome email: `await sendWelcomeEmail(testUserId)`
- [ ] Test password reset: `await sendPasswordResetEmail(testUserId, 'test-token')`
- [ ] Verify emails arrive in inbox
- [ ] Check email rendering in multiple clients (Gmail, Outlook, etc.)
- [ ] Set up scheduled notification processing (cron job)

---

## 🛠️ Troubleshooting

### Email not sending?

1. Check `RESEND_API_KEY` is set correctly
2. Verify domain is configured in Resend
3. Check `notification_queue` table for error messages
4. Look for errors in terminal logs

### Variables not replacing?

1. Ensure variable names match exactly (case-sensitive)
2. Check you're passing variables object to `sendNotification()`
3. Verify template has the variable in its `variables` array

### Email rendering issues?

1. Test in Litmus or Email on Acid
2. Ensure inline styles are used (no external CSS)
3. Verify table-based layouts (not divs)
4. Check image URLs are absolute, not relative

---

## 📝 Next Steps

1. **Customize Templates**: Edit the HTML in the migration to match your exact branding
2. **Add More Templates**: Create custom templates for your specific use cases
3. **Set Up Analytics**: Track open rates, click rates, and conversions
4. **A/B Testing**: Create template variations to test subject lines and content
5. **Localization**: Add support for multiple languages

---

_Context improved by Giga AI - Used email template system, variables, helpers, and notification service for complete email solution._
