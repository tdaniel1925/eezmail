-- Create scheduled emails table and enum
CREATE TYPE scheduled_email_status AS ENUM ('pending', 'sent', 'failed', 'canceled');

CREATE TABLE scheduled_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
  
  -- Email content
  to TEXT NOT NULL,
  cc TEXT,
  bcc TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_html BOOLEAN NOT NULL DEFAULT true,
  
  -- Attachments (stored as JSONB array)
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Scheduling
  scheduled_for TIMESTAMP NOT NULL,
  status scheduled_email_status NOT NULL DEFAULT 'pending',
  
  -- Execution tracking
  sent_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  
  -- Provider info
  provider_message_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX scheduled_emails_user_id_idx ON scheduled_emails(user_id);
CREATE INDEX scheduled_emails_account_id_idx ON scheduled_emails(account_id);
CREATE INDEX scheduled_emails_scheduled_for_idx ON scheduled_emails(scheduled_for);
CREATE INDEX scheduled_emails_status_idx ON scheduled_emails(status);

-- Composite index for finding pending emails to send
CREATE INDEX scheduled_emails_pending_idx ON scheduled_emails(status, scheduled_for) 
WHERE status = 'pending';

-- Add comment
COMMENT ON TABLE scheduled_emails IS 'Stores emails scheduled to be sent at a future time';

