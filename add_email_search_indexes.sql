-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- JSON field indexes for fast sender searches
CREATE INDEX IF NOT EXISTS idx_emails_from_name ON emails((from_address->>'name'));
CREATE INDEX IF NOT EXISTS idx_emails_from_email ON emails((from_address->>'email'));

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_emails_subject_trgm ON emails USING gin(subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_emails_body_text_trgm ON emails USING gin(body_text gin_trgm_ops);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_emails_account_received ON emails(account_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_account_unread ON emails(account_id, is_read) WHERE is_read = false;

