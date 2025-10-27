-- Migration 0011: Add 'sent' to email_category enum
-- This allows emails to be properly categorized as sent items
-- Run this in Supabase SQL Editor

ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'sent';

-- Verify the change
SELECT unnest(enum_range(NULL::email_category)) AS email_category_values;
