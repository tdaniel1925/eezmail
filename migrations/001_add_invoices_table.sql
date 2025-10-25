-- Migration: Add Invoices Table
-- Run this AFTER 000_complete_billing_foundation.sql

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Customer
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  type VARCHAR(50) NOT NULL, -- 'top_up', 'subscription'
  
  -- Payment Processor IDs
  stripe_invoice_id VARCHAR(255),
  square_invoice_id VARCHAR(255),
  
  -- PDF & Data
  pdf_url TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  billing_details JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_created ON invoices(created_at);

COMMENT ON TABLE invoices IS 'Payment invoices with PDF generation';

-- ============================================================================
-- ADD MISSING COLUMNS TO USERS (if not exists)
-- ============================================================================

DO $$ 
BEGIN
  -- Square customer ID
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='square_customer_id') THEN
    ALTER TABLE users ADD COLUMN square_customer_id VARCHAR(255);
  END IF;
END $$;

-- ============================================================================
-- ADD MISSING COLUMNS TO ORGANIZATIONS (if not exists)
-- ============================================================================

DO $$ 
BEGIN
  -- SMS balance (should already exist, but checking)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organizations' AND column_name='sms_balance') THEN
    ALTER TABLE organizations ADD COLUMN sms_balance DECIMAL(10, 2) DEFAULT 0.00;
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Invoices table created successfully!';
  RAISE NOTICE '📄 Ready for PDF invoice generation';
  RAISE NOTICE '💳 Square customer ID field added to users';
END $$;

