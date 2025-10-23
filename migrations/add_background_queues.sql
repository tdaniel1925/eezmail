-- Migration: Add background queues for RAG embedding and contact timeline processing
-- Purpose: Move slow operations (AI embeddings, contact lookups) out of sync critical path

-- Create embedding queue status enum
CREATE TYPE embedding_queue_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create timeline queue status enum
CREATE TYPE timeline_queue_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Embedding Queue Table
CREATE TABLE IF NOT EXISTS embedding_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status embedding_queue_status DEFAULT 'pending' NOT NULL,
  priority INTEGER DEFAULT 0 NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ
);

-- Indexes for embedding queue
CREATE INDEX IF NOT EXISTS embedding_queue_status_idx ON embedding_queue(status);
CREATE INDEX IF NOT EXISTS embedding_queue_priority_idx ON embedding_queue(priority, created_at);
CREATE INDEX IF NOT EXISTS embedding_queue_user_id_idx ON embedding_queue(user_id);

-- Contact Timeline Queue Table
CREATE TABLE IF NOT EXISTS contact_timeline_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status timeline_queue_status DEFAULT 'pending' NOT NULL,
  attempts INTEGER DEFAULT 0 NOT NULL,
  last_attempt_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ
);

-- Indexes for timeline queue
CREATE INDEX IF NOT EXISTS timeline_queue_status_idx ON contact_timeline_queue(status);
CREATE INDEX IF NOT EXISTS timeline_queue_created_at_idx ON contact_timeline_queue(created_at);
CREATE INDEX IF NOT EXISTS timeline_queue_user_id_idx ON contact_timeline_queue(user_id);

-- Comments
COMMENT ON TABLE embedding_queue IS 'Queue for background RAG embedding generation to avoid blocking email sync';
COMMENT ON TABLE contact_timeline_queue IS 'Queue for background contact timeline logging to avoid blocking email sync';

