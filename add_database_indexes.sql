-- Add critical database indexes for performance optimization
-- These indexes address the performance issues identified in the audit

-- Add userId index to emails table (via accountId relationship)
-- This will improve queries that filter emails by user
CREATE INDEX IF NOT EXISTS emails_user_id_via_account_idx ON emails (account_id);

-- Add customFolderId index to emails table
-- This will improve queries that filter emails by custom folder
CREATE INDEX IF NOT EXISTS emails_custom_folder_id_idx ON emails (custom_folder_id);

-- Add composite index for common email queries (userId + receivedAt)
-- This will improve performance for user-specific email queries ordered by date
CREATE INDEX IF NOT EXISTS emails_account_received_at_idx ON emails (account_id, received_at DESC);

-- Add composite index for unread emails by account
-- This will improve performance for unread email queries
CREATE INDEX IF NOT EXISTS emails_account_unread_idx ON emails (account_id, is_read) WHERE is_read = false;

-- Add composite index for starred emails by account
-- This will improve performance for starred email queries
CREATE INDEX IF NOT EXISTS emails_account_starred_idx ON emails (account_id, is_starred) WHERE is_starred = true;

-- Add composite index for folder queries
-- This will improve performance for folder-specific email queries
CREATE INDEX IF NOT EXISTS emails_folder_received_at_idx ON emails (folder_name, received_at DESC);

-- Add index for email search optimization
-- This will improve full-text search performance
CREATE INDEX IF NOT EXISTS emails_search_vector_idx ON emails USING gin (to_tsvector('english', subject || ' ' || COALESCE(snippet, '')));

-- Add index for AI-generated content queries
-- This will improve performance for AI-related queries
CREATE INDEX IF NOT EXISTS emails_ai_generated_at_idx ON emails (ai_generated_at) WHERE ai_generated_at IS NOT NULL;

-- Add index for voice message queries
-- This will improve performance for voice message filtering
CREATE INDEX IF NOT EXISTS emails_voice_message_idx ON emails (has_voice_message) WHERE has_voice_message = true;

-- Add index for screening status queries
-- This will improve performance for Hey workflow queries
CREATE INDEX IF NOT EXISTS emails_screening_pending_idx ON emails (screening_status) WHERE screening_status = 'pending';

-- Add index for reply later queries
-- This will improve performance for Reply Later feature
CREATE INDEX IF NOT EXISTS emails_reply_later_idx ON emails (reply_later_until) WHERE reply_later_until IS NOT NULL;

-- Add index for set aside queries
-- This will improve performance for Set Aside feature
CREATE INDEX IF NOT EXISTS emails_set_aside_idx ON emails (is_set_aside) WHERE is_set_aside = true;

-- Add index for important emails
-- This will improve performance for important email queries
CREATE INDEX IF NOT EXISTS emails_important_idx ON emails (is_important) WHERE is_important = true;

-- Add index for emails needing reply
-- This will improve performance for follow-up queries
CREATE INDEX IF NOT EXISTS emails_needs_reply_idx ON emails (needs_reply) WHERE needs_reply = true;
