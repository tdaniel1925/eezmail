-- Query to check applied migrations
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 10;

