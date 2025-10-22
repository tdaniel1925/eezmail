-- Add AI description columns to email_attachments table
ALTER TABLE email_attachments
ADD COLUMN IF NOT EXISTS ai_description TEXT,
ADD COLUMN IF NOT EXISTS ai_description_generated_at TIMESTAMPTZ;

-- Add index for querying attachments without descriptions
CREATE INDEX IF NOT EXISTS email_attachments_ai_description_idx 
ON email_attachments(ai_description_generated_at) 
WHERE ai_description IS NULL;

COMMENT ON COLUMN email_attachments.ai_description IS 'AI-generated description of the attachment based on file type and email context';
COMMENT ON COLUMN email_attachments.ai_description_generated_at IS 'Timestamp when the AI description was generated';

