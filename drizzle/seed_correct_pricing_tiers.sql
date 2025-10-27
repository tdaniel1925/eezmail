-- Seed correct pricing tiers (Individual, Team, Enterprise)
-- Delete old incorrect tiers first
DELETE FROM pricing_tiers WHERE slug IN ('free', 'starter', 'professional', 'enterprise');

-- Insert Individual tier
INSERT INTO pricing_tiers (
  id,
  name,
  slug,
  description,
  price,
  interval,
  is_highlighted,
  is_custom,
  is_active,
  sort_order,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Individual',
  'individual',
  'Perfect for individual professionals',
  '15.00',
  'month',
  false,
  false,
  true,
  1,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = 'Individual',
  description = 'Perfect for individual professionals',
  price = '15.00',
  updated_at = NOW();

-- Insert Team tier
INSERT INTO pricing_tiers (
  id,
  name,
  slug,
  description,
  price,
  interval,
  is_highlighted,
  is_custom,
  is_active,
  sort_order,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Team',
  'team',
  'For growing teams and businesses',
  '35.00',
  'month',
  true,
  false,
  true,
  2,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = 'Team',
  description = 'For growing teams and businesses',
  price = '35.00',
  is_highlighted = true,
  updated_at = NOW();

-- Insert Enterprise tier
INSERT INTO pricing_tiers (
  id,
  name,
  slug,
  description,
  price,
  interval,
  is_highlighted,
  is_custom,
  is_active,
  sort_order,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Enterprise',
  'enterprise',
  'For large organizations',
  '99.00',
  'month',
  false,
  true,
  true,
  3,
  NOW(),
  NOW()
) ON CONFLICT (slug) DO UPDATE SET
  name = 'Enterprise',
  description = 'For large organizations',
  price = '99.00',
  updated_at = NOW();

-- Insert features for Individual tier
WITH individual_tier AS (
  SELECT id FROM pricing_tiers WHERE slug = 'individual'
)
INSERT INTO tier_features (
  tier_id,
  feature_key,
  feature_name,
  feature_value,
  feature_type,
  is_visible,
  sort_order
)
SELECT 
  individual_tier.id,
  'storage_gb',
  'Storage (GB)',
  10,
  'limit',
  true,
  1
FROM individual_tier
UNION ALL
SELECT
  individual_tier.id,
  'ai_queries_month',
  'AI Queries/Month',
  500,
  'limit',
  true,
  2
FROM individual_tier
UNION ALL
SELECT 
  individual_tier.id,
  'rag_searches_day',
  'RAG Searches/Day',
  100,
  'limit',
  true,
  3
FROM individual_tier
UNION ALL
SELECT 
  individual_tier.id,
  'emails_stored',
  'Emails Stored',
  10000,
  'limit',
  true,
  4
FROM individual_tier
ON CONFLICT (tier_id, feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  feature_value = EXCLUDED.feature_value,
  sort_order = EXCLUDED.sort_order;

-- Insert features for Team tier
WITH team_tier AS (
  SELECT id FROM pricing_tiers WHERE slug = 'team'
)
INSERT INTO tier_features (
  tier_id,
  feature_key,
  feature_name,
  feature_value,
  feature_type,
  is_visible,
  sort_order
)
SELECT 
  team_tier.id,
  'storage_gb',
  'Storage (GB)',
  50,
  'limit',
  true,
  1
FROM team_tier
UNION ALL
SELECT 
  team_tier.id,
  'ai_queries_month',
  'AI Queries/Month',
  2000,
  'limit',
  true,
  2
FROM team_tier
UNION ALL
SELECT 
  team_tier.id,
  'rag_searches_day',
  'RAG Searches/Day',
  999999,
  'unlimited',
  true,
  3
FROM team_tier
UNION ALL
SELECT 
  team_tier.id,
  'emails_stored',
  'Emails Stored',
  50000,
  'limit',
  true,
  4
FROM team_tier
ON CONFLICT (tier_id, feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  feature_value = EXCLUDED.feature_value,
  feature_type = EXCLUDED.feature_type,
  sort_order = EXCLUDED.sort_order;

-- Insert features for Enterprise tier
WITH enterprise_tier AS (
  SELECT id FROM pricing_tiers WHERE slug = 'enterprise'
)
INSERT INTO tier_features (
  tier_id,
  feature_key,
  feature_name,
  feature_value,
  feature_type,
  is_visible,
  sort_order
)
SELECT 
  enterprise_tier.id,
  'storage_gb',
  'Storage (GB)',
  999999,
  'unlimited',
  true,
  1
FROM enterprise_tier
UNION ALL
SELECT 
  enterprise_tier.id,
  'ai_queries_month',
  'AI Queries/Month',
  999999,
  'unlimited',
  true,
  2
FROM enterprise_tier
UNION ALL
SELECT 
  enterprise_tier.id,
  'rag_searches_day',
  'RAG Searches/Day',
  999999,
  'unlimited',
  true,
  3
FROM enterprise_tier
UNION ALL
SELECT 
  enterprise_tier.id,
  'emails_stored',
  'Emails Stored',
  999999,
  'unlimited',
  true,
  4
FROM enterprise_tier
ON CONFLICT (tier_id, feature_key) DO UPDATE SET
  feature_name = EXCLUDED.feature_name,
  feature_value = EXCLUDED.feature_value,
  feature_type = EXCLUDED.feature_type,
  sort_order = EXCLUDED.sort_order;

