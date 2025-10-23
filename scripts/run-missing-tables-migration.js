require('dotenv').config({ path: '.env.local' });
const { readFileSync } = require('fs');
const postgres = require('postgres');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    console.log('📖 Reading migration file...');
    const migrationSQL = readFileSync('migrations/add_missing_core_tables.sql', 'utf8');
    
    console.log('🚀 Running missing tables migration...');
    console.log('This will create 13 missing tables:');
    console.log('  - tasks');
    console.log('  - email_drafts');
    console.log('  - scheduled_emails');
    console.log('  - email_rules');
    console.log('  - email_signatures');
    console.log('  - ai_reply_drafts');
    console.log('  - chatbot_actions');
    console.log('  - extracted_actions');
    console.log('  - follow_up_reminders');
    console.log('  - email_templates');
    console.log('  - custom_labels');
    console.log('  - label_assignments');
    console.log('  - user_preferences');
    console.log('');
    
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Missing tables migration completed successfully!');
    console.log('');
    console.log('📊 Verifying tables...');
    
    // Verify tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'tasks', 'email_drafts', 'scheduled_emails', 
        'email_rules', 'email_signatures', 'ai_reply_drafts',
        'chatbot_actions', 'extracted_actions', 'follow_up_reminders',
        'email_templates', 'custom_labels', 'label_assignments',
        'user_preferences'
      )
      ORDER BY table_name
    `;
    
    console.log(`✅ Verified ${tables.length}/13 tables created:`);
    tables.forEach(t => console.log(`   ✓ ${t.table_name}`));
    
    if (tables.length < 13) {
      console.warn('\n⚠️  Warning: Some tables may not have been created');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();

