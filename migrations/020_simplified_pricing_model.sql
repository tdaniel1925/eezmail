-- ============================================================================
-- SIMPLIFIED PRICING MODEL MIGRATION
-- ============================================================================
-- Converts from feature-limited tiers (free/starter/pro/enterprise) to 
-- seat-based pricing (individual/team/enterprise)
--
-- New Model:
-- - Individual: $45/month (1 user, everything unlimited)
-- - Team: $35/user/month (5+ users, volume pricing)
-- - Enterprise: $25/user/month (6+ users, best value)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. UPDATE ENUM: subscription_tier
-- ============================================================================
-- PostgreSQL doesn't allow direct ALTER TYPE, so we need to:
-- 1. Create new enum
-- 2. Migrate data
-- 3. Drop old enum
-- 4. Rename new enum

-- Create new subscription tier enum
CREATE TYPE subscription_tier_new AS ENUM ('individual', 'team', 'enterprise');

-- ============================================================================
-- 2. ADD NEW COLUMNS TO subscriptions TABLE
-- ============================================================================
ALTER TABLE subscriptions
  ADD COLUMN seats INTEGER DEFAULT 1 NOT NULL,
  ADD COLUMN price_per_seat DECIMAL(10, 2),
  ADD COLUMN total_amount DECIMAL(10, 2);

-- ============================================================================
-- 3. MIGRATE EXISTING SUBSCRIPTIONS (BEFORE ENUM CHANGE)
-- ============================================================================
-- Set default values for new columns first (while old enum still exists)
UPDATE subscriptions SET
  seats = 1,
  price_per_seat = CASE 
    WHEN tier::text = 'free' THEN 0.00
    WHEN tier::text = 'starter' THEN 45.00
    WHEN tier::text = 'pro' THEN 45.00
    WHEN tier::text = 'team' THEN 35.00
    WHEN tier::text = 'enterprise' THEN 25.00
    ELSE 45.00
  END,
  total_amount = CASE 
    WHEN tier::text = 'free' THEN 0.00
    WHEN tier::text = 'starter' THEN 45.00
    WHEN tier::text = 'pro' THEN 45.00
    WHEN tier::text = 'team' THEN 175.00
    WHEN tier::text = 'enterprise' THEN 150.00
    ELSE 45.00
  END;

-- Make price columns NOT NULL after setting values
ALTER TABLE subscriptions
  ALTER COLUMN price_per_seat SET NOT NULL,
  ALTER COLUMN total_amount SET NOT NULL;

-- ============================================================================
-- 4. UPDATE users TABLE: Change default tier (BEFORE ENUM CHANGE)
-- ============================================================================
-- Alter column using text casting (temporarily nullable to allow conversion)
ALTER TABLE users
  ALTER COLUMN subscription_tier DROP DEFAULT;

-- Add temporary column with new enum
ALTER TABLE users
  ADD COLUMN subscription_tier_new subscription_tier_new;

-- Migrate user tier data using text casting
UPDATE users SET
  subscription_tier_new = CASE 
    WHEN subscription_tier::text = 'free' THEN 'individual'::subscription_tier_new
    WHEN subscription_tier::text = 'pro' THEN 'individual'::subscription_tier_new
    WHEN subscription_tier::text = 'starter' THEN 'individual'::subscription_tier_new
    WHEN subscription_tier::text = 'team' THEN 'team'::subscription_tier_new
    WHEN subscription_tier::text = 'enterprise' THEN 'enterprise'::subscription_tier_new
    ELSE 'individual'::subscription_tier_new
  END;

-- Drop old column and rename new one
ALTER TABLE users
  DROP COLUMN subscription_tier,
  ALTER COLUMN subscription_tier_new SET NOT NULL,
  ALTER COLUMN subscription_tier_new SET DEFAULT 'individual'::subscription_tier_new;

ALTER TABLE users
  RENAME COLUMN subscription_tier_new TO subscription_tier;

-- ============================================================================
-- 5. UPDATE subscriptions TABLE: Change tier column type (BEFORE ENUM CHANGE)
-- ============================================================================
-- Add temporary column with new enum
ALTER TABLE subscriptions
  ADD COLUMN tier_new subscription_tier_new;

-- Migrate subscription tier data using text casting
UPDATE subscriptions SET
  tier_new = CASE 
    WHEN tier::text = 'free' THEN 'individual'::subscription_tier_new
    WHEN tier::text = 'pro' THEN 'individual'::subscription_tier_new
    WHEN tier::text = 'starter' THEN 'individual'::subscription_tier_new
    WHEN tier::text = 'team' THEN 'team'::subscription_tier_new
    WHEN tier::text = 'enterprise' THEN 'enterprise'::subscription_tier_new
    ELSE 'individual'::subscription_tier_new
  END;

-- Drop old column and rename new one
ALTER TABLE subscriptions
  DROP COLUMN tier,
  ALTER COLUMN tier_new SET NOT NULL;

ALTER TABLE subscriptions
  RENAME COLUMN tier_new TO tier;

-- ============================================================================
-- 6. DROP OLD ENUM AND RENAME NEW ONE
-- ============================================================================
DROP TYPE subscription_tier;
ALTER TYPE subscription_tier_new RENAME TO subscription_tier;

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate subscription cost based on plan and seats
CREATE OR REPLACE FUNCTION calculate_subscription_cost(
  plan_tier subscription_tier,
  seat_count INTEGER
) RETURNS DECIMAL(10, 2) AS $$
BEGIN
  CASE plan_tier
    WHEN 'individual' THEN
      RETURN 45.00;
    WHEN 'team' THEN
      RETURN GREATEST(seat_count, 5) * 35.00;
    WHEN 'enterprise' THEN
      RETURN GREATEST(seat_count, 6) * 25.00;
    ELSE
      RETURN 0.00;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate seat count for a plan
CREATE OR REPLACE FUNCTION validate_seat_count(
  plan_tier subscription_tier,
  seat_count INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  CASE plan_tier
    WHEN 'individual' THEN
      RETURN seat_count = 1;
    WHEN 'team' THEN
      RETURN seat_count >= 5;
    WHEN 'enterprise' THEN
      RETURN seat_count >= 6;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to enforce valid seat counts
ALTER TABLE subscriptions
  ADD CONSTRAINT valid_seat_count 
  CHECK (validate_seat_count(tier, seats));

-- ============================================================================
-- 8. CREATE AUDIT LOG ENTRY
-- ============================================================================
INSERT INTO audit_logs (
  actor_id,
  actor_type,
  action,
  resource_type,
  resource_id,
  ip_address,
  user_agent,
  metadata
) VALUES (
  NULL,
  'system',
  'system.migration',
  'pricing_model',
  gen_random_uuid(),
  '127.0.0.1',
  'PostgreSQL Migration',
  jsonb_build_object(
    'migration', '020_simplified_pricing_model',
    'description', 'Migrated from feature-limited tiers to seat-based pricing',
    'timestamp', NOW()
  )
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (Run these manually after migration)
-- ============================================================================
-- Check tier distribution
-- SELECT subscription_tier, COUNT(*) FROM users GROUP BY subscription_tier;

-- Check subscription data
-- SELECT tier, seats, price_per_seat, total_amount, COUNT(*) 
-- FROM subscriptions 
-- GROUP BY tier, seats, price_per_seat, total_amount;

-- Verify seat count constraints
-- SELECT tier, seats, validate_seat_count(tier, seats) as is_valid
-- FROM subscriptions;

