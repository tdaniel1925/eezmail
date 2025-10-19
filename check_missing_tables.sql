-- Check which tables exist in your database
-- Run this in Supabase SQL Editor to see what tables you have

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'users',
      'subscriptions', 
      'email_accounts',
      'emails',
      'email_folders',
      'sender_trust',
      'email_threads',
      'email_attachments',
      'email_labels',
      'email_contacts',
      'email_settings',
      'custom_folders',
      'contacts',
      'contact_emails',
      'contact_phones',
      'contact_addresses',
      'contact_social_links',
      'contact_tags',
      'contact_tag_assignments',
      'contact_custom_fields',
      'contact_notes',
      'contact_timeline',
      'sync_jobs',
      'email_signatures',
      'email_rules',
      'ai_reply_drafts',
      'chatbot_actions',
      'extracted_actions',
      'follow_up_reminders',
      'email_templates',
      'email_drafts',
      'scheduled_emails',
      'tasks',
      'custom_labels',
      'label_assignments',
      'user_preferences'
    ) THEN '✅ EXPECTED'
    ELSE '⚠️  UNEXPECTED'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY 
  CASE 
    WHEN table_name IN ('email_accounts', 'emails', 'contacts') THEN 1
    ELSE 2
  END,
  table_name;

-- Show expected tables that are MISSING
SELECT 
  expected_table,
  '❌ MISSING' as status
FROM (
  VALUES 
    ('users'),
    ('subscriptions'),
    ('email_accounts'),
    ('emails'),
    ('email_folders'),
    ('sender_trust'),
    ('email_threads'),
    ('email_attachments'),
    ('email_labels'),
    ('email_contacts'),
    ('email_settings'),
    ('custom_folders'),
    ('contacts'),
    ('contact_emails'),
    ('contact_phones'),
    ('contact_addresses'),
    ('contact_social_links'),
    ('contact_tags'),
    ('contact_tag_assignments'),
    ('contact_custom_fields'),
    ('contact_notes'),
    ('contact_timeline'),
    ('sync_jobs'),
    ('email_signatures'),
    ('email_rules'),
    ('ai_reply_drafts'),
    ('chatbot_actions'),
    ('extracted_actions'),
    ('follow_up_reminders'),
    ('email_templates'),
    ('email_drafts'),
    ('scheduled_emails'),
    ('tasks'),
    ('custom_labels'),
    ('label_assignments'),
    ('user_preferences')
) AS expected(expected_table)
WHERE expected_table NOT IN (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
)
ORDER BY expected_table;

