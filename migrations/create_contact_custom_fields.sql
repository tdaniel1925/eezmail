-- Create contact_custom_fields table if it doesn't exist
-- This table stores custom fields for contacts (e.g., "Company", "Birthday", etc.)

-- First, create the enum type for field types if it doesn't exist
DO $$ BEGIN
    CREATE TYPE contact_field_type AS ENUM ('text', 'email', 'phone', 'url', 'date', 'number');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the table
CREATE TABLE IF NOT EXISTS contact_custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT,
    field_type contact_field_type DEFAULT 'text',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS contact_custom_fields_contact_id_idx ON contact_custom_fields(contact_id);

-- Add comment
COMMENT ON TABLE contact_custom_fields IS 'Custom fields for contacts (e.g., Company, Birthday, LinkedIn URL, etc.)';



