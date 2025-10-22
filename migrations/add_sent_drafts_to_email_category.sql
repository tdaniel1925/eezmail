-- Add 'sent' and 'drafts' values to email_category enum
-- This allows emails to be categorized as sent or drafts

-- Add new enum values
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'drafts';



