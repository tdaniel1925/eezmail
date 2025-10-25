# Sandbox Companies & Admin System

## 📋 Overview

A comprehensive admin system for creating and managing sandbox companies with unlimited access to Twilio SMS and OpenAI services. This allows you to create demo/test environments for users without worrying about quotas or billing.

## 🎯 Key Features

### For Administrators
- ✅ **Create sandbox companies** with custom credentials
- ✅ **Manage sandbox users** with unlimited access
- ✅ **Track usage** (for monitoring, not limiting)
- ✅ **Full audit trail** of all admin actions
- ✅ **Suspend/activate** companies as needed

### For Sandbox Users
- ✅ **Unlimited SMS** (using company Twilio credentials)
- ✅ **Unlimited AI** (using company OpenAI credentials)
- ✅ **No rate limits** or quotas
- ✅ **Full app access** with enterprise tier features

## 🗄️ Database Schema

### New Tables

#### `sandbox_companies`
Stores sandbox company information and shared credentials:
- `id` - UUID primary key
- `name` - Company name
- `status` - active | suspended | archived
- `twilio_account_sid`, `twilio_auth_token`, `twilio_phone_number`
- `openai_api_key`, `openai_organization_id`
- `unlimited_sms`, `unlimited_ai`, `unlimited_storage` (boolean flags)
- Usage tracking fields (for monitoring)

#### `admin_audit_log`
Complete audit trail of all admin actions:
- `admin_id` - Who performed the action
- `action` - What was done
- `target_type` - What was affected
- `details` - Before/after state
- `ip_address`, `user_agent` - Request metadata

### Modified Tables

#### `users`
Added new fields:
- `role` - user | sandbox_user | admin | super_admin
- `sandbox_company_id` - Links sandbox users to their company

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
# Apply the migration
psql $DATABASE_URL < migrations/007_sandbox_companies_and_admin.sql
```

### 2. Create Your First Admin

```sql
-- Update an existing user to admin
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'your-email@example.com';
```

### 3. Access Admin Dashboard

Navigate to: `https://your-domain.com/admin`

## 📚 API Reference

### Sandbox Companies

#### `GET /api/admin/sandbox-companies`
List all sandbox companies
- Query params: `search`, `status`, `limit`, `offset`
- Requires: Admin role

#### `POST /api/admin/sandbox-companies`
Create new sandbox company
```typescript
{
  name: string;
  description?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  openaiApiKey?: string;
  openaiOrganizationId?: string;
  contactEmail?: string;
  contactName?: string;
  notes?: string;
}
```

#### `GET /api/admin/sandbox-companies/[id]`
Get company details including users

#### `PUT /api/admin/sandbox-companies/[id]`
Update company settings

#### `DELETE /api/admin/sandbox-companies/[id]`
Delete company (only if no users attached)

### Sandbox Users

#### `POST /api/admin/sandbox-companies/[id]/users`
Create sandbox user for a company
```typescript
{
  email: string;
  fullName: string;
  password: string;
}
```

#### `GET /api/admin/sandbox-companies/[id]/users`
List all users in a company

## 🔐 Authentication & Authorization

### Role Hierarchy
1. **super_admin** - Full system access
2. **admin** - Manage sandbox companies and users
3. **sandbox_user** - Unlimited access, no billing
4. **user** - Regular user with quotas

### Middleware

```typescript
import { requireAdmin, requireSuperAdmin } from '@/lib/auth/admin-auth';

// Require admin access
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(); // Throws if not admin
  // ... your logic
}

// Require super admin access
export async function DELETE(req: NextRequest) {
  const superAdmin = await requireSuperAdmin(); // Throws if not super admin
  // ... your logic
}
```

### Audit Logging

```typescript
import { logAdminAction } from '@/lib/auth/admin-auth';

await logAdminAction({
  adminId: admin.id,
  action: 'create_sandbox_company',
  targetType: 'sandbox_company',
  targetId: company.id,
  details: { after: { name: company.name } },
  ipAddress: getClientIp(req),
  userAgent: getUserAgent(req),
});
```

## 🎨 UI Components

### Admin Dashboard
- **Location**: `/admin`
- **Component**: `<AdminDashboard />`
- **Features**: 
  - Company list with search/filter
  - Usage statistics
  - Quick actions (create, edit, delete)

### Create Company Modal
- **Component**: `<CreateSandboxCompanyModal />`
- **Features**:
  - Complete company setup form
  - Twilio & OpenAI credential entry
  - Contact information
  - Internal notes

### Company Card
- **Component**: `<SandboxCompanyCard />`
- **Features**:
  - Status badge
  - Usage metrics
  - Quick actions menu
  - View details link

## 🔧 Service Integration

### Twilio SMS
Priority order for credentials:
1. **Sandbox** (if user is sandbox_user)
2. **Custom** (if user has custom Twilio)
3. **System** (fallback to env vars)

