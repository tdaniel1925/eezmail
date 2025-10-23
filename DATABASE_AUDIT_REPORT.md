# 🔍 Complete Database Migration Audit Report

## Executive Summary

**Status:** ⚠️ **CRITICAL - MULTIPLE MISSING MIGRATIONS FOUND**

Several tables defined in `src/db/schema.ts` do NOT have corresponding database migrations, which will cause runtime errors when the application tries to query these tables.

---

## Missing Tables (CRITICAL)

These tables are defined in the schema but have NO migrations:

### 1. **`tasks` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1774
- **Impact:** HIGH - Task management features will fail
- **Required Enums:** 
  - `task_priority` (low, medium, high, urgent)
  - `task_status` (todo, in_progress, completed, cancelled)
- **Features Affected:** Task creation, task listing, task updates via AI chatbot

### 2. **`email_drafts` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1645
- **Impact:** HIGH - Draft management will fail
- **Features Affected:** Saving email drafts, auto-save functionality

### 3. **`scheduled_emails` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1704
- **Impact:** HIGH - Scheduled send feature will fail
- **Required Enum:** `scheduled_email_status` (pending, sent, failed, cancelled)
- **Features Affected:** Schedule email sending, cron job processing

### 4. **`email_rules` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1338
- **Impact:** HIGH - Email rule automation will fail
- **Required Enums:**
  - `rule_condition_field` (from, to, subject, body, has_attachment, etc.)
  - `rule_condition_operator` (equals, contains, starts_with, etc.)
  - `rule_action_type` (move, label, forward, delete, etc.)
- **Features Affected:** Email filtering, automation rules, AI rule creation

### 5. **`email_signatures` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1306
- **Impact:** MEDIUM - Signature management will fail
- **Features Affected:** Creating/editing signatures, signature templates

### 6. **`ai_reply_drafts` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1441
- **Impact:** HIGH - AI-generated replies will fail
- **Required Enum:** `ai_reply_status` (generating, ready, accepted, rejected, edited)
- **Features Affected:** AI reply suggestions, smart compose

### 7. **`chatbot_actions` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1485
- **Impact:** HIGH - Chatbot action tracking will fail
- **Required Enum:** `chatbot_action_type` (email_sent, contact_created, event_scheduled, etc.)
- **Features Affected:** Chatbot action logging, undo functionality

### 8. **`extracted_actions` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1534
- **Impact:** MEDIUM - Action item extraction will fail
- **Features Affected:** AI action item detection in emails

### 9. **`follow_up_reminders` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1571
- **Impact:** MEDIUM - Follow-up reminders will fail
- **Features Affected:** Email follow-up tracking, reminder notifications

### 10. **`email_templates` table** ❌
- **Schema Location:** `src/db/schema.ts` line 1610
- **Impact:** MEDIUM - Email templates will fail
- **Required Enum:** `email_template_category` (general, business, personal, etc.)
- **Features Affected:** Template management, quick compose

### 11. **`custom_labels` table** ❌
- **Schema Location:** `src/db/schema.ts` line 2015
- **Impact:** MEDIUM - Custom labels will fail
- **Features Affected:** User-defined email labels

### 12. **`label_assignments` table** ❌
- **Schema Location:** `src/db/schema.ts` line 2041
- **Impact:** MEDIUM - Label assignment will fail
- **Features Affected:** Assigning custom labels to emails

### 13. **`user_preferences` table** ❌
- **Schema Location:** `src/db/schema.ts` line 2074
- **Impact:** MEDIUM - User preferences will fail
- **Required Enum:** `density` (compact, comfortable, spacious)
- **Features Affected:** Theme, layout preferences, email display settings

---

## Tables with Migrations (✅ VERIFIED)

These tables HAVE migrations and should work correctly:

