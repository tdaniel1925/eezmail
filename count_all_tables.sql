-- Count ALL tables from the 6 migrations
SELECT COUNT(*) as total_admin_tables
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    -- Migration 011: Audit Logging (1 table)
    'audit_logs',
    
    -- Migration 012: Impersonation (1 table) 
    'impersonation_sessions',
    
    -- Migration 013: E-Commerce (7 tables)
    'products', 
    'orders', 
    'order_items', 
    'carts', 
    'cart_items', 
    'customer_subscriptions', 
    'invoices',
    
    -- Migration 014: Monitoring (3 tables)
    'alert_rules', 
    'alert_events', 
    'system_metrics',
    
    -- Migration 015: Support Tickets (3 tables)
    'support_tickets', 
    'ticket_comments', 
    'ticket_tags',
    
    -- Migration 016: Knowledge Base (2 tables)
    'knowledge_base_articles', 
    'knowledge_base_categories'
  );

-- Show exactly which tables exist
SELECT '✓ ' || tablename as "Admin System Tables" 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'audit_logs', 'impersonation_sessions', 'products', 
    'orders', 'order_items', 'carts', 'cart_items', 
    'customer_subscriptions', 'invoices', 'alert_rules', 
    'alert_events', 'system_metrics', 'support_tickets', 
    'ticket_comments', 'ticket_tags', 'knowledge_base_articles', 
    'knowledge_base_categories'
  )
ORDER BY tablename;

