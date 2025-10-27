# Comprehensive Notification Template System

## 🎯 Overview

A complete notification template system with HTML editor support, image management, variable substitution, and audience-based personalization for sending customized emails to all users (sandbox, individual, team, enterprise, admin).

## ✨ Key Features

### 1. **Template Management**

- ✅ Create, edit, duplicate, and delete email templates
- ✅ Rich HTML content with inline CSS support
- ✅ Plain text fallback for email clients
- ✅ Template preview with variable substitution
- ✅ Send test emails to verify templates
- ✅ Template analytics (open rate, click rate, delivery time)

### 2. **Audience Segmentation**

- ✅ **All Users**: Send to everyone
- ✅ **Sandbox Users**: Sandbox-specific content
- ✅ **Individual Tier**: Individual plan subscribers
- ✅ **Team Tier**: Team plan subscribers
- ✅ **Enterprise Tier**: Enterprise plan subscribers
- ✅ **Admin Only**: Administrative notifications

### 3. **Template Types**

- ✅ **Transactional**: Account actions, password resets, confirmations
- ✅ **Marketing**: Newsletters, product updates, announcements
- ✅ **System**: System notifications, alerts, status updates
- ✅ **Sandbox**: Sandbox-specific onboarding and notifications

### 4. **Personalization**

- ✅ Variable substitution ({{userName}}, {{companyName}}, etc.)
- ✅ Tier-specific personalization rules
- ✅ Dynamic content based on subscription level
- ✅ Sandbox vs. regular user differentiation

### 5. **Image Management**

- ✅ Upload and manage template images
- ✅ Image metadata (alt text, description, tags)
- ✅ Usage tracking per image
- ✅ Search and filter images
- 📝 **TODO**: Cloud storage integration (Cloudflare R2, AWS S3)

### 6. **Email Delivery**

- ✅ Integration with Resend for email delivery
- ✅ Delivery status tracking (pending, sent, delivered, failed, bounced)
- ✅ Open and click tracking
- ✅ Automatic retry for failed emails
- ✅ Scheduled email support
- ✅ Bulk email sending

### 7. **Analytics & Tracking**

- ✅ Template usage statistics
- ✅ Delivery success/failure rates
- ✅ Open rate and click-through rate
- ✅ Average delivery time
- ✅ Notification queue monitoring

---

## 📂 File Structure

```
src/
├── db/
│   └── schema.ts                                    # Updated with template tables
├── lib/
│   └── notifications/
│       ├── notification-service.ts                  # Email sending & queue management
│       └── template-service.ts                      # Template CRUD operations
├── app/
│   └── api/
│       └── admin/
│           └── templates/
│               ├── route.ts                        # GET (list), POST (create)
│               ├── [id]/
│               │   ├── route.ts                    # GET, PUT, DELETE
│               │   ├── duplicate/route.ts          # POST (duplicate)
│               │   ├── preview/route.ts            # POST (preview)
│               │   ├── test/route.ts               # POST (send test)
│               │   └── analytics/route.ts          # GET (analytics)
│               └── images/
│                   └── route.ts                    # GET (list), POST (upload), DELETE
└── migrations/
    └── create_notification_templates.sql            # Database migration
```

---

## 🗄️ Database Schema

### 1. **notification_templates**

Stores email templates with HTML content, personalization rules, and metadata.

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type notification_template_type NOT NULL,
  audience notification_audience NOT NULL,
  status notification_status NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  preheader TEXT,
  variables JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  personalization_rules JSONB DEFAULT '{}',
  from_name VARCHAR(100),
  from_email VARCHAR(255),
  reply_to_email VARCHAR(255),
  category VARCHAR(100),
  tags JSONB DEFAULT '[]',
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **notification_queue**

Tracks email delivery status, scheduling, and analytics.

