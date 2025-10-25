-- Cleanup Script: Remove Duplicate Subscription Plans
-- Run this if you have duplicate plans after running the migration twice

-- ============================================================================
-- SHOW CURRENT DUPLICATES
-- ============================================================================

SELECT 
  name, 
  plan_type, 
  monthly_price, 
  COUNT(*) as duplicate_count,
  array_agg(id::text) as plan_ids
FROM subscription_plans
GROUP BY name, plan_type, monthly_price
HAVING COUNT(*) > 1;

-- ============================================================================
-- REMOVE DUPLICATES (Keep the oldest one)
-- ============================================================================

WITH duplicates AS (
  SELECT 
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name, plan_type ORDER BY created_at) as row_num
  FROM subscription_plans
)
DELETE FROM subscription_plans
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- ============================================================================
-- VERIFY CLEANUP
-- ============================================================================

SELECT 
  name, 
  plan_type, 
  monthly_price,
  sms_included,
  ai_tokens_included,
  COUNT(*) as count
FROM subscription_plans
GROUP BY name, plan_type, monthly_price, sms_included, ai_tokens_included
ORDER BY monthly_price;

-- Should now show 5 plans with count = 1 each:
-- Pay As You Go - $0
-- Basic - $29
-- Pro - $99
-- Business Starter - $99
-- Business Pro - $299

-- ============================================================================
-- ADD UNIQUE CONSTRAINT (Prevent future duplicates)
-- ============================================================================

ALTER TABLE subscription_plans 
ADD CONSTRAINT subscription_plans_name_type_key 
UNIQUE (name, plan_type);

-- ============================================================================
-- SUCCESS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Duplicate subscription plans cleaned up!';
  RAISE NOTICE '🔒 Added unique constraint to prevent future duplicates';
  RAISE NOTICE '📊 You should now have exactly 5 plans';
END $$;

