# SMS Billing & Multi-User Implementation Plan

**Based on Requirements:**
1. ✅ B2B SaaS + Individual users (only businesses get teams)
2. ✅ Pure pay-per-use billing
3. ✅ Both companies and individuals pay
4. ✅ Personal contacts (user-owned)
5. ✅ Company admins see all SMS
6. ✅ We provide/resell Twilio service

---

## Architecture Overview

### Account Types

```
┌─────────────────────────────────────┐
│  INDIVIDUAL ACCOUNT                 │
│  - Single user                      │
│  - Personal contacts                │
│  - Pay for own SMS                  │
│  - No team features                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  BUSINESS ACCOUNT                   │
│  ├── Owner (pays bill)              │
│  ├── Admin (can see all SMS)        │
│  ├── Manager (team-level access)    │
│  └── Member (basic access)          │
│                                      │
│  - Company pays for all users       │
│  - Personal contacts per user       │
│  - Admins see all communications    │
│  - Team collaboration features      │
└─────────────────────────────────────┘
```

---

## Database Schema

### 1. Account Types & Organizations

```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'individual';
  -- 'individual' or 'business'

ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
  -- NULL for individual accounts

-- New: Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  account_type VARCHAR(20) DEFAULT 'business',
  
  -- Billing
  stripe_customer_id VARCHAR(255),
  square_customer_id VARCHAR(255),
  payment_processor VARCHAR(20), -- 'stripe' or 'square'
  billing_email VARCHAR(255),
  
  -- SMS Tracking
  sms_balance DECIMAL(10, 2) DEFAULT 0.00, -- Prepaid balance
  sms_rate DECIMAL(6, 4) DEFAULT 0.0100, -- $0.01 per SMS
  total_sms_sent INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Settings
  auto_recharge_enabled BOOLEAN DEFAULT false,
  auto_recharge_threshold DECIMAL(10, 2) DEFAULT 10.00,
  auto_recharge_amount DECIMAL(10, 2) DEFAULT 50.00,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- New: Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'owner', 'admin', 'manager', 'member'
  
  -- Permissions
  can_view_all_sms BOOLEAN DEFAULT false,
  can_manage_members BOOLEAN DEFAULT false,
  can_manage_billing BOOLEAN DEFAULT false,
  can_send_sms BOOLEAN DEFAULT true,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'inactive'
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  invited_by UUID REFERENCES users(id),
  
  UNIQUE(organization_id, user_id)
);

-- Enhanced: communication_logs (add org tracking)
ALTER TABLE communication_logs ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE communication_logs ADD COLUMN billed_to VARCHAR(20); -- 'user' or 'organization'
ALTER TABLE communication_logs ADD COLUMN cost DECIMAL(6, 4); -- Actual cost charged
ALTER TABLE communication_logs ADD COLUMN billing_status VARCHAR(20) DEFAULT 'pending';
  -- 'pending', 'billed', 'failed', 'refunded'

-- New: SMS Transactions (for billing records)
CREATE TABLE sms_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Transaction details
  transaction_type VARCHAR(20) NOT NULL, -- 'sms_sent', 'recharge', 'refund', 'adjustment'
  amount DECIMAL(10, 2) NOT NULL, -- Negative for charges, positive for credits
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  
  -- SMS details (if transaction_type = 'sms_sent')
  communication_log_id UUID REFERENCES communication_logs(id),
  message_sid VARCHAR(255),
  phone_number VARCHAR(50),
  
  -- Payment details (if transaction_type = 'recharge')
  payment_intent_id VARCHAR(255),
  payment_method VARCHAR(50),
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- New: Invitations
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_comm_logs_org ON communication_logs(organization_id);
CREATE INDEX idx_sms_trans_org ON sms_transactions(organization_id);
CREATE INDEX idx_sms_trans_user ON sms_transactions(user_id);
```

---

## User Roles & Permissions

### Role Hierarchy

| Role | View All SMS | Manage Members | Manage Billing | Send SMS | Edit Own Profile |
|------|--------------|----------------|----------------|----------|------------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Manager** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Member** | ❌ (own only) | ❌ | ❌ | ✅ | ✅ |

### Permission Checking Middleware

```typescript
// src/lib/permissions/check-permissions.ts
export async function checkPermission(
  userId: string,
  permission: 'view_all_sms' | 'manage_members' | 'manage_billing' | 'send_sms'
): Promise<boolean> {
  // Check if user is in an organization
  const member = await db.query.organizationMembers.findFirst({
    where: eq(organizationMembers.userId, userId),
  });

  if (!member) {
    // Individual account - has all permissions for themselves
    return true;
  }

  // Business account - check role-based permissions
  switch (permission) {
    case 'view_all_sms':
      return member.canViewAllSms || ['owner', 'admin', 'manager'].includes(member.role);
    case 'manage_members':
      return member.canManageMembers || ['owner', 'admin'].includes(member.role);
    case 'manage_billing':
      return member.canManageBilling || member.role === 'owner';
    case 'send_sms':
      return member.canSendSms;
    default:
      return false;
  }
}
```

---

## Billing Flow

### SMS Cost Tracking

```typescript
// When SMS is sent:
1. Check user's account type (individual vs business)
2. If business → charge organization
3. If individual → charge user directly
4. Record transaction in sms_transactions
5. Update balance
6. If balance < threshold → trigger low balance alert
7. If auto_recharge enabled → trigger recharge
```

### Billing Logic

