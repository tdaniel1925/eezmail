const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { sql } = require('drizzle-orm');
require('dotenv').config({ path: '.env.local' });

async function addEnumValues() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    console.log('🔄 Adding "sent" and "drafts" to email_category enum...');

    // Add sent value
    await db.execute(
      sql`ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'sent'`
    );
    console.log('✅ Added "sent" value');

    // Add drafts value
    await db.execute(
      sql`ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'drafts'`
    );
    console.log('✅ Added "drafts" value');

    console.log('✅ Successfully updated email_category enum!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addEnumValues();


