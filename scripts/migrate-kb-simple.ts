import * as dotenv from 'dotenv';
import * as path from 'path';
import postgres from 'postgres';

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment');
  console.error('Make sure .env.local exists with DATABASE_URL set');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function migrateKBTables() {
  console.log('🚀 Starting Knowledge Base tables migration...');

  try {
    // Knowledge Base Categories Table
    console.log('Creating kb_categories table...');
    await sql`
      CREATE TABLE IF NOT EXISTS kb_categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        description text,
        parent_id uuid,
        icon varchar(50),
        sort_order integer DEFAULT 0,
        is_visible boolean DEFAULT true NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ kb_categories table created');

    // Knowledge Base Articles Table
    console.log('Creating kb_articles table...');
    await sql`
      CREATE TABLE IF NOT EXISTS kb_articles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        title text NOT NULL,
        slug text NOT NULL UNIQUE,
        content text NOT NULL,
        excerpt text,
        category_id uuid,
        tags text[] DEFAULT '{}',
        author_id uuid,
        status varchar(20) DEFAULT 'draft',
        visibility varchar(20) DEFAULT 'public',
        helpful_count integer DEFAULT 0,
        not_helpful_count integer DEFAULT 0,
        views integer DEFAULT 0,
        featured boolean DEFAULT false,
        seo_title text,
        seo_description text,
        seo_keywords text[],
        published_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ kb_articles table created');

    // Add foreign key constraints
    console.log('Adding foreign key constraints...');

    await sql`
      DO $$ BEGIN
        ALTER TABLE kb_articles ADD CONSTRAINT kb_articles_category_id_fk 
        FOREIGN KEY (category_id) REFERENCES kb_categories(id) ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        ALTER TABLE kb_articles ADD CONSTRAINT kb_articles_author_id_fk 
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        ALTER TABLE kb_categories ADD CONSTRAINT kb_categories_parent_id_fk 
        FOREIGN KEY (parent_id) REFERENCES kb_categories(id) ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    console.log('✅ Foreign key constraints added');

    // Create indexes
    console.log('Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS idx_kb_articles_category_id ON kb_articles(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kb_articles_author_id ON kb_articles(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON kb_articles(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kb_articles_slug ON kb_articles(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kb_categories_slug ON kb_categories(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_kb_categories_parent_id ON kb_categories(parent_id)`;

    console.log('✅ Indexes created');
    console.log('🎉 Migration completed successfully!');

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
}

migrateKBTables();