```sql
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES notification_templates(id),
  recipient_id UUID REFERENCES users(id),
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}',
  status email_delivery_status DEFAULT 'pending',
  delivery_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  external_id VARCHAR(255),
  external_status TEXT,
  error_message TEXT,
  error_code VARCHAR(50),
  scheduled_for TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **template_images**

Manages images used in email templates.

```sql
CREATE TABLE template_images (
  id UUID PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  url TEXT NOT NULL,
  storage_key TEXT,
  alt_text TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]',
  use_count INTEGER DEFAULT 0,
  used_in_templates JSONB DEFAULT '[]',
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 API Endpoints

### Template Management

#### List Templates

```http
GET /api/admin/templates?type=transactional&audience=all&status=active&search=welcome&limit=50&offset=0
```

**Response:**

```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Welcome to EaseMail",
      "slug": "welcome-all-users",
      "type": "transactional",
      "audience": "all",
      "status": "active",
      "subject": "Welcome to EaseMail, {{userName}}!",
      "htmlContent": "...",
      "variables": ["userName", "dashboardLink", "supportEmail"],
      "useCount": 125,
      "lastUsedAt": "2025-10-27T..."
    }
  ],
  "total": 1
}
```

#### Create Template

```http
POST /api/admin/templates
Content-Type: application/json

{
  "name": "Password Reset",
  "description": "Email sent when user requests password reset",
  "slug": "password-reset",
  "type": "transactional",
  "audience": "all",
  "status": "active",
  "subject": "Reset Your Password",
  "htmlContent": "<html>...</html>",
  "textContent": "Reset your password...",
  "variables": ["userName", "resetLink", "expiryTime"],
  "fromName": "EaseMail Security",
  "fromEmail": "security@easemail.ai"
}
```

#### Get Template

```http
GET /api/admin/templates/{id}
```

#### Update Template

```http
PUT /api/admin/templates/{id}
Content-Type: application/json

{
  "subject": "Updated Subject Line",
  "htmlContent": "<html>Updated content...</html>"
}
```

#### Delete Template

```http
DELETE /api/admin/templates/{id}
```

#### Duplicate Template

```http
POST /api/admin/templates/{id}/duplicate
Content-Type: application/json

{
  "newName": "Welcome Email - V2"
}
```

#### Preview Template

```http
POST /api/admin/templates/{id}/preview
Content-Type: application/json

{
  "variables": {
    "userName": "John Doe",
    "dashboardLink": "https://app.easemail.ai/dashboard"
  }
}
```

#### Send Test Email

```http
POST /api/admin/templates/{id}/test
Content-Type: application/json

{
  "testEmail": "admin@easemail.ai",
  "variables": {
    "userName": "Test User",
    "dashboardLink": "https://app.easemail.ai/dashboard"
  }
}
```

#### Get Template Analytics

```http
GET /api/admin/templates/{id}/analytics
```

**Response:**

```json
{
  "template": { ... },
  "stats": {
    "totalSent": 1250,
    "totalDelivered": 1245,
    "totalFailed": 5,
    "totalOpened": 980,
    "totalClicked": 620,
    "avgDeliveryTime": 2.5,
    "openRate": 78.4,
    "clickRate": 49.6
  }
}
```

### Image Management

#### List Images

```http
GET /api/admin/templates/images?search=logo&tags=branding&limit=50&offset=0
```

#### Upload Image

```http
POST /api/admin/templates/images
Content-Type: multipart/form-data

file: (binary)
altText: "EaseMail Logo"
description: "Company logo for email headers"
tags: "branding,logo,header"
```

#### Delete Image

```http
DELETE /api/admin/templates/images/{id}
```

---

## 💻 Usage Examples

### 1. Send Welcome Email to New User

```typescript
import { sendNotification } from '@/lib/notifications/notification-service';

// Send welcome email
const result = await sendNotification({
  templateSlug: 'welcome-all-users',
  recipientId: user.id,
  variables: {
    userName: user.fullName,
    dashboardLink: 'https://app.easemail.ai/dashboard',
    supportEmail: 'support@easemail.ai',
    currentYear: '2025',
  },
});

if (result.success) {
  console.log(`Email queued: ${result.queueId}`);
} else {
  console.error(`Failed to send: ${result.error}`);
}
```