```typescript
import { getTwilioCredentials } from '@/lib/sandbox/credentials';

const creds = await getTwilioCredentials(userId);
if (creds?.isSandbox) {
  // Using sandbox Twilio
}
```

### OpenAI
Same priority system as Twilio:

```typescript
import { getOpenAICredentials } from '@/lib/sandbox/credentials';

const creds = await getOpenAICredentials(userId);
if (creds?.isSandbox) {
  // Using sandbox OpenAI
}
```

### Quota Bypass

```typescript
import { shouldBypassQuota } from '@/lib/sandbox/credentials';

const bypassSMS = await shouldBypassQuota(userId, 'sms');
if (bypassSMS) {
  // Skip rate limit check
}
```

### Usage Tracking

```typescript
import { trackSandboxUsage } from '@/lib/sandbox/credentials';

// Track SMS usage (non-blocking)
await trackSandboxUsage(userId, 'sms', 1);

// Track AI token usage
await trackSandboxUsage(userId, 'ai', tokens);
```

## 📊 Usage Monitoring

### Company Dashboard
View real-time usage for each sandbox company:
- Total SMS sent
- Total AI tokens used
- Total storage used
- Per-user breakdown

### Audit Trail
All admin actions are logged with:
- Timestamp
- Admin user
- Action type
- Before/after state
- IP address and user agent

## 🔒 Security Considerations

### Credential Storage
- Twilio and OpenAI credentials are stored **unencrypted** in sandbox_companies table
- Only admins can access these credentials
- Consider encrypting at rest in production

### Access Control
- All admin routes protected by middleware
- Role-based authorization enforced
- Audit log tracks all admin actions

### Rate Limiting
- Sandbox users bypass rate limits
- Usage is still tracked for monitoring
- Can be suspended if abused

## 🎯 Best Practices

### Creating Sandbox Companies
1. Use descriptive names (e.g., "Demo - Client XYZ")
2. Add contact information for tracking
3. Include expiration notes if temporary
4. Tag companies for easy filtering

### Managing Sandbox Users
1. Use company-specific email domains
2. Set strong initial passwords
3. Monitor usage regularly
4. Suspend inactive companies

### Monitoring
1. Check usage weekly
2. Review audit logs monthly
3. Clean up archived companies quarterly
4. Alert on suspicious usage patterns

## 🚨 Troubleshooting

### "Unauthorized" Error
- Check user role in database
- Verify user is logged in
- Check middleware is applied

### Sandbox Credentials Not Working
- Verify company status is 'active'
- Check credentials are set in company
- Test credentials directly with Twilio/OpenAI

### Usage Not Tracking
- Check `trackSandboxUsage` is called
- Verify user has `sandbox_company_id`
- Check company exists and is active

## 📈 Future Enhancements

### Planned Features
- [ ] Credential encryption at rest
- [ ] Usage alerts and limits (soft limits)
- [ ] Automatic company expiration
- [ ] Bulk user import
- [ ] Company cloning
- [ ] Custom branding per company
- [ ] API key management for companies

### Integration Ideas
- [ ] Stripe Connect for company billing
- [ ] SSO for sandbox users
- [ ] White-label admin dashboard
- [ ] Webhook notifications for usage thresholds

## 📝 Example Workflows

### Creating a Demo Environment

```bash
# 1. Create sandbox company (via UI or API)
POST /api/admin/sandbox-companies
{
  "name": "Demo - Acme Corp",
  "twilioAccountSid": "ACxxx",
  "twilioAuthToken": "xxx",
  "twilioPhoneNumber": "+1234567890",
  "openaiApiKey": "sk-xxx"
}

# 2. Create demo users
POST /api/admin/sandbox-companies/[companyId]/users
{
  "email": "demo1@acme.com",
  "fullName": "Demo User 1",
  "password": "SecurePass123!"
}

# 3. Users can now login and use services without limits
```

### Monitoring Usage

```typescript
// Get company details with usage
const response = await fetch(`/api/admin/sandbox-companies/${companyId}`);
const { company, users } = await response.json();

console.log(`Company: ${company.name}`);
console.log(`Total SMS: ${company.totalSmsUsed}`);
console.log(`Total AI Tokens: ${company.totalAiTokensUsed}`);
console.log(`Active Users: ${users.length}`);
```

### Suspending Abuse

```typescript
// Suspend a company
await fetch(`/api/admin/sandbox-companies/${companyId}`, {
  method: 'PUT',
  body: JSON.stringify({ status: 'suspended' })
});

// All users in company immediately lose access
```

---

## 🎉 You're All Set!

Your sandbox company system is now ready to use. Start by:
1. Creating your first sandbox company
2. Adding test users
3. Monitoring their usage
4. Reviewing audit logs

For support or questions, check the code comments or create an issue.

