-- =====================================================
-- VERIFY ALL MIGRATIONS COMPLETE
-- Run this in Supabase SQL Editor to check tables
-- =====================================================

-- Check all expected tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  -- Migration 011: Audit Logging
  'audit_logs',
  'audit_retention_policies',
  
  -- Migration 012: Impersonation
  'impersonation_sessions',
  
  -- Migration 013: E-Commerce
  'products',
  'orders',
  'order_items',
  'carts',
  'cart_items',
  'customer_subscriptions',
  'invoices',
  
  -- Migration 014: Monitoring
  'alert_rules',
  'alert_events',
  'system_metrics',
  
  -- Migration 015: Support Tickets
  'support_tickets',
  'ticket_comments',
  'ticket_tags',
  
  -- Migration 016: Knowledge Base
  'knowledge_base_articles',
  'knowledge_base_categories'
)
ORDER BY tablename;

-- This should return 18 tables
-- If you're missing any, note which ones and let me know

-- Count the tables
SELECT 
  'Total Tables Created' as description,
  COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'audit_logs',
  'audit_retention_policies',
  'impersonation_sessions',
  'products',
  'orders',
  'order_items',
  'carts',
  'cart_items',
  'customer_subscriptions',
  'invoices',
  'alert_rules',
  'alert_events',
  'system_metrics',
  'support_tickets',
  'ticket_comments',
  'ticket_tags',
  'knowledge_base_articles',
  'knowledge_base_categories'
);

-- Expected: 18 tables
-- If you see less, check which ones are missing in the first query

