# 🗄️ DATABASE MIGRATIONS - COMPLETE GUIDE

## ⚠️ IMPORTANT: Migration Order

You need to run **2 migration files** in order:

### **Step 1: Core Billing Foundation** ✅
**File:** `migrations/000_complete_billing_foundation.sql`

**What it creates:**
- ✅ `organizations` - Master accounts
- ✅ `organization_members` - Team membership
- ✅ `platform_admins` - Platform administrators
- ✅ `platform_settings` - Global configuration
- ✅ `pricing_overrides` - Custom SMS pricing per customer
- ✅ `ai_pricing_overrides` - Custom AI pricing per customer
- ✅ `trial_credits` - Free SMS trial credits
- ✅ `ai_trial_credits` - Free AI trial credits
- ✅ `subscription_plans` - Monthly subscription plans (5 pre-configured)
- ✅ `customer_subscriptions` - Active subscriptions
- ✅ `communication_logs` - SMS/communication tracking
- ✅ `ai_transactions` - AI usage tracking
- ✅ `customer_balances` VIEW - Unified balance query
- ✅ Enhanced `users` table with billing fields
- ✅ 5 default subscription plans inserted

### **Step 2: Invoices Table** ✅
**File:** `migrations/001_add_invoices_table.sql`

**What it creates:**
- ✅ `invoices` - Payment invoices with PDF storage
- ✅ `square_customer_id` field in users table
- ✅ Additional safety checks

---

## 🚀 **How to Run Migrations**

### **Option A: Supabase Dashboard (Recommended)**

1. Open your Supabase project
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the **entire contents** of `migrations/000_complete_billing_foundation.sql`
5. Paste and click **Run**
6. Wait for success ✅
7. Create another **New Query**
8. Copy the **entire contents** of `migrations/001_add_invoices_table.sql`
9. Paste and click **Run**
10. Done! ✅

### **Option B: psql Command Line**

```bash
# Connect to your database
psql "postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"

# Run migrations in order
\i migrations/000_complete_billing_foundation.sql
\i migrations/001_add_invoices_table.sql
```

### **Option C: Supabase CLI**

```bash
supabase db push --db-url "your-connection-string" --file migrations/000_complete_billing_foundation.sql
supabase db push --db-url "your-connection-string" --file migrations/001_add_invoices_table.sql
```

---

## ✅ **Verification**

After running both migrations, verify with these queries:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should see:
-- - ai_pricing_overrides
-- - ai_transactions
-- - ai_trial_credits
-- - communication_logs
-- - customer_subscriptions
-- - invoices ← NEW
-- - organization_members
-- - organizations
-- - platform_admins
-- - platform_settings
-- - pricing_overrides
-- - subscription_plans
-- - trial_credits
-- - users (enhanced)

-- Check subscription plans were inserted
SELECT name, monthly_price, sms_included, ai_tokens_included 
FROM subscription_plans;

-- Should see 5 plans:
-- - Pay As You Go ($0)
-- - Basic ($29)
-- - Pro ($99)
-- - Business Starter ($99)
-- - Business Pro ($299)

-- Check platform settings
SELECT key, value FROM platform_settings;

-- Should see:
-- - sms_pricing_default
-- - ai_pricing_default
-- - trial_credits_default

-- Test the customer_balances view
SELECT * FROM customer_balances LIMIT 1;
```

---

## 📋 **Complete Table List**

After migrations, you'll have **13 tables + 1 view**:

### **Core Multi-Tenant:**
1. `organizations` - Master accounts (law firms, companies)
2. `organization_members` - Links users to organizations
3. `users` - Enhanced with billing fields

### **Platform Admin:**
4. `platform_admins` - Your admin team
5. `platform_settings` - Global configuration

### **SMS Billing:**
6. `pricing_overrides` - Custom SMS rates
7. `trial_credits` - Free SMS credits
8. `communication_logs` - SMS tracking

### **AI Billing:**
9. `ai_pricing_overrides` - Custom AI rates
10. `ai_trial_credits` - Free AI credits
11. `ai_transactions` - AI usage logs

### **Subscriptions:**
12. `subscription_plans` - Monthly plans
13. `customer_subscriptions` - Active subscriptions

### **Invoices:**
14. `invoices` - Payment invoices with PDF

### **Views:**
15. `customer_balances` - Unified balance query

---

## 🔑 **Key Indexes Created**

All tables have optimized indexes for:
- User lookups (`user_id`)
- Organization lookups (`organization_id`)
- Date-based queries (`created_at`, `timestamp`)
- Status filtering (`status`)
- Unique constraints (email, slug, invoice_number)

---

## 🛡️ **Safety Features**

- ✅ `IF NOT EXISTS` checks - Safe to re-run
- ✅ `DO $$` blocks - Idempotent column additions
- ✅ `ON CONFLICT DO NOTHING` - Safe inserts
- ✅ Foreign key constraints - Data integrity
- ✅ Cascade deletes - Cleanup orphaned records
- ✅ Default values - Prevent nulls
- ✅ JSONB validation - Structured metadata

---

## 🎯 **Next Steps After Migration**

### **1. Make Yourself Platform Admin:**
```sql
-- Get your user ID
SELECT id, email FROM users WHERE email = 'your@email.com';

-- Make yourself super admin
INSERT INTO platform_admins (user_id, role, permissions)
VALUES (
  'YOUR_USER_ID_HERE',
  'super_admin',
  '{"view_all": true, "manage_pricing": true, "manage_organizations": true, "manage_users": true}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
```

### **2. Test Platform Access:**
- Visit `/platform-admin`
- You should see the dashboard
- Check stats are loading

### **3. Verify Billing Engine:**
```sql
-- Test SMS rate calculation (should return 0.0100)
SELECT value->'rate' FROM platform_settings WHERE key = 'sms_pricing_default';

-- Test AI rate calculation (should return 0.0020)
SELECT value->'rate_per_1k_tokens' FROM platform_settings WHERE key = 'ai_pricing_default';
```

### **4. Test Organization Creation:**
```sql
-- Check organization_members table is ready
SELECT COUNT(*) FROM organization_members;
-- Should return 0 initially
```

---

## 🐛 **Troubleshooting**

### **Error: "relation 'users' does not exist"**
- You need to run Supabase Auth migrations first
- Or you're using a fresh database
- Solution: Ensure Supabase Auth tables exist

### **Error: "column already exists"**
- Safe to ignore - means migration ran before
- Or run this to check: `SELECT column_name FROM information_schema.columns WHERE table_name='users';`

### **Error: "permission denied"**
- Ensure you're using the `service_role` key
- Or run as database owner

### **Missing tables after migration:**
```sql
-- Check if migration ran
SELECT COUNT(*) FROM platform_settings;
-- Should return 3 (or more)

-- If 0, migration didn't run - check logs
```

---

## 📊 **Migration File Sizes**

- `000_complete_billing_foundation.sql` - **~470 lines**
- `001_add_invoices_table.sql` - **~80 lines**
- **Total:** ~550 lines of SQL

---

## ✅ **Checklist**

- [ ] Ran `000_complete_billing_foundation.sql`
- [ ] Verified 13 tables + 1 view exist
- [ ] Checked 5 subscription plans inserted
- [ ] Verified 3 platform settings exist
- [ ] Ran `001_add_invoices_table.sql`
- [ ] Verified `invoices` table exists
- [ ] Made yourself platform admin
- [ ] Tested `/platform-admin` access
- [ ] Ready to deploy! 🚀

---

**All database migrations are now complete and production-ready!**

