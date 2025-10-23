-- migrations/add_failed_messages_and_sync_metrics.sql

-- Failed messages tracking table
CREATE TABLE IF NOT EXISTS failed_sync_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES email_folders(id) ON DELETE SET NULL,
  message_id TEXT NOT NULL,
  subject TEXT,
  from_address JSONB,
  received_at TIMESTAMP,
  error_type TEXT NOT NULL, -- 'network', 'parsing', 'validation', 'duplicate', 'rate_limit', 'unknown'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  status TEXT DEFAULT 'pending', -- 'pending', 'retrying', 'failed', 'resolved'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for failed messages
CREATE INDEX IF NOT EXISTS failed_messages_account_idx ON failed_sync_messages(account_id);
CREATE INDEX IF NOT EXISTS failed_messages_status_idx ON failed_sync_messages(status);
CREATE INDEX IF NOT EXISTS failed_messages_next_retry_idx ON failed_sync_messages(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS failed_messages_created_idx ON failed_sync_messages(created_at DESC);

-- Sync metrics table for comprehensive error logging
CREATE TABLE IF NOT EXISTS sync_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES email_folders(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL, -- 'initial', 'manual', 'auto', 'retry'
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  status TEXT NOT NULL, -- 'in_progress', 'completed', 'failed', 'cancelled'
  
  -- Counts
  total_messages INTEGER DEFAULT 0,
  messages_processed INTEGER DEFAULT 0,
  messages_inserted INTEGER DEFAULT 0,
  messages_updated INTEGER DEFAULT 0,
  messages_skipped INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  
  -- Performance metrics
  avg_message_processing_ms FLOAT,
  api_calls_made INTEGER DEFAULT 0,
  rate_limit_hits INTEGER DEFAULT 0,
  
  -- Error tracking
  errors JSONB, -- Array of error objects
  error_summary TEXT,
  
  -- Resource usage
  memory_used_mb FLOAT,
  
  -- Metadata
  provider TEXT, -- 'gmail', 'outlook', 'imap'
  checkpoint_data JSONB,
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for sync metrics
CREATE INDEX IF NOT EXISTS sync_metrics_account_idx ON sync_metrics(account_id);
CREATE INDEX IF NOT EXISTS sync_metrics_started_idx ON sync_metrics(started_at DESC);
CREATE INDEX IF NOT EXISTS sync_metrics_status_idx ON sync_metrics(status);
CREATE INDEX IF NOT EXISTS sync_metrics_provider_idx ON sync_metrics(provider);

-- Sync health check view
CREATE OR REPLACE VIEW sync_health_summary AS
SELECT 
  account_id,
  COUNT(*) as total_syncs,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_syncs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_syncs,
  AVG(duration_ms) as avg_duration_ms,
  SUM(messages_processed) as total_messages_processed,
  SUM(messages_failed) as total_messages_failed,
  SUM(duplicates_found) as total_duplicates_found,
  SUM(rate_limit_hits) as total_rate_limit_hits,
  MAX(started_at) as last_sync_at
FROM sync_metrics
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY account_id;

-- Add sync_checkpoint column to email_accounts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'sync_checkpoint'
  ) THEN
    ALTER TABLE email_accounts ADD COLUMN sync_checkpoint JSONB;
  END IF;
END $$;

-- Add last_sync_metrics_id to email_accounts
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_accounts' AND column_name = 'last_sync_metrics_id'
  ) THEN
    ALTER TABLE email_accounts ADD COLUMN last_sync_metrics_id UUID REFERENCES sync_metrics(id);
  END IF;
END $$;

