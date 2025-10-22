// Quick script to add 'sent' and 'drafts' to email_category enum
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

async function addEnumValues() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log('🔄 Adding "sent" and "drafts" to email_category enum...');

    // Add enum values
    await sql`ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'sent'`;
    console.log('✅ Added "sent" value');

    await sql`ALTER TYPE email_category ADD VALUE IF NOT EXISTS 'drafts'`;
    console.log('✅ Added "drafts" value');

    console.log('✅ Successfully updated email_category enum!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addEnumValues();