```typescript
// src/lib/billing/sms-billing.ts

export async function chargeSMS(
  userId: string,
  messageSid: string,
  phoneNumber: string,
  cost: number = 0.01
): Promise<{success: boolean; error?: string}> {
  
  // Get user and organization
  const user = await getUserWithOrganization(userId);
  
  if (user.organizationId) {
    // Business account - charge organization
    return await chargeOrganization(user.organizationId, userId, messageSid, phoneNumber, cost);
  } else {
    // Individual account - charge user directly
    return await chargeUser(userId, messageSid, phoneNumber, cost);
  }
}

async function chargeOrganization(
  orgId: string,
  userId: string,
  messageSid: string,
  phoneNumber: string,
  cost: number
) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  });

  if (!org) {
    return { success: false, error: 'Organization not found' };
  }

  // Check balance
  if (org.smsBalance < cost) {
    // Insufficient balance
    if (org.autoRechargeEnabled) {
      // Auto-recharge
      await rechargeOrganization(orgId, org.autoRechargeAmount);
    } else {
      return { success: false, error: 'Insufficient SMS balance' };
    }
  }

  // Deduct from balance
  const newBalance = org.smsBalance - cost;
  
  await db.transaction(async (tx) => {
    // Update organization balance
    await tx.update(organizations)
      .set({
        smsBalance: newBalance,
        totalSmsSent: org.totalSmsSent + 1,
        totalCost: org.totalCost + cost,
      })
      .where(eq(organizations.id, orgId));

    // Record transaction
    await tx.insert(smsTransactions).values({
      organizationId: orgId,
      userId,
      transactionType: 'sms_sent',
      amount: -cost,
      balanceBefore: org.smsBalance,
      balanceAfter: newBalance,
      messageSid,
      phoneNumber,
      description: `SMS sent to ${phoneNumber}`,
    });
  });

  // Check if low balance
  if (newBalance < org.autoRechargeThreshold) {
    await sendLowBalanceAlert(orgId);
  }

  return { success: true };
}
```

---

## API Endpoints to Build

### Organization Management

```typescript
// POST /api/organizations/create
// Create a new business organization
{
  name: string;
  billingEmail: string;
  paymentProcessor: 'stripe' | 'square';
}

// POST /api/organizations/[orgId]/members/invite
// Invite user to organization
{
  email: string;
  role: 'admin' | 'manager' | 'member';
}

// GET /api/organizations/[orgId]/members
// List all organization members

// PUT /api/organizations/[orgId]/members/[userId]
// Update member role/permissions

// DELETE /api/organizations/[orgId]/members/[userId]
// Remove member from organization
```

### Billing

```typescript
// POST /api/billing/recharge
// Add credits to account
{
  amount: number; // $50.00
  paymentMethod: string;
}

// GET /api/billing/balance
// Get current SMS balance

// GET /api/billing/transactions
// Get transaction history

// GET /api/billing/usage
// Get SMS usage stats
{
  period: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

// PUT /api/billing/auto-recharge
// Configure auto-recharge
{
  enabled: boolean;
  threshold: number;
  amount: number;
}
```

### Admin Views

```typescript
// GET /api/admin/sms-logs
// View all SMS for organization (admin only)
{
  organizationId: string;
  userId?: string; // Filter by specific user
  startDate?: string;
  endDate?: string;
}

// GET /api/admin/usage-report
// Organization-wide usage report
{
  groupBy: 'user' | 'date' | 'status';
}
```

---

## UI Components to Build

### 1. Account Type Selection (Onboarding)
- Radio buttons: "Individual Account" vs "Business Account"
- For business: Collect company name, billing email

### 2. Organization Settings Page
- Company info
- Member management
- Billing settings
- SMS balance display
- Auto-recharge configuration

### 3. Invite Members Modal
- Email input
- Role selection dropdown
- Send invitation button

### 4. SMS Balance Widget (Header)
```
💰 SMS Balance: $23.45
[Recharge] [Auto-Recharge: ON]
```

### 5. Usage Dashboard
- Graph: SMS sent over time
- Table: Per-user usage (for admins)
- Cost breakdown
- Delivery success rate

### 6. Admin SMS Log Viewer
- Filter by user
- Filter by date range
- Filter by status (delivered/failed)
- Export to CSV

---

## Migration Plan

### Phase 1: Schema Changes (Week 1)
- [ ] Create new tables
- [ ] Add columns to existing tables
- [ ] Create indexes
- [ ] Migrate existing users to individual accounts

### Phase 2: Billing Core (Week 1-2)
- [ ] SMS cost tracking
- [ ] Balance management
- [ ] Transaction recording
- [ ] Recharge system (Stripe/Square)

### Phase 3: Organizations (Week 2-3)
- [ ] Organization creation
- [ ] Member invitation system
- [ ] Role-based permissions
- [ ] Permission middleware

### Phase 4: Admin Features (Week 3-4)
- [ ] Admin SMS log viewer
- [ ] Usage reports
- [ ] Member management UI
- [ ] Billing dashboard

### Phase 5: Auto-Recharge (Week 4)
- [ ] Auto-recharge logic
- [ ] Low balance alerts
- [ ] Email notifications

---

## Pricing Strategy

### Individual Accounts
- $0.01 per SMS
- Minimum recharge: $10.00
- No subscription fee

### Business Accounts
- $0.01 per SMS (same rate)
- Minimum recharge: $50.00
- Optional: $29/mo base fee (unlimited users) + SMS charges
- Volume discounts:
  - 1,000-5,000 SMS: $0.009/SMS
  - 5,000-10,000 SMS: $0.008/SMS
  - 10,000+ SMS: Contact for enterprise pricing

---

## Next Steps

1. **Review and Approve** this plan
2. **Set pricing** (confirm $0.01/SMS rate)
3. **Start Phase 1** (database migration)
4. **Build billing foundation**
5. **Test with pilot customers**

**Ready to start implementation?** Let me know if you want me to begin with Phase 1!

