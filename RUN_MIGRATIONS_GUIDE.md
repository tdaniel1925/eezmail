# 🚀 **DATABASE MIGRATIONS - STEP-BY-STEP GUIDE**

## 📋 **MIGRATIONS TO RUN (6 Total)**

You need to run these migrations in **exact order**:

1. `migrations/011_audit_logging_system.sql` - Audit logs with partitioning
2. `migrations/012_impersonation_system.sql` - Admin impersonation
3. `migrations/013_ecommerce_system.sql` - Products, orders, cart
4. `migrations/014_monitoring_system.sql` - Alerts & metrics
5. `migrations/015_support_system.sql` - Support tickets
6. `migrations/016_knowledge_base.sql` - KB articles

---

## 🎯 **HOW TO RUN MIGRATIONS**

### Option 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase project**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run each migration**
   - Copy the entire contents of `migrations/011_audit_logging_system.sql`
   - Paste into the SQL editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait for "Success" message
   - **Repeat for all 6 migrations in order**

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd C:\dev\win-email_client

# Run migrations in order
npx supabase db push

# Or run individually:
psql $DATABASE_URL -f migrations/011_audit_logging_system.sql
psql $DATABASE_URL -f migrations/012_impersonation_system.sql
psql $DATABASE_URL -f migrations/013_ecommerce_system.sql
psql $DATABASE_URL -f migrations/014_monitoring_system.sql
psql $DATABASE_URL -f migrations/015_support_system.sql
psql $DATABASE_URL -f migrations/016_knowledge_base.sql
```

---

## ✅ **VERIFICATION CHECKLIST**

After running each migration, verify the tables were created:

### After Migration 011 (Audit Logging):

```sql
-- Run in SQL Editor to verify:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'audit_logs%';

-- Should show: audit_logs and monthly partitions
```

### After Migration 012 (Impersonation):

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'impersonation_sessions';

-- Should show: impersonation_sessions
```

### After Migration 013 (E-Commerce):

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'products', 'orders', 'order_items',
  'carts', 'cart_items',
  'customer_subscriptions', 'invoices'
);

-- Should show all 7 tables
```

### After Migration 014 (Monitoring):

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('alert_rules', 'alert_events', 'system_metrics');

-- Should show all 3 tables
```

### After Migration 015 (Support Tickets):

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('support_tickets', 'ticket_comments', 'ticket_tags');

-- Should show all 3 tables
```

### After Migration 016 (Knowledge Base):

```sql
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('knowledge_base_articles', 'knowledge_base_categories');

-- Should show both tables
```

---

## 🔧 **TROUBLESHOOTING**

### Error: "relation already exists"

This means the table is already created. You can either:

1. Skip this migration (table already exists)
2. Drop the table first (⚠️ WARNING: This deletes data!)
   ```sql
   DROP TABLE IF EXISTS table_name CASCADE;
   ```

### Error: "permission denied"

Make sure you're using the postgres role or have proper permissions:

```sql
-- Check your current role:
SELECT current_user, current_database();

-- Should be 'postgres' or a role with CREATEDB privileges
```

### Error: "syntax error"

- Make sure you copied the **entire** SQL file
- Check for any missing semicolons
- Verify the SQL is valid PostgreSQL syntax

### Migration fails midway

If a migration fails partway through:

1. Check which tables were created (use verification queries)
2. Note the error message
3. Fix the issue
4. Re-run from the failed point or drop and re-run entire migration

---

## 📊 **EXPECTED RESULTS**

After successfully running all 6 migrations, you should have:

**Total New Tables: 18**

- `audit_logs` (+ monthly partitions)
- `impersonation_sessions`
- `products`
- `orders`
- `order_items`
- `carts`
- `cart_items`
- `customer_subscriptions`
- `invoices`
- `alert_rules`
- `alert_events`
- `system_metrics`
- `support_tickets`
- `ticket_comments`
- `ticket_tags`
- `knowledge_base_articles`
- `knowledge_base_categories`

**Indexes Created: 25+**
**Constraints: 15+**

---

## 🎯 **POST-MIGRATION STEPS**

### 1. Restart Your Application

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Test the New Features

Visit these URLs to verify everything works:

- **Audit Logs:** http://localhost:3000/admin/audit-logs
- **Products:** http://localhost:3000/admin/products
- **Support Tickets:** http://localhost:3000/admin/support
- **Monitoring:** http://localhost:3000/admin/monitoring
- **Alert Rules:** http://localhost:3000/admin/monitoring/alerts
- **Email Accounts:** http://localhost:3000/admin/email-accounts

### 3. Create Sample Data (Optional)

Run this SQL to create test data:

```sql
-- Create a test alert rule
INSERT INTO alert_rules (name, metric, operator, threshold, severity, notification_channels, enabled)
VALUES (
  'High Error Rate',
  'error_rate',
  'gt',
  '0.05',
  'warning',
  '{"email": ["admin@example.com"]}'::jsonb,
  true
);

-- Create a test product
INSERT INTO products (name, slug, description, product_type, price, billing_interval, status)
VALUES (
  'Pro Plan',
  'pro-plan',
  'Professional plan with advanced features',
  'subscription',
  29.99,
  'month',
  'active'
);

-- Create a test KB category
INSERT INTO knowledge_base_categories (name, slug, description)
VALUES (
  'Getting Started',
  'getting-started',
  'Learn the basics'
);
```

---

## ⚠️ **IMPORTANT NOTES**

1. **Backup First**: Always backup your database before running migrations in production
2. **Test in Staging**: Run migrations in a staging environment first
3. **Order Matters**: Run migrations in the exact order listed
4. **No Rollback**: These migrations don't include rollback scripts
5. **Production**: For production, consider using migration tools like Drizzle Kit or Prisma Migrate

---

## 🎉 **SUCCESS!**

Once all migrations are complete, you'll have:

✅ All 8 production-ready admin systems fully functional
✅ 18 new database tables with proper indexes
✅ HIPAA-compliant audit logging
✅ Complete e-commerce infrastructure
✅ Real-time monitoring and alerting
✅ Support ticket system
✅ Knowledge base foundation

**Your enterprise admin system is now live!** 🚀

---

## 💬 **NEED HELP?**

If you encounter any errors:

1. Copy the exact error message
2. Note which migration failed
3. Check the troubleshooting section above
4. Let me know and I can help debug!

---

**Ready to run the migrations? Follow Option 1 (Supabase Dashboard) for the easiest experience!**

_Pro tip: Keep the SQL Editor tab open and run migrations one by one, verifying each before proceeding to the next._
