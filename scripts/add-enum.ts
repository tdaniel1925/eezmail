import { sql } from 'drizzle-orm';
import { db } from './src/lib/db';

async function addEnumValues() {
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
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addEnumValues();