1. ✅ `users` - Core auth table (Supabase managed)
2. ✅ `subscriptions` - Migration: `20251018030002_admin_subscriptions.sql`
3. ✅ `email_accounts` - Core table (should be in initial schema)
4. ✅ `emails` - Core table (should be in initial schema)
5. ✅ `email_folders` - Core table + `add_folder_sync_cursors.sql`
6. ✅ `sender_trust` - Core table
7. ✅ `email_threads` - Core table
8. ✅ `email_attachments` - Core table + `add_attachment_ai_description.sql`
9. ✅ `email_labels` - Core table
10. ✅ `email_contacts` - Core table
11. ✅ `email_settings` - `create_missing_tables_safe.sql`
12. ✅ `custom_folders` - Core table
13. ✅ `contacts` - Core table
14. ✅ `contact_emails` - Core table
15. ✅ `contact_phones` - Core table
16. ✅ `contact_groups` - `20251023000001_add_contact_groups_tags_safe.sql`
17. ✅ `contact_group_members` - `20251023000001_add_contact_groups_tags_safe.sql`
18. ✅ `contact_tags` - `20251023000001_add_contact_groups_tags_safe.sql`
19. ✅ `contact_tag_assignments` - `20251023000001_add_contact_groups_tags_safe.sql`
20. ✅ `contact_addresses` - Core table
21. ✅ `contact_social_links` - Core table
22. ✅ `contact_custom_fields` - `create_contact_custom_fields.sql`
23. ✅ `contact_notes` - Core table
24. ✅ `contact_timeline` - `final_migration.sql`
25. ✅ `sync_jobs` - Core table
26. ✅ `calendar_events` - ✅ `add_calendar_tables.sql` (RECENTLY RAN)
27. ✅ `calendar_attendees` - ✅ `add_calendar_tables.sql` (RECENTLY RAN)
28. ✅ `calendar_reminders` - ✅ `add_calendar_tables.sql` (RECENTLY RAN)
29. ✅ `external_calendars` - ✅ `add_calendar_tables.sql` (RECENTLY RAN)
30. ✅ `user_ai_profiles` - ✅ `add_user_ai_profiles.sql`
31. ✅ `webhook_subscriptions` - `add_webhook_subscriptions_only.sql`
32. ✅ `communication_settings` - `add_communication_features.sql`
33. ✅ `communication_limits` - `add_communication_features.sql`
34. ✅ `communication_usage` - `add_communication_features.sql`
35. ✅ `embedding_queue` - `add_background_queues.sql`
36. ✅ `contact_timeline_queue` - `add_background_queues.sql`
37. ✅ `failed_sync_messages` - `add_failed_messages_and_sync_metrics.sql`
38. ✅ `sync_metrics` - `add_failed_messages_and_sync_metrics.sql`

---

## Required Enums Missing Migrations

These enums are defined in schema but might not exist in database:

### Critical Enums (No Migrations Found):
1. ❌ `task_priority`
2. ❌ `task_status`
3. ❌ `scheduled_email_status`
4. ❌ `rule_condition_field`
5. ❌ `rule_condition_operator`
6. ❌ `rule_action_type`
7. ❌ `ai_reply_status`
8. ❌ `chatbot_action_type`
9. ❌ `email_template_category`
10. ❌ `density`

---

## Recommended Actions

### IMMEDIATE (Run these migrations ASAP):

1. **Create comprehensive missing tables migration**
   - File: `migrations/add_missing_core_tables.sql`
   - Tables: tasks, email_drafts, scheduled_emails, email_rules, email_signatures, ai_reply_drafts, chatbot_actions, extracted_actions, follow_up_reminders, email_templates, custom_labels, label_assignments, user_preferences
   - All required enums

2. **Run the migration**
   ```bash
   node scripts/run-missing-tables-migration.js
   ```

3. **Verify tables exist**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'tasks', 'email_drafts', 'scheduled_emails', 
     'email_rules', 'email_signatures', 'ai_reply_drafts',
     'chatbot_actions', 'extracted_actions', 'follow_up_reminders',
     'email_templates', 'custom_labels', 'label_assignments',
     'user_preferences'
   );
   ```

---

## Impact Assessment

### High Priority (Will Cause Runtime Errors):
- ❌ AI Chatbot features (tasks, actions, drafts)
- ❌ Email automation (rules, scheduled sends)
- ❌ Task management
- ❌ AI reply generation

### Medium Priority (Features Won't Work):
- ❌ Email templates
- ❌ Custom labels
- ❌ Follow-up reminders
- ❌ User preferences

### Low Priority (Optional Features):
- ❌ Action item extraction
- ❌ Email signatures (fallback exists)

---

## Migration Creation Priority

1. **Phase 1 (CRITICAL):** tasks, email_rules, scheduled_emails, ai_reply_drafts, chatbot_actions
2. **Phase 2 (HIGH):** email_drafts, email_signatures, extracted_actions
3. **Phase 3 (MEDIUM):** email_templates, follow_up_reminders, custom_labels, label_assignments, user_preferences

---

## Files to Create

1. `migrations/add_missing_core_tables.sql` - Comprehensive migration for all 13 missing tables
2. `scripts/run-missing-tables-migration.js` - Script to run the migration

---

## Conclusion

**Status:** ⚠️ **13 CRITICAL TABLES MISSING**

The application will experience runtime errors in the following areas:
- ✅ Calendar features (FIXED in previous migration)
- ❌ Task management
- ❌ Email drafts
- ❌ Scheduled emails
- ❌ Email rules/automation
- ❌ AI reply generation
- ❌ Chatbot action tracking
- ❌ Email templates
- ❌ Custom labels
- ❌ User preferences

**Next Step:** Create and run comprehensive migration for all missing tables.

