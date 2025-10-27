# Quick Verification Checklist

After running the SQL migration in Supabase, verify everything is working:

## 1. Check Tables Exist

Run this query in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'notification_templates',
  'notification_queue',
  'template_images',
  'notification_settings'
)
ORDER BY table_name;
```

**Expected Result:** Should return 4 rows

## 2. Check Enums Exist

```sql
SELECT typname
FROM pg_type
WHERE typname IN (
  'notification_template_type',
  'notification_audience',
  'notification_status',
  'email_delivery_status'
)
ORDER BY typname;
```

**Expected Result:** Should return 4 rows

## 3. Test Admin UI

1. Start your dev server: `npm run dev`
2. Navigate to `http://localhost:3000/admin/notification-templates`
3. You should see the template editor interface (even if empty)

## 4. Check for TypeScript Errors

```bash
npm run type-check
```

**Expected Result:** No errors related to notification types

## 5. Optional: Seed Templates

If you want to populate the 15 pre-built templates, run this in Supabase SQL Editor:

```sql
-- Copy contents from migrations/seed_all_email_templates.sql
```

---

**If all checks pass, your migration was successful! ✅**

_Context improved by Giga AI - Information used: Database migration verification steps_
