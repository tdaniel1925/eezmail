# Platform Admin & Pricing Control - UPDATED

## Multi-Tenant SaaS Architecture

You are building a **platform** that resells email + SMS services to customers.

### Three Levels of Users:

```
┌─────────────────────────────────────────┐
│  PLATFORM ADMINS (You/Your Team)        │
│  - Set global SMS pricing               │
│  - Override pricing per customer        │
│  - Configure trial credits              │
│  - Manage all organizations             │
│  - View platform-wide analytics         │
└─────────────────────────────────────────┘
           ↓ manages
┌─────────────────────────────────────────┐
│  CUSTOMERS (Organizations/Individuals)  │
│  - Pay for SMS usage                    │
│  - Can have trial credits               │
│  - Subscribe to monthly plans           │
└─────────────────────────────────────────┘
           ↓ has users
┌─────────────────────────────────────────┐
│  END USERS (Organization Members)       │
│  - Send SMS                             │
│  - Manage contacts                      │
└─────────────────────────────────────────┘
```

---

## Updated Database Schema

### Platform Administration

```sql
-- Platform Admins
CREATE TABLE platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin', -- 'super_admin', 'admin', 'support'
  permissions JSONB DEFAULT '{"view_all": true, "manage_pricing": true, "manage_organizations": true}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Global Platform Settings
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example settings:
-- key: 'sms_pricing_default'
-- value: {"rate": 0.01, "currency": "USD"}

-- key: 'trial_credits_default'
-- value: {"amount": 5.00, "duration_days": 30}

-- key: 'subscription_plans'
-- value: [
--   {"id": "basic", "name": "Basic", "price": 29, "sms_included": 1000},
--   {"id": "pro", "name": "Pro", "price": 99, "sms_included": 5000}
-- ]

-- Pricing Overrides (per organization or user)
CREATE TABLE pricing_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target (either organization OR user)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Pricing
  sms_rate DECIMAL(6, 4) NOT NULL, -- Custom rate (e.g., 0.008 for volume discount)
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP, -- NULL = indefinite
  
  -- Metadata
  reason TEXT, -- "Volume discount customer", "Partner rate", etc.
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: Must target either org OR user, not both
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Trial Credits
CREATE TABLE trial_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Trial details
  credit_amount DECIMAL(10, 2) NOT NULL, -- $5.00 free
  duration_days INTEGER NOT NULL, -- 30 days
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'used', 'revoked'
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  remaining_balance DECIMAL(10, 2),
  
  -- Metadata
  granted_by UUID REFERENCES users(id), -- Which admin granted it
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Subscription Plans (Managed by Platform)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL, -- 'individual', 'business'
  
  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL,
  sms_included INTEGER DEFAULT 0, -- Free SMS per month
  overage_rate DECIMAL(6, 4), -- Rate after included SMS used
  
  -- Features
  features JSONB DEFAULT '[]', -- ["priority_support", "advanced_analytics"]
  max_users INTEGER, -- NULL = unlimited (for business plans)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- Show on pricing page
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer Subscriptions
CREATE TABLE customer_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Subscription
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
  
  -- Billing
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  -- SMS Tracking (for plan with included SMS)
  sms_used_current_period INTEGER DEFAULT 0,
  sms_included_in_plan INTEGER DEFAULT 0,
  
  -- Payment
  stripe_subscription_id VARCHAR(255),
  square_subscription_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CHECK (
    (organization_id IS NOT NULL AND user_id IS NULL) OR
    (organization_id IS NULL AND user_id IS NOT NULL)
  )
);

-- Enhanced Organizations table
ALTER TABLE organizations ADD COLUMN pricing_tier VARCHAR(50) DEFAULT 'standard';
  -- 'standard', 'volume', 'enterprise', 'partner'

ALTER TABLE organizations ADD COLUMN trial_credits_used DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE organizations ADD COLUMN is_trial BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN trial_expires_at TIMESTAMP;

-- Enhanced Users table (for individual accounts)
ALTER TABLE users ADD COLUMN pricing_tier VARCHAR(50) DEFAULT 'standard';
ALTER TABLE users ADD COLUMN trial_credits_used DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN is_trial BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN trial_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN sms_balance DECIMAL(10, 2) DEFAULT 0.00;
  -- Individual users have their own balance
```

---

## Pricing Logic Flow

```typescript
// Get SMS rate for a specific user/org
async function getSMSRate(userId: string): Promise<number> {
  // 1. Check if user is in organization
  const member = await getOrganizationMember(userId);
  const targetId = member ? member.organizationId : userId;
  const targetType = member ? 'organization' : 'user';
  
  // 2. Check for pricing override
  const override = await getPricingOverride(targetId, targetType);
  if (override && isOverrideActive(override)) {
    return override.smsRate;
  }
  
  // 3. Check subscription plan
  const subscription = await getActiveSubscription(targetId, targetType);
  if (subscription && subscription.smsUsedCurrentPeriod < subscription.smsIncludedInPlan) {
    return 0; // Free (included in plan)
  } else if (subscription && subscription.overageRate) {
    return subscription.overageRate;
  }
  
  // 4. Check tier-based pricing
  const tier = member 
    ? await getOrganizationTier(member.organizationId)
    : await getUserTier(userId);
  
  const tierRates = {
    'standard': 0.0100,
    'volume': 0.0085,
    'enterprise': 0.0075,
    'partner': 0.0050,
  };
  
  if (tierRates[tier]) {
    return tierRates[tier];
  }
  
  // 5. Default global rate
  const globalRate = await getPlatformSetting('sms_pricing_default');
  return globalRate?.rate || 0.0100;
}

// Check trial credits before charging
async function chargeSMSWithTrialCheck(
  userId: string,
  cost: number
): Promise<{success: boolean; chargedFrom: string}> {
  
  const member = await getOrganizationMember(userId);
  const targetId = member ? member.organizationId : userId;
  const targetType = member ? 'organization' : 'user';
  
  // Check active trial credits
  const trial = await getActiveTrial(targetId, targetType);
  
  if (trial && trial.remainingBalance >= cost) {
    // Deduct from trial credits
    await deductTrialCredit(trial.id, cost);
    return { success: true, chargedFrom: 'trial' };
  }
  
  // Charge normal balance
  return await chargeBalance(targetId, targetType, cost);
}
```

