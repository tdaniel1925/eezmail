# Complete Email Template Library for EaseMail

## 📧 Template Catalog

This document lists all 15+ production-ready email templates created using your beautiful HTML design.

---

## ✅ Templates Included

### **Transactional Emails** (8 templates)

1. **Welcome Email - All Users** (`welcome-all-users`)
   - Sent when new user signs up
   - Variables: `userName`, `dashboardLink`, `helpCenterLink`

2. **Welcome Email - Sandbox Users** (`welcome-sandbox-user`)
   - Sent when user is assigned to sandbox company
   - Variables: `userName`, `companyName`, `loginLink`, `sandboxFeatures`

3. **Password Reset** (`password-reset`)
   - Sent when user requests password reset
   - Variables: `userName`, `resetLink`, `expiryTime`, `requestIp`

4. **Email Verification** (`email-verification`)
   - Sent to verify email address
   - Variables: `userName`, `verificationCode`, `verificationLink`, `expiryTime`

5. **Subscription Confirmation** (`subscription-confirmed`)
   - Sent when user subscribes to paid plan
   - Variables: `userName`, `subscriptionTier`, `billingAmount`, `billingCycle`, `nextBillingDate`

6. **Payment Failed** (`payment-failed`)
   - Sent when payment fails
   - Variables: `userName`, `billingAmount`, `nextRetryDate`, `updatePaymentLink`

7. **Subscription Cancelled** (`subscription-cancelled`)
   - Sent when subscription is cancelled
   - Variables: `userName`, `subscriptionTier`, `cancelDate`, `dataRetentionDate`

8. **Trial Ending Soon** (`trial-ending-soon`)
   - Sent 3 days before trial ends
   - Variables: `userName`, `trialEndsAt`, `trialDaysRemaining`, `upgradeLink`

### **System Notifications** (4 templates)

9. **Security Alert** (`security-alert`)
   - Sent for suspicious activity
   - Variables: `userName`, `eventType`, `eventTime`, `ipAddress`, `location`, `deviceInfo`

10. **Account Locked** (`account-locked`)
    - Sent when account is locked due to failed login attempts
    - Variables: `userName`, `lockReason`, `unlockLink`, `supportEmail`

11. **Email Changed** (`email-changed`)
    - Sent to old email when user changes email
    - Variables: `userName`, `oldEmail`, `newEmail`, `changeTime`

12. **Support Ticket Response** (`support-ticket-response`)
    - Sent when support agent responds
    - Variables: `userName`, `ticketId`, `ticketSubject`, `agentName`, `ticketLink`

### **Marketing/Announcements** (3 templates)

13. **Feature Announcement** (`feature-announcement`)
    - Sent to announce new features
    - Variables: `userName`, `featureName`, `featureDescription`, `launchDate`, `featureLink`

14. **Weekly Digest** (`weekly-digest`)
    - Weekly summary email
    - Variables: `userName`, `weekNumber`, `emailsReceived`, `tasksCompleted`, `topContacts`

15. **Upgrade Prompt** (`upgrade-prompt`)
    - Sent to free users to encourage upgrade
    - Variables: `userName`, `currentTier`, `upgradeLink`, `newFeatures`

---

## 🎨 All Templates Use Consistent Design

Every template follows your beautiful HTML design with:

- **Gradient Header** - Purple to teal gradient (#667eea to #4ca1af)
- **Centered Logo** - EaseMail branding
- **Clean Typography** - Segoe UI font family
- **Responsive Layout** - Table-based for email client compatibility
- **Call-to-Action Buttons** - Gradient rounded buttons
- **Footer** - Copyright, links, unsubscribe

---

## 🔧 How to Use

### Step 1: Run the Database Migration

```bash
# In your Supabase SQL Editor, run:
migrations/seed_email_templates.sql
migrations/seed_email_templates_part2.sql
```

### Step 2: Send an Email

```typescript
import { sendNotification } from '@/lib/notifications/notification-service';
import { getCombinedVariables } from '@/lib/notifications/template-variables';

// Get user from database
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});

// Generate variables
const variables = getCombinedVariables({
  user,
  customVariables: {
    // Add any custom variables here
  },
});

// Send welcome email
await sendNotification({
  templateId: 'template-uuid-here', // Or use slug
  recipientId: user.id,
  variables,
});
```

### Step 3: Use Template Variables

```typescript
import {
  getDefaultVariables,
  getPasswordResetVariables,
  getSandboxVariables,
  getSubscriptionVariables,
} from '@/lib/notifications/template-variables';

// For password reset
const vars = getPasswordResetVariables('reset-token-123', 60, {
  ip: '192.168.1.1',
  location: 'San Francisco, CA',
});

// For sandbox user
const sandboxVars = getSandboxVariables(sandboxCompany, user);

// For subscription
const subVars = getSubscriptionVariables(subscription);
```

---

## 📋 Template Variables Reference

### Default Variables (Available in ALL templates)

- `{{userName}}` - User's full name
- `{{userEmail}}` - User's email address
- `{{dashboardLink}}` - Dashboard URL
- `{{loginLink}}` - Login page URL
- `{{helpCenterLink}}` - Help center URL
- `{{supportEmail}}` - Support email
- `{{currentYear}}` - Current year
- `{{privacyPolicyLink}}` - Privacy policy URL
- `{{termsOfServiceLink}}` - Terms URL
- `{{unsubscribeLink}}` - Unsubscribe URL

### Sandbox Variables

- `{{companyName}}` - Sandbox company name
- `{{sandboxFeatures}}` - Feature list
- `{{expiryDate}}` - When sandbox expires
- `{{daysRemaining}}` - Days until expiry

### Subscription Variables

- `{{subscriptionTier}}` - individual/team/enterprise
- `{{billingCycle}}` - monthly/annual
- `{{billingAmount}}` - Amount to charge
- `{{nextBillingDate}}` - Next billing date
- `{{invoiceLink}}` - Link to invoice

### Password Reset Variables

- `{{resetLink}}` - Password reset URL with token
- `{{expiryTime}}` - Link expiry (e.g., "24 hours")
- `{{requestIp}}` - IP that requested reset
- `{{requestLocation}}` - Approximate location

### Security Variables

- `{{eventType}}` - Type of security event
- `{{eventTime}}` - When event occurred
- `{{ipAddress}}` - IP address involved
- `{{location}}` - Location of event
- `{{deviceInfo}}` - Device/browser info
- `{{securityLink}}` - Link to security settings

### Feature Variables

- `{{featureName}}` - Name of new feature
- `{{featureDescription}}` - Feature description
- `{{launchDate}}` - Feature launch date
- `{{featureLink}}` - Link to feature docs

---

## 🎯 Complete Template List for SQL

Here are all 15 template slugs you'll have after running the migrations:

1. `welcome-all-users`
2. `welcome-sandbox-user`
3. `password-reset`
4. `email-verification`
5. `subscription-confirmed`
6. `payment-failed`
7. `subscription-cancelled`
8. `trial-ending-soon`
9. `security-alert`
10. `account-locked`
11. `email-changed`
12. `support-ticket-response`
13. `feature-announcement`
14. `weekly-digest`
15. `upgrade-prompt`

---

## 📝 Notes

- All templates are set to `status = 'active'` and ready to use
- Templates use proper HTML table layouts for email client compatibility
- Each template has both HTML and plain text versions
- Variables are automatically replaced by the `notification-service.ts`
- All templates follow email best practices (inline CSS, no external resources)

---

_Context improved by Giga AI - Used email template system, variable definitions, and notification service for comprehensive email template library._
