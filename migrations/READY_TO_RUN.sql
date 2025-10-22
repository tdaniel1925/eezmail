-- ============================================================================
-- Email Embedding/RAG Feature Fix
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Add userId column to emails table for direct user reference
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add embedding column for vector search
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS embedding TEXT;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS emails_user_id_idx ON emails(user_id);

-- Populate user_id from account relationship for existing emails
UPDATE emails 
SET user_id = email_accounts.user_id 
FROM email_accounts 
WHERE emails.account_id = email_accounts.id 
AND emails.user_id IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN emails.user_id IS 'Direct reference to user for faster queries (denormalized from account)';
COMMENT ON COLUMN emails.embedding IS 'Vector embedding for semantic search (JSON string or pgvector)';

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'emails' 
  AND column_name IN ('user_id', 'embedding')
ORDER BY column_name;

