-- Check which of the 17 expected tables are present
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'audit_logs', 
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
  )
ORDER BY tablename;

-- Show which ones are missing
SELECT expected_table
FROM (VALUES 
    ('audit_logs'), 
    ('impersonation_sessions'), 
    ('products'), 
    ('orders'), 
    ('order_items'), 
    ('carts'), 
    ('cart_items'), 
    ('customer_subscriptions'), 
    ('invoices'), 
    ('alert_rules'), 
    ('alert_events'), 
    ('system_metrics'), 
    ('support_tickets'), 
    ('ticket_comments'), 
    ('ticket_tags'), 
    ('knowledge_base_articles'), 
    ('knowledge_base_categories')
) AS expected(expected_table)
WHERE expected_table NOT IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
)
ORDER BY expected_table;

