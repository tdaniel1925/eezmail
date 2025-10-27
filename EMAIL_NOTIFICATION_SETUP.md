# Email Notification Setup - Quick Start Guide

## 🚀 What You Just Got

A complete email notification system for sandbox companies with:

✅ **4 Professional Email Templates** (HTML + Plain Text)

- User Welcome Email
- Admin Company Created Email
- Admin User Assigned Email
- User Removed Email

✅ **Automated Triggers**

- Notifications sent automatically on user/company events
- Non-blocking, doesn't slow down your API

✅ **Admin UI**

- Preview templates at `/admin/email-templates`
- Copy HTML/text for customization
- See all available variables

✅ **Database Support**

- Notification settings per user
- Category-based controls
- Migration file ready to run

## ⚡ Quick Setup (3 Steps)

### Step 1: Run Database Migration

```bash
# Option A: Using Supabase CLI
supabase db push migrations/add_notification_settings.sql

# Option B: Using Drizzle
npm run db:push

# Option C: Manually in Supabase Dashboard
# Go to SQL Editor → Paste contents of migrations/add_notification_settings.sql → Run
```

### Step 2: Configure Email Sending

**Choose ONE method:**

#### Method A: SMTP (Easiest for Testing)

1. **Add to `.env.local`:**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password  # Use Gmail App Password, not regular password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **Install Nodemailer:**

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

3. **Update `src/lib/notifications/sandbox-notifications.ts`:**

Replace the `sendEmailViaService` function with:

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
      from: params.from || 'EaseMail <noreply@easemail.ai>',
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`✅ Email sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('❌ SMTP Error:', error);
    return false;
  }
}
```

#### Method B: SendGrid (Recommended for Production)

1. **Get API Key:**
   - Sign up at https://sendgrid.com
   - Create API key with "Mail Send" permission

2. **Add to `.env.local`:**

```bash
SENDGRID_API_KEY=your_sendgrid_key_here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

3. **Update `src/lib/notifications/sandbox-notifications.ts`:**

```typescript
async function sendEmailViaService(params: EmailParams): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: params.from || 'noreply@easemail.ai', name: 'EaseMail' },
        subject: params.subject,
        content: [
          { type: 'text/plain', value: params.text },
          { type: 'text/html', value: params.html },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.statusText}`);
    }

    console.log(`✅ Email sent via SendGrid to ${params.to}`);
    return true;
  } catch (error) {
    console.error('❌ SendGrid Error:', error);
    return false;
  }
}
```

### Step 3: Test It!

1. **Start your dev server:**

```bash
npm run dev
```

2. **Go to Admin Panel:**

```
http://localhost:3000/admin/email-templates
```

3. **Preview templates:**
   - Click "Preview" on any template
   - See the beautiful HTML rendering
   - Check available variables

4. **Test sending:**

```bash
# Create a sandbox company
POST http://localhost:3000/api/admin/sandbox-companies
Body: {
  "name": "Test Company",
  "description": "Testing notifications"
}
# → Admin receives "Company Created" email

# Assign a user
POST http://localhost:3000/api/admin/sandbox-companies/[company-id]/users
Body: {
  "userId": "[user-id]"
}
# → User receives "Welcome" email
# → Admin receives "User Assigned" email
```

5. **Check console logs:**

```
📧 [Sandbox] Sending welcome notification to user abc-123
✅ Email sent to john@example.com
```

## 📧 Email Templates Preview

All templates are located in:

```
src/lib/notifications/sandbox-email-templates.ts
```

### User Welcome Email

**Subject:** "Welcome to [Company Name] - Your EaseMail Sandbox Access"

**Features:**

- Beautiful gradient header (purple/blue)
- Welcome message personalized with user's name
- Feature highlights (unlimited storage, SMS, AI, etc.)
- 4-step quick start guide with colored steps
- Call-to-action button to dashboard
- Help resources section
- Responsive design

**Variables Used:**

- `{{userName}}` - User's name
- `{{companyName}}` - Sandbox company name
- `{{loginUrl}}` - Dashboard URL
- `{{supportUrl}}` - Support link

### Admin Company Created Email

**Subject:** "[EaseMail Admin] New Sandbox Company Created: [Company Name]"

**Features:**

- Professional dark header
- Company details table
- Configuration status (Twilio, OpenAI)
- Next steps callout
- Link to company management

### Admin User Assigned Email

**Subject:** "[EaseMail Admin] User Assigned to [Company Name]"

**Features:**

- Green success header
- User information table
- Assignment confirmation
- Link to company dashboard

### User Removed Email

**Subject:** "Your Access to [Company Name] Sandbox Has Been Removed"

**Features:**

- Orange warning header
- Clear explanation of access removal
- Support contact information
- Professional and respectful tone

## 🎨 Customizing Templates

### Quick Edits

1. **Change colors:**

```typescript
// In sandbox-email-templates.ts
// Find: background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
// Replace with your brand colors
```

2. **Change from email:**

```typescript
// In sandbox-notifications.ts
from: 'Your Brand <noreply@yourdomain.com>';
```

3. **Add/remove sections:**
   - Edit the HTML template string
   - Keep plain text version in sync

### Full Documentation

See `EMAIL_NOTIFICATION_SYSTEM.md` for:

- Complete customization guide
- API reference
- Troubleshooting
- Best practices

## 🔍 Debugging

### Check if emails are being triggered:

```bash
# Watch console output
📧 [Sandbox Notification] Sending email: { to: '...', subject: '...' }
✅ Email sent to user@example.com
```

### Common Issues:

1. **"No email sent"**
   - Check `sendEmailViaService` is implemented
   - Currently uses `console.log` - replace with actual service
   - Verify environment variables

2. **"Template variables not replaced"**
   - Check variable names match exactly
   - Case-sensitive: `{{userName}}` not `{{username}}`

3. **"Email looks broken"**
   - Test in different email clients
   - Check HTML validity
   - Ensure plain text fallback exists

## 📚 Next Steps

### For Developers:

1. **Customize templates** for your brand
2. **Implement email service** (SMTP, SendGrid, etc.)
3. **Test notifications** in sandbox
4. **Add more notification types** (billing, security, etc.)
5. **Build user notification settings UI**

### For Admins:

1. **Access admin panel:** `/admin/email-templates`
2. **Preview all templates**
3. **Test with sandbox companies**
4. **Monitor delivery in logs**

## 🎯 What Works Right Now

✅ Email templates are ready  
✅ Notification triggers are integrated  
✅ Admin UI is built  
✅ Database schema is ready  
✅ Non-blocking execution  
✅ Error handling  
✅ Logging system

## ⚠️ What You Need to Do

❗ **Configure email sending service** (SMTP, SendGrid, etc.)  
❗ **Run database migration**  
❗ **Test in your environment**  
❗ **Customize templates for your brand** (optional)

## 📖 Full Documentation

- **Complete Guide:** `EMAIL_NOTIFICATION_SYSTEM.md`
- **Template Code:** `src/lib/notifications/sandbox-email-templates.ts`
- **Notification Service:** `src/lib/notifications/sandbox-notifications.ts`
- **Admin UI:** `src/components/admin/EmailTemplateManager.tsx`
- **Database Schema:** `src/db/schema.ts` (line 293-324)
- **Migration:** `migrations/add_notification_settings.sql`

---

**Need Help?**

- Check full documentation: `EMAIL_NOTIFICATION_SYSTEM.md`
- Review console logs for errors
- Test in `/admin/email-templates` page

**Questions?**

Contact: support@easemail.ai
