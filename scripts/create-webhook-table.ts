import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';

async function runMigration() {
  try {
    const sql = postgres(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    const migration = readFileSync(
      'migrations/add_webhook_subscriptions_only.sql',
      'utf8'
    );

    await sql.unsafe(migration);

    console.log('✅ Webhook subscriptions table created successfully!');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