### 2. Send Bulk Notification to All Enterprise Users

```typescript
import { sendBulkNotification } from '@/lib/notifications/notification-service';

// Get all enterprise users
const enterpriseUsers = await db
  .select({ id: users.id })
  .from(users)
  .innerJoin(subscriptions, eq(subscriptions.userId, users.id))
  .where(eq(subscriptions.tier, 'enterprise'));

const recipientIds = enterpriseUsers.map((u) => u.id);

// Send bulk notification
const result = await sendBulkNotification({
  templateSlug: 'enterprise-feature-announcement',
  recipientIds,
  variables: {
    featureName: 'Advanced Analytics Dashboard',
    launchDate: 'November 1, 2025',
  },
});

console.log(`Sent: ${result.sent}, Failed: ${result.failed}`);
```

### 3. Schedule Email for Later

```typescript
import { sendNotification } from '@/lib/notifications/notification-service';

// Schedule email for tomorrow 9 AM
const scheduledFor = new Date();
scheduledFor.setDate(scheduledFor.getDate() + 1);
scheduledFor.setHours(9, 0, 0, 0);

const result = await sendNotification({
  templateSlug: 'weekly-digest',
  recipientId: user.id,
  variables: {
    weekNumber: '43',
    highlightCount: '12',
  },
  scheduledFor,
});
```

### 4. Process Scheduled Notifications (Cron Job)

```typescript
import { processScheduledNotifications } from '@/lib/notifications/notification-service';

// Run this via cron every 5 minutes
const result = await processScheduledNotifications();

console.log(
  `Processed: ${result.processed}, Sent: ${result.sent}, Failed: ${result.failed}`
);
```

---

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# Resend API Key (get from resend.com)
RESEND_API_KEY=re_your_key_here

# App URLs
NEXT_PUBLIC_APP_URL=https://app.easemail.ai
SUPPORT_EMAIL=support@easemail.ai

# Optional: From email configuration
DEFAULT_FROM_EMAIL=noreply@easemail.ai
DEFAULT_FROM_NAME=EaseMail
```

### Resend Setup

1. **Sign up**: https://resend.com
2. **Verify your domain**: Add DNS records to your domain
3. **Get API key**: Dashboard → API Keys → Create API Key
4. **Add to `.env.local`**: `RESEND_API_KEY=re_...`

---

## 📊 Template Variable Reference

### Default Variables (Always Available)

- `{{userName}}` - User's full name or email
- `{{userEmail}}` - User's email address
- `{{currentYear}}` - Current year (e.g., "2025")
- `{{supportEmail}}` - Support email address
- `{{dashboardLink}}` - Link to user dashboard
- `{{loginLink}}` - Link to login page

### Sandbox-Specific Variables

- `{{companyName}}` - Sandbox company name
- `{{sandboxFeatures}}` - List of sandbox features

### Subscription-Specific Variables

- `{{subscriptionTier}}` - individual/team/enterprise
- `{{billingCycle}}` - monthly/annual
- `{{nextBillingDate}}` - Next billing date

---

## 🎨 HTML Template Best Practices

### 1. **Inline CSS**

Email clients don't support external stylesheets. Use inline styles:

```html
<div style="font-family: Arial, sans-serif; color: #333;">
  <h1 style="color: #667eea;">Welcome!</h1>
</div>
```

### 2. **Tables for Layout**

Use tables for reliable cross-client compatibility:

```html
<table width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding: 20px;">Content here</td>
  </tr>
</table>
```

### 3. **Responsive Design**

Use media queries for mobile:

```html
<style>
  @media only screen and (max-width: 600px) {
    .container {
      width: 100% !important;
    }
  }
