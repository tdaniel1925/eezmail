# Apply Admin Feature Migrations to Production

## 🎯 Purpose

These migrations add the admin features that were built (monitoring, support, knowledge base) to your production database.

## 📋 Required Migrations (In Order)

Apply these migrations through your **Supabase Dashboard** → **SQL Editor**:

### 1. Audit Logging System

**File:** `migrations/011_audit_logging_system.sql`

- Creates `audit_logs` table
- Tracks all admin actions
- Required by: impersonation, monitoring

### 2. Impersonation System

**File:** `migrations/012_impersonation_system.sql`

- Creates `impersonation_sessions` table
- Allows admins to view user accounts
- Required by: admin user management

### 3. E-commerce System

**File:** `migrations/013_ecommerce_system.sql`

- Creates `products`, `carts`, `cart_items`, `orders`, `order_items` tables
- Enables product management
- Required by: checkout flow

### 4. Monitoring System ⚠️ **CRITICAL**

**File:** `migrations/014_monitoring_system.sql`

- Creates `system_metrics`, `alert_rules`, `alert_events` tables
- Required by: Admin monitoring dashboard
- **Fixes:** Most import errors in build warnings

### 5. Support System ⚠️ **CRITICAL**

**File:** `migrations/015_support_system.sql`

- Creates `support_tickets`, `ticket_comments`, `ticket_attachments` tables
- Required by: Admin support dashboard
- **Fixes:** Support ticket import errors

### 6. Knowledge Base ⚠️ **CRITICAL**

**File:** `migrations/016_knowledge_base.sql`

- Creates `knowledge_base_categories`, `knowledge_base_articles` tables
- Required by: Help center (/help pages)
- **Fixes:** Help page prerender errors

### 7. Advanced Analytics (Optional)

**File:** `migrations/017_advanced_analytics.sql`

- Creates analytics views and functions
- Enhances admin dashboard insights

### 8. Folder Mapping System

**File:** `migrations/018_folder_mapping_system.sql`

- Creates `folder_mappings`, `unmapped_folders` tables
- Required by: Email folder sync improvements

### 9. Schema Sync Updates

**File:** `migrations/019_schema_sync_updates.sql`

- Updates existing tables with new sync-related columns
- Improves email sync reliability

### 10. Simplified Pricing Model ⚠️ **CRITICAL**

**File:** `migrations/020_simplified_pricing_model.sql`

- Updates to new seat-based pricing (Individual/Team/Enterprise)
- Migrates existing subscriptions
- **IMPORTANT:** Review before running - migrates live data!

---

## 🚀 How to Apply

### Option A: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. For each migration file:
   - Copy the entire contents
   - Paste into the SQL editor
   - Click **Run**
   - Verify success (check for errors)
   - Move to next migration

### Option B: Via `psql` Command Line

```bash
# Set your database URL
export DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# Apply migrations in order
psql $DATABASE_URL -f migrations/011_audit_logging_system.sql
psql $DATABASE_URL -f migrations/012_impersonation_system.sql
psql $DATABASE_URL -f migrations/013_ecommerce_system.sql
psql $DATABASE_URL -f migrations/014_monitoring_system.sql
psql $DATABASE_URL -f migrations/015_support_system.sql
psql $DATABASE_URL -f migrations/016_knowledge_base.sql
psql $DATABASE_URL -f migrations/017_advanced_analytics.sql
psql $DATABASE_URL -f migrations/018_folder_mapping_system.sql
psql $DATABASE_URL -f migrations/019_schema_sync_updates.sql
psql $DATABASE_URL -f migrations/020_simplified_pricing_model.sql
```

---

## ⚠️ Important Notes

### Before Migration 020 (Pricing Model)

**CRITICAL:** This migration changes your pricing structure. It will:

- Migrate existing subscriptions to new tiers
- Update billing amounts
- Change database enums

**Action Required:**

1. Backup your database first
2. Review the migration file
3. Test on a staging environment if possible
4. Apply during low-traffic period

### After All Migrations

1. **Redeploy on Vercel** - The build warnings should disappear
2. **Test Admin Features:**
   - /admin/monitoring → Metrics dashboard
   - /admin/support → Support tickets
   - /admin/knowledge-base → KB management
   - /help → Public help center
3. **Verify Data:**
   - Check existing subscriptions migrated correctly
   - Verify pricing tiers updated
   - Test new user signups

---

## 🔍 Verification Queries

After applying migrations, run these to verify:

```sql
-- Check all tables were created
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'audit_logs',
  'impersonation_sessions',
  'products',
  'system_metrics',
  'alert_rules',
  'alert_events',
  'support_tickets',
  'ticket_comments',
  'knowledge_base_categories',
  'knowledge_base_articles',
  'folder_mappings',
  'unmapped_folders'
)
ORDER BY tablename;

-- Should return 12 rows

-- Check subscription tier enum updated
SELECT enumlabel FROM pg_enum
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'subscription_tier'
)
ORDER BY enumlabel;

-- Should return: enterprise, individual, team

-- Check if any subscriptions exist
SELECT
  tier,
  COUNT(*) as count,
  SUM(seats) as total_seats,
  AVG(total_amount) as avg_amount
FROM subscriptions
GROUP BY tier;
```

---

## 🆘 Troubleshooting

### "Relation already exists"

- Migration was already applied
- Skip to next migration

### "Type already exists"

- Enum type already exists
- Usually safe to ignore or comment out enum creation

### "Column already exists"

- Table structure already updated
- Check if migration was partially applied

### Foreign Key Errors

- Missing dependency table
- Apply missing migration first
- Check migration order

---

## 📊 Expected Results

After successful migration:

- ✅ Vercel build warnings eliminated
- ✅ `/help` page loads without errors
- ✅ Admin dashboards functional
- ✅ New pricing model active
- ✅ All schema exports available

---

## 🎉 Next Steps

1. Apply migrations (est. 10-15 minutes)
2. Trigger Vercel redeploy (automatic or manual)
3. Test all admin features
4. Verify production functionality
5. Monitor for any issues

**Questions?** Check migration files for detailed comments and table structures.
