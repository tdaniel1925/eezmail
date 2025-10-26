-- Dynamic Pricing Management System
-- Allows admins to create/edit pricing tiers, features, and discount codes

-- Table: pricing_tiers
-- Stores all subscription tiers with dynamic pricing
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2),
  interval TEXT NOT NULL DEFAULT 'month', -- 'month' or 'year'
  is_active BOOLEAN DEFAULT true,
  is_highlighted BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false, -- For "Contact Us" style plans
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tier_features
-- Stores feature limits for each pricing tier
CREATE TABLE IF NOT EXISTS tier_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id UUID NOT NULL REFERENCES pricing_tiers(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL, -- e.g., 'emailAccounts', 'emailsStored'
  feature_name TEXT NOT NULL, -- Display name
  feature_value INTEGER NOT NULL, -- -1 for unlimited
  feature_type TEXT DEFAULT 'limit', -- 'limit', 'boolean', 'text'
  is_visible BOOLEAN DEFAULT true, -- Show in pricing table
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tier_id, feature_key)
);

-- Table: discount_codes
-- Stores discount codes and coupons
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL, -- 20 for 20% or 10.00 for $10
  applies_to TEXT NOT NULL DEFAULT 'all', -- 'all', 'specific_tier'
  applies_to_tier_id UUID REFERENCES pricing_tiers(id) ON DELETE SET NULL,
  max_redemptions INTEGER, -- NULL for unlimited
  current_redemptions INTEGER DEFAULT 0,
  max_redemptions_per_user INTEGER DEFAULT 1,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  stripe_coupon_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: discount_redemptions
-- Tracks who used which discount codes
CREATE TABLE IF NOT EXISTS discount_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(discount_code_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_active ON pricing_tiers(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_slug ON pricing_tiers(slug);
CREATE INDEX IF NOT EXISTS idx_tier_features_tier_id ON tier_features(tier_id);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_discount_redemptions_user ON discount_redemptions(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default pricing tiers from existing plans
INSERT INTO pricing_tiers (name, slug, description, price, interval, is_highlighted, sort_order) VALUES
  ('Free', 'free', 'Try out the basics', 0, 'month', false, 1),
  ('Starter', 'starter', 'For professionals', 15, 'month', false, 2),
  ('Professional', 'professional', 'For teams', 35, 'month', true, 3),
  ('Enterprise', 'enterprise', 'For large organizations', NULL, 'month', false, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert default features for Free tier
INSERT INTO tier_features (tier_id, feature_key, feature_name, feature_value, sort_order)
SELECT 
  id,
  unnest(ARRAY['emailAccounts', 'emailsStored', 'ragSearchesPerDay', 'aiQueriesPerMonth', 'storageGB', 'customLabels', 'customFolders', 'emailRules', 'contactsStored', 'attachmentSizeLimit']),
  unnest(ARRAY['Email Accounts', 'Emails Stored', 'RAG Searches/Day', 'AI Queries/Month', 'Storage (GB)', 'Custom Labels', 'Custom Folders', 'Email Rules', 'Contacts Stored', 'Attachment Size Limit (MB)']),
  unnest(ARRAY[1, 1000, 10, 50, 1, 5, 3, 5, 100, 10]),
  generate_series(1, 10)
FROM pricing_tiers
WHERE slug = 'free'
ON CONFLICT (tier_id, feature_key) DO NOTHING;

-- Insert default features for Starter tier
INSERT INTO tier_features (tier_id, feature_key, feature_name, feature_value, sort_order)
SELECT 
  id,
  unnest(ARRAY['emailAccounts', 'emailsStored', 'ragSearchesPerDay', 'aiQueriesPerMonth', 'storageGB', 'customLabels', 'customFolders', 'emailRules', 'contactsStored', 'attachmentSizeLimit']),
  unnest(ARRAY['Email Accounts', 'Emails Stored', 'RAG Searches/Day', 'AI Queries/Month', 'Storage (GB)', 'Custom Labels', 'Custom Folders', 'Email Rules', 'Contacts Stored', 'Attachment Size Limit (MB)']),
  unnest(ARRAY[3, 10000, 100, 500, 10, 25, 10, 25, 1000, 25]),
  generate_series(1, 10)
FROM pricing_tiers
WHERE slug = 'starter'
ON CONFLICT (tier_id, feature_key) DO NOTHING;

-- Insert default features for Professional tier
INSERT INTO tier_features (tier_id, feature_key, feature_name, feature_value, sort_order)
SELECT 
  id,
  unnest(ARRAY['emailAccounts', 'emailsStored', 'ragSearchesPerDay', 'aiQueriesPerMonth', 'storageGB', 'customLabels', 'customFolders', 'emailRules', 'contactsStored', 'attachmentSizeLimit']),
  unnest(ARRAY['Email Accounts', 'Emails Stored', 'RAG Searches/Day', 'AI Queries/Month', 'Storage (GB)', 'Custom Labels', 'Custom Folders', 'Email Rules', 'Contacts Stored', 'Attachment Size Limit (MB)']),
  unnest(ARRAY[10, 50000, -1, 2000, 50, -1, -1, -1, -1, 100]),
  generate_series(1, 10)
FROM pricing_tiers
WHERE slug = 'professional'
ON CONFLICT (tier_id, feature_key) DO NOTHING;

-- Insert default features for Enterprise tier
INSERT INTO tier_features (tier_id, feature_key, feature_name, feature_value, sort_order)
SELECT 
  id,
  unnest(ARRAY['emailAccounts', 'emailsStored', 'ragSearchesPerDay', 'aiQueriesPerMonth', 'storageGB', 'customLabels', 'customFolders', 'emailRules', 'contactsStored', 'attachmentSizeLimit']),
  unnest(ARRAY['Email Accounts', 'Emails Stored', 'RAG Searches/Day', 'AI Queries/Month', 'Storage (GB)', 'Custom Labels', 'Custom Folders', 'Email Rules', 'Contacts Stored', 'Attachment Size Limit (MB)']),
  unnest(ARRAY[-1, -1, -1, -1, -1, -1, -1, -1, -1, 500]),
  generate_series(1, 10)
FROM pricing_tiers
WHERE slug = 'enterprise'
ON CONFLICT (tier_id, feature_key) DO NOTHING;

-- Grant permissions
GRANT SELECT ON pricing_tiers TO authenticated;
GRANT SELECT ON tier_features TO authenticated;
GRANT SELECT ON discount_codes TO authenticated;

-- Row Level Security
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_redemptions ENABLE ROW LEVEL SECURITY;

-- Public can view active pricing tiers
CREATE POLICY "Anyone can view active pricing tiers"
  ON pricing_tiers FOR SELECT
  USING (is_active = true);

-- Public can view tier features
CREATE POLICY "Anyone can view tier features"
  ON tier_features FOR SELECT
  USING (true);

-- Users can view active discount codes
CREATE POLICY "Authenticated users can view active discount codes"
  ON discount_codes FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Users can view their own redemptions
CREATE POLICY "Users can view own discount redemptions"
  ON discount_redemptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE pricing_tiers IS 'Dynamic pricing tiers that can be managed from admin panel';
COMMENT ON TABLE tier_features IS 'Feature limits and settings for each pricing tier';
COMMENT ON TABLE discount_codes IS 'Discount codes and coupons for subscriptions';
COMMENT ON TABLE discount_redemptions IS 'Tracks which users redeemed which discount codes';



