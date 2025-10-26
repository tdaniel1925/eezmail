-- Fix Knowledge Base table names to match schema expectations
-- Run this in Supabase SQL Editor

-- Rename kb_categories to knowledge_base_categories
ALTER TABLE IF EXISTS kb_categories 
RENAME TO knowledge_base_categories;

-- Rename kb_articles to knowledge_base_articles
ALTER TABLE IF EXISTS kb_articles 
RENAME TO knowledge_base_articles;

-- Verify the tables exist and count all admin tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('knowledge_base_categories', 'knowledge_base_articles')
ORDER BY tablename;

-- Final count - should be 17 tables
SELECT COUNT(*) as total_admin_tables
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'audit_logs', 'impersonation_sessions', 'products', 
    'orders', 'order_items', 'carts', 'cart_items', 
    'customer_subscriptions', 'invoices', 'alert_rules', 
    'alert_events', 'system_metrics', 'support_tickets', 
    'ticket_comments', 'ticket_tags', 
    'knowledge_base_articles', 'knowledge_base_categories'
  );

