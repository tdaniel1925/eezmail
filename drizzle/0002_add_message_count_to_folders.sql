-- Add message_count to email_folders table
ALTER TABLE email_folders 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS email_folders_message_count_idx ON email_folders(message_count);