---

## Platform Admin Dashboard (To Build)

### Pages Needed:

1. **Platform Admin Dashboard** (`/platform-admin`)
   - Total customers (orgs + individuals)
   - Total SMS sent today/week/month
   - Total revenue
   - Active trials
   - System health

2. **Pricing Management** (`/platform-admin/pricing`)
   - Global default rate
   - Tier-based rates
   - Pricing overrides table
   - Create custom pricing for customer

3. **Customer Management** (`/platform-admin/customers`)
   - List all organizations and individuals
   - Search/filter customers
   - View customer details
   - View customer SMS usage
   - Grant trial credits
   - Apply pricing overrides

4. **Subscription Plans** (`/platform-admin/plans`)
   - Create/edit plans
   - Set pricing and features
   - Enable/disable plans
   - View subscribers

5. **Trial Credits Management** (`/platform-admin/trials`)
   - Grant trial credits
   - View active trials
   - Revoke trials
   - Trial expiration alerts

6. **Analytics** (`/platform-admin/analytics`)
   - Revenue by customer
   - SMS volume trends
   - Failed SMS analysis
   - Customer churn

---

## UI Components to Build

### Admin Tools

```typescript
// Grant Trial Credits Modal
<GrantTrialModal
  customerId={org.id || user.id}
  customerType="organization" | "individual"
  defaultAmount={5.00}
  defaultDuration={30}
  onGrant={(amount, days) => grantTrialCredits(id, amount, days)}
/>

// Set Custom Pricing Modal
<SetCustomPricingModal
  customerId={org.id || user.id}
  currentRate={0.0100}
  onSave={(newRate, reason) => applyPricingOverride(id, newRate, reason)}
/>

// Customer Details Panel
<CustomerDetailsPanel
  customer={org || user}
  usage={{
    totalSMS: 1234,
    totalCost: 12.34,
    successRate: 98.5,
  }}
  currentPlan={subscription?.plan}
  trialCredits={trial?.remainingBalance}
/>
```

### Customer-Facing

```typescript
// Pricing Page (Public)
<PricingPlans
  plans={[
    { name: "Individual", price: 0, smsRate: 0.01 },
    { name: "Basic", price: 29, smsIncluded: 1000, overageRate: 0.009 },
    { name: "Pro", price: 99, smsIncluded: 5000, overageRate: 0.008 },
  ]}
/>

// Balance Display (Header)
<BalanceWidget
  balance={23.45}
  trialCredits={5.00}
  trialExpiresIn={15} // days
  subscription={{plan: "Pro", smsRemaining: 487}}
/>
```

---

## API Endpoints to Build

### Platform Admin APIs

```typescript
// POST /api/platform-admin/pricing/override
// Apply custom pricing to customer
{
  targetId: string;
  targetType: 'organization' | 'user';
  rate: number;
  effectiveUntil?: string;
  reason: string;
}

// POST /api/platform-admin/trials/grant
// Grant trial credits
{
  targetId: string;
  targetType: 'organization' | 'user';
  amount: number;
  durationDays: number;
  reason?: string;
}

// GET /api/platform-admin/customers
// List all customers with usage stats

// GET /api/platform-admin/analytics/revenue
// Platform revenue analytics

// PUT /api/platform-admin/settings/global-pricing
// Update global SMS rate
{
  rate: number;
}

// POST /api/platform-admin/plans
// Create subscription plan
{
  name: string;
  planType: 'individual' | 'business';
  monthlyPrice: number;
  smsIncluded: number;
  overageRate: number;
  features: string[];
}
```

---

## Implementation Order (Phase 1 - Starting Now)

### Week 1: Database Foundation ✅ STARTING

**Day 1-2: Schema Migration**
- [ ] Create platform_admins table
- [ ] Create platform_settings table
- [ ] Create pricing_overrides table
- [ ] Create trial_credits table
- [ ] Create subscription_plans table
- [ ] Create customer_subscriptions table
- [ ] Alter organizations table
- [ ] Alter users table (add balance, trial fields)

**Day 3-4: Core Billing Logic**
- [ ] `getSMSRate()` function with all fallbacks
- [ ] `chargeSMSWithTrialCheck()` function
- [ ] Trial credit tracking
- [ ] Balance management utilities

**Day 5: Initial Platform Admin**
- [ ] Seed platform_admins table with your user
- [ ] Create middleware to check platform admin
- [ ] Basic platform admin dashboard route

**Ready to start Day 1?** I'll create the migration files now!

