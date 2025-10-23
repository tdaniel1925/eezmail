-- ============================================================================
-- COMPREHENSIVE MISSING TABLES MIGRATION
-- This migration creates all tables that are defined in src/db/schema.ts
-- but are missing from the database
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Task enums
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Scheduled email enum
DO $$ BEGIN
  CREATE TYPE scheduled_email_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Email rule enums
DO $$ BEGIN
  CREATE TYPE rule_condition_field AS ENUM (
    'from', 'to', 'cc', 'bcc', 'subject', 'body',
    'has_attachment', 'attachment_name', 'sender_domain', 'is_starred'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rule_condition_operator AS ENUM (
    'equals', 'not_equals', 'contains', 'not_contains',
    'starts_with', 'ends_with', 'matches_regex',
    'is_greater_than', 'is_less_than', 'is_empty', 'is_not_empty'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE rule_action_type AS ENUM (
    'move_to_folder', 'add_label', 'remove_label', 'star',
    'unstar', 'mark_read', 'mark_unread', 'forward',
    'delete', 'archive', 'mark_spam', 'skip_inbox'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AI reply enum
DO $$ BEGIN
  CREATE TYPE ai_reply_status AS ENUM (
    'generating', 'ready', 'accepted', 'rejected', 'edited', 'sent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Chatbot action enum
DO $$ BEGIN
  CREATE TYPE chatbot_action_type AS ENUM (
    'email_sent', 'email_drafted', 'contact_created', 'contact_updated',
    'event_scheduled', 'task_created', 'folder_created', 'rule_created',
    'search_performed', 'settings_updated', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Email template enum
DO $$ BEGIN
  CREATE TYPE email_template_category AS ENUM (
    'general', 'business', 'personal', 'support', 'sales', 'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Density enum
DO $$ BEGIN
  CREATE TYPE density AS ENUM ('compact', 'comfortable', 'spacious');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority DEFAULT 'medium' NOT NULL,
  status task_status DEFAULT 'todo' NOT NULL,
  
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Email integration
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status, due_date);
CREATE INDEX IF NOT EXISTS tasks_email_id_idx ON tasks(email_id);

-- RLS for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can manage their own tasks'
  ) THEN
    CREATE POLICY "Users can manage their own tasks"
      ON tasks FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ============================================================================
-- EMAIL DRAFTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  
  -- Reply/Forward context
  in_reply_to TEXT,
  reply_to_email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  is_forward BOOLEAN DEFAULT false,
  
  -- Attachments (stored separately)
  attachment_ids UUID[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_auto_saved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_drafts_user_id_idx ON email_drafts(user_id);
CREATE INDEX IF NOT EXISTS email_drafts_account_id_idx ON email_drafts(account_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_drafts' AND column_name = 'reply_to_email_id') THEN
    CREATE INDEX IF NOT EXISTS email_drafts_reply_to_email_id_idx ON email_drafts(reply_to_email_id);
  END IF;
END $$;

-- RLS for email drafts
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own drafts"
  ON email_drafts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- SCHEDULED EMAILS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status scheduled_email_status DEFAULT 'pending' NOT NULL,
  
  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Attachments
  attachment_ids UUID[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS scheduled_emails_user_id_idx ON scheduled_emails(user_id);
CREATE INDEX IF NOT EXISTS scheduled_emails_scheduled_for_idx ON scheduled_emails(scheduled_for, status);
CREATE INDEX IF NOT EXISTS scheduled_emails_status_idx ON scheduled_emails(status);

-- RLS for scheduled emails
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own scheduled emails"
  ON scheduled_emails FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- EMAIL RULES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Conditions (JSONB array)
  conditions JSONB NOT NULL,
  
  -- Actions (JSONB array)
  actions JSONB NOT NULL,
  
  -- Settings
  is_active BOOLEAN DEFAULT true NOT NULL,
  priority INTEGER DEFAULT 0,
  stop_processing BOOLEAN DEFAULT false,
  
  -- Stats
  match_count INTEGER DEFAULT 0,
  last_matched_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS email_rules_user_id_idx ON email_rules(user_id, is_active);
CREATE INDEX IF NOT EXISTS email_rules_account_id_idx ON email_rules(account_id);
CREATE INDEX IF NOT EXISTS email_rules_priority_idx ON email_rules(priority DESC);

-- RLS for email rules
ALTER TABLE email_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email rules"
  ON email_rules FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- EMAIL SIGNATURES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  signature_html TEXT NOT NULL,
  signature_text TEXT,
  
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS email_signatures_user_id_idx ON email_signatures(user_id);
CREATE INDEX IF NOT EXISTS email_signatures_account_id_idx ON email_signatures(account_id);
CREATE INDEX IF NOT EXISTS email_signatures_is_default_idx ON email_signatures(is_default) WHERE is_default = true;

-- RLS for email signatures
ALTER TABLE email_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own signatures"
  ON email_signatures FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- AI REPLY DRAFTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_reply_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  
  reply_body_html TEXT NOT NULL,
  reply_body_text TEXT,
  
  status ai_reply_status DEFAULT 'generating' NOT NULL,
  
  -- AI metadata
  model_used TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  confidence_score FLOAT,
  
  -- User feedback
  user_edits TEXT,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  accepted_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ai_reply_drafts_user_id_idx ON ai_reply_drafts(user_id);
CREATE INDEX IF NOT EXISTS ai_reply_drafts_email_id_idx ON ai_reply_drafts(email_id);
CREATE INDEX IF NOT EXISTS ai_reply_drafts_status_idx ON ai_reply_drafts(status);

-- RLS for AI reply drafts
ALTER TABLE ai_reply_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI reply drafts"
  ON ai_reply_drafts FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- CHATBOT ACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS chatbot_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  action_type chatbot_action_type NOT NULL,
  action_description TEXT NOT NULL,
  
  -- Context
  related_email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  related_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  
  -- Result
  success BOOLEAN DEFAULT true NOT NULL,
  error_message TEXT,
  
  -- Undo support
  undo_data JSONB,
  undone_at TIMESTAMPTZ,
  
  -- Metadata
  executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS chatbot_actions_user_id_idx ON chatbot_actions(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS chatbot_actions_type_idx ON chatbot_actions(action_type);

-- RLS for chatbot actions
ALTER TABLE chatbot_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chatbot actions"
  ON chatbot_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert chatbot actions"
  ON chatbot_actions FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- EXTRACTED ACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS extracted_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  
  action_text TEXT NOT NULL,
  action_type TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT,
  
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- AI metadata
  confidence_score FLOAT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS extracted_actions_user_id_idx ON extracted_actions(user_id);
CREATE INDEX IF NOT EXISTS extracted_actions_email_id_idx ON extracted_actions(email_id);
CREATE INDEX IF NOT EXISTS extracted_actions_is_completed_idx ON extracted_actions(is_completed, due_date);

-- RLS for extracted actions
ALTER TABLE extracted_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own extracted actions"
  ON extracted_actions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- FOLLOW UP REMINDERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  
  remind_at TIMESTAMPTZ NOT NULL,
  reminder_text TEXT,
  
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS follow_up_reminders_user_id_idx ON follow_up_reminders(user_id);
CREATE INDEX IF NOT EXISTS follow_up_reminders_email_id_idx ON follow_up_reminders(email_id);
CREATE INDEX IF NOT EXISTS follow_up_reminders_remind_at_idx ON follow_up_reminders(remind_at, is_sent, is_dismissed);

-- RLS for follow up reminders
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own follow up reminders"
  ON follow_up_reminders FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  category email_template_category DEFAULT 'general' NOT NULL,
  
  -- Variables support
  variables JSONB,
  
  -- Stats
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS email_templates_user_id_idx ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS email_templates_category_idx ON email_templates(category);

-- RLS for email templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email templates"
  ON email_templates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- CUSTOM LABELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS custom_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#4299E1',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS custom_labels_user_id_idx ON custom_labels(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS custom_labels_user_name_idx ON custom_labels(user_id, name);

-- RLS for custom labels
ALTER TABLE custom_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own custom labels"
  ON custom_labels FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- LABEL ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES custom_labels(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(email_id, label_id)
);

CREATE INDEX IF NOT EXISTS label_assignments_email_id_idx ON label_assignments(email_id);
CREATE INDEX IF NOT EXISTS label_assignments_label_id_idx ON label_assignments(label_id);

-- RLS for label assignments
ALTER TABLE label_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage labels on their own emails"
  ON label_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM emails
      WHERE emails.id = label_assignments.email_id
      AND emails.user_id = auth.uid()
    )
  );

-- ============================================================================
-- USER PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Display preferences
  theme TEXT DEFAULT 'system',
  density density DEFAULT 'comfortable',
  emails_per_page INTEGER DEFAULT 50,
  
  -- Email display
  show_avatars BOOLEAN DEFAULT true,
  show_preview BOOLEAN DEFAULT true,
  compact_view BOOLEAN DEFAULT false,
  
  -- Behavior
  mark_as_read_on_view BOOLEAN DEFAULT true,
  mark_as_read_delay INTEGER DEFAULT 0,
  default_send_behavior TEXT DEFAULT 'send',
  
  -- Notifications
  desktop_notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT false,
  
  -- Reading pane
  reading_pane_position TEXT DEFAULT 'right',
  
  -- Typography
  font_family TEXT DEFAULT 'system',
  font_size TEXT DEFAULT 'medium',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);

-- RLS for user preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables with updated_at
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_drafts_updated_at
BEFORE UPDATE ON email_drafts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_emails_updated_at
BEFORE UPDATE ON scheduled_emails
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_rules_updated_at
BEFORE UPDATE ON email_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_signatures_updated_at
BEFORE UPDATE ON email_signatures
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_reply_drafts_updated_at
BEFORE UPDATE ON ai_reply_drafts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tasks IS 'User tasks created manually or extracted from emails';
COMMENT ON TABLE email_drafts IS 'Email drafts with auto-save support';
COMMENT ON TABLE scheduled_emails IS 'Emails scheduled to be sent at a future time';
COMMENT ON TABLE email_rules IS 'User-defined email filtering and automation rules';
COMMENT ON TABLE email_signatures IS 'Email signatures for accounts';
COMMENT ON TABLE ai_reply_drafts IS 'AI-generated email reply suggestions';
COMMENT ON TABLE chatbot_actions IS 'Log of all actions performed by the AI chatbot';
COMMENT ON TABLE extracted_actions IS 'Action items automatically extracted from emails';
COMMENT ON TABLE follow_up_reminders IS 'Reminders for following up on emails';
COMMENT ON TABLE email_templates IS 'Reusable email templates';
COMMENT ON TABLE custom_labels IS 'User-defined custom labels for emails';
COMMENT ON TABLE label_assignments IS 'Assignments of custom labels to emails';
COMMENT ON TABLE user_preferences IS 'User interface and behavior preferences';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables were created
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND information_schema.tables.table_name = t.table_name) 
    THEN '✅ Created'
    ELSE '❌ Missing'
  END as status
FROM (
  VALUES 
    ('tasks'),
    ('email_drafts'),
    ('scheduled_emails'),
    ('email_rules'),
    ('email_signatures'),
    ('ai_reply_drafts'),
    ('chatbot_actions'),
    ('extracted_actions'),
    ('follow_up_reminders'),
    ('email_templates'),
    ('custom_labels'),
    ('label_assignments'),
    ('user_preferences')
) AS t(table_name)
ORDER BY table_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