</style>
```

### 4. **Image Optimization**

- Use absolute URLs for images
- Include width and height attributes
- Add alt text for accessibility
- Keep file sizes small (< 100KB per image)

---

## 📈 Analytics & Monitoring

### View Notification Stats

```typescript
import { getNotificationStats } from '@/lib/notifications/notification-service';

const stats = await getNotificationStats();

console.log(`
  Total Sent: ${stats.totalSent}
  Total Pending: ${stats.totalPending}
  Total Failed: ${stats.totalFailed}
  Total Opened: ${stats.totalOpened}
  Total Clicked: ${stats.totalClicked}
`);
```

### Template Performance

```typescript
import { getTemplateAnalytics } from '@/lib/notifications/template-service';

const analytics = await getTemplateAnalytics(templateId);

console.log(`
  Open Rate: ${analytics.stats.openRate}%
  Click Rate: ${analytics.stats.clickRate}%
  Avg Delivery: ${analytics.stats.avgDeliveryTime}s
`);
```

---

## 🔄 Automated Tasks

### 1. **Process Scheduled Notifications**

Run every 5 minutes via cron or Inngest:

```typescript
import { processScheduledNotifications } from '@/lib/notifications/notification-service';

// Cron: */5 * * * *
await processScheduledNotifications();
```

### 2. **Retry Failed Notifications**

Run every hour to retry failed emails:

```typescript
import { retryFailedNotifications } from '@/lib/notifications/notification-service';

// Cron: 0 * * * *
await retryFailedNotifications(3); // Max 3 attempts
```

---

## 🚧 TODO / Future Enhancements

### 1. **Cloud Storage Integration**

- ✅ Basic image upload structure in place
- 📝 **TODO**: Integrate Cloudflare R2 or AWS S3 for image storage
- 📝 **TODO**: Add image optimization (resize, compress)
- 📝 **TODO**: CDN integration for faster image delivery

### 2. **Admin UI (Next TODO)**

- 📝 **TODO**: Build rich text HTML editor with preview
- 📝 **TODO**: Drag-and-drop image uploader
- 📝 **TODO**: Visual template builder
- 📝 **TODO**: Variable inserter widget
- 📝 **TODO**: Template library with pre-made designs

### 3. **Advanced Features**

- 📝 **TODO**: A/B testing for templates
- 📝 **TODO**: Dynamic content blocks
- 📝 **TODO**: Conditional content based on user properties
- 📝 **TODO**: Email scheduling wizard
- 📝 **TODO**: Unsubscribe management

---

## ✅ What's Completed

1. ✅ Database schema with 3 new tables (templates, queue, images)
2. ✅ Complete notification service with Resend integration
3. ✅ Template CRUD service
4. ✅ All API endpoints for template management
5. ✅ Image upload endpoint structure
6. ✅ Variable substitution system
7. ✅ Audience segmentation
8. ✅ Personalization rules engine
9. ✅ Email queue management
10. ✅ Delivery tracking and analytics
11. ✅ Scheduled email support
12. ✅ Bulk email sending
13. ✅ Test email functionality
14. ✅ Template preview
15. ✅ Template duplication
16. ✅ Retry logic for failed emails

---

## 📚 Next Steps

1. **Run the migration**: Execute `migrations/create_notification_templates.sql` in your Supabase SQL editor
2. **Configure Resend**: Add `RESEND_API_KEY` to your `.env.local`
3. **Test the system**:
   - Create a template via API
   - Send a test email
   - Check delivery status
4. **Build the Admin UI**: Create the visual template editor (next major task)

---

## 💡 Tips

- **Start with transactional emails**: Welcome, password reset, etc.
- **Test thoroughly**: Use the test email feature before going live
- **Monitor analytics**: Check open rates and adjust templates
- **Keep templates simple**: Complex HTML may break in some email clients
- **Use plain text fallback**: Always include a text version

---

_Context improved by Giga AI - Used notification template schema, service implementation, API endpoints, and email delivery system for comprehensive notification management._
