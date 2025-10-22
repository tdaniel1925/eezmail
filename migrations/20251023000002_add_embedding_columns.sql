-- Add missing columns for email embedding/RAG functionality
-- This enables AI-powered email search and semantic features

-- Add userId column to emails table for direct user reference
-- (Currently emails are only linked via account -> user, this adds direct link)
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add embedding column for vector search (using pgvector extension)
-- Note: If pgvector is not installed, this will store as text/jsonb
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS embedding TEXT;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS emails_user_id_idx ON emails(user_id);

-- Create index on embedding for search (if using pgvector)
-- CREATE INDEX IF NOT EXISTS emails_embedding_idx ON emails USING ivfflat (embedding vector_cosine_ops);

-- Populate user_id from account relationship for existing emails
UPDATE emails 
SET user_id = email_accounts.user_id 
FROM email_accounts 
WHERE emails.account_id = email_accounts.id 
AND emails.user_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN emails.user_id IS 'Direct reference to user for faster queries (denormalized from account)';
COMMENT ON COLUMN emails.embedding IS 'Vector embedding for semantic search (JSON string or pgvector)';

