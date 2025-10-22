-- Migration: Add pgvector support and performance indexes
-- Run this on your Supabase database

-- ============================================================================
-- 1. ENABLE PGVECTOR EXTENSION
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 2. ADD EMBEDDING COLUMN TO EMAILS
-- ============================================================================

-- Add embedding column (1536 dimensions for OpenAI text-embedding-3-small)
ALTER TABLE emails ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector index for fast similarity search
-- Using ivfflat algorithm with 100 lists (good for 10K-100K emails)
CREATE INDEX IF NOT EXISTS emails_embedding_idx 
ON emails USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================

-- Inbox query optimization (most common query)
CREATE INDEX IF NOT EXISTS idx_emails_category_date 
ON emails(email_category, received_at DESC) 
WHERE email_category IS NOT NULL;

-- Attachment queries
CREATE INDEX IF NOT EXISTS idx_attachments_email 
ON email_attachments(email_id) 
INCLUDE (filename, size, content_type, storage_url);

-- Sync operations
CREATE INDEX IF NOT EXISTS idx_emails_account_folder 
ON emails(account_id, folder_name, received_at DESC);

-- Search queries by sender
CREATE INDEX IF NOT EXISTS idx_emails_sender 
ON emails(account_id, sender_email, received_at DESC);

-- Unread emails (common filter)
CREATE INDEX IF NOT EXISTS idx_emails_unread 
ON emails(account_id, is_read, received_at DESC) 
WHERE is_read = false;

-- Full-text search (fallback for keyword search)
CREATE INDEX IF NOT EXISTS emails_fulltext_idx 
ON emails USING GIN(to_tsvector('english', COALESCE(subject, '') || ' ' || COALESCE(body_text, '')));

-- User emails (for user operations)
CREATE INDEX IF NOT EXISTS idx_emails_user 
ON emails(user_id, received_at DESC);

-- Thread queries
CREATE INDEX IF NOT EXISTS idx_emails_thread 
ON emails(thread_id, received_at ASC) 
WHERE thread_id IS NOT NULL;

-- ============================================================================
-- 4. AI TABLES
-- ============================================================================

-- Autopilot rules table
CREATE TABLE IF NOT EXISTS autopilot_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  trust_level TEXT NOT NULL DEFAULT 'suggest' CHECK (trust_level IN ('suggest', 'review', 'auto')),
  confidence FLOAT DEFAULT 0.0 CHECK (confidence >= 0 AND confidence <= 1),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI actions log
CREATE TABLE IF NOT EXISTS ai_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  rule_id UUID REFERENCES autopilot_rules(id) ON DELETE SET NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  undone_at TIMESTAMP,
  metadata JSONB,
  success BOOLEAN DEFAULT true
);

-- Email templates
CREATE TABLE IF NOT EXISTS ai_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_body TEXT NOT NULL,
  variables JSONB,
  category TEXT DEFAULT 'general',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics tracking
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value FLOAT NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- User behavior patterns for AI learning
CREATE TABLE IF NOT EXISTS user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  sender TEXT,
  pattern JSONB NOT NULL,
  confidence INTEGER DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES FOR AI TABLES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_autopilot_rules_user 
ON autopilot_rules(user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_actions_log_user 
ON ai_actions_log(user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_actions_log_email 
ON ai_actions_log(email_id);

CREATE INDEX IF NOT EXISTS idx_email_templates_user 
ON ai_email_templates(user_id, category);

CREATE INDEX IF NOT EXISTS idx_email_analytics_user 
ON email_analytics(user_id, metric_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_behavior_patterns_user 
ON user_behavior_patterns(user_id, pattern_type);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE autopilot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_actions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_patterns ENABLE ROW LEVEL SECURITY;

-- Autopilot rules policies
CREATE POLICY "Users can manage their own autopilot rules"
ON autopilot_rules FOR ALL
USING (auth.uid() = user_id);

-- AI actions log policies
CREATE POLICY "Users can view their own AI actions"
ON ai_actions_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI actions"
ON ai_actions_log FOR INSERT
WITH CHECK (true); -- System service role can insert

-- Email templates policies
CREATE POLICY "Users can manage their own templates"
ON ai_email_templates FOR ALL
USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view their own analytics"
ON email_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert analytics"
ON email_analytics FOR INSERT
WITH CHECK (true);

-- Behavior patterns policies
CREATE POLICY "Users can view their own patterns"
ON user_behavior_patterns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage patterns"
ON user_behavior_patterns FOR ALL
USING (true);

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_autopilot_rules_updated_at
BEFORE UPDATE ON autopilot_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_email_templates_updated_at
BEFORE UPDATE ON ai_email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. VERIFY MIGRATION
-- ============================================================================

-- Check if vector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check if embedding column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'emails' AND column_name = 'embedding';

-- Check indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('emails', 'email_attachments', 'autopilot_rules', 'ai_actions_log')
ORDER BY tablename, indexname;

-- Check new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'autopilot_rules',
  'ai_actions_log',
  'ai_email_templates',
  'email_analytics',
  'user_behavior_patterns'
)
ORDER BY table_name;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Run this query to verify everything is set up correctly:
SELECT 
  'Migration completed successfully!' as status,
  (SELECT COUNT(*) FROM pg_extension WHERE extname = 'vector') as vector_enabled,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'embedding') as embedding_column_exists,
  (SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%embedding%') as vector_indexes,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('autopilot_rules', 'ai_actions_log', 'ai_email_templates', 'email_analytics', 'user_behavior_patterns')) as ai_tables_created;

