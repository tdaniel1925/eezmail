# Contact Groups & Tags - Database Setup Required

## Issue

Getting 500 errors when trying to create groups or tags:

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
/api/contacts/groups
/api/contacts/tags
```

## Root Cause

The database tables for contact groups and tags haven't been created yet.

## Solution: Run Migration

### Quick Fix (Copy & Paste into Supabase SQL Editor)

**Step 1:** Open Supabase Dashboard → SQL Editor

**Step 2:** Copy and paste this entire script:

```sql
-- =====================================================
-- CONTACT GROUPS & TAGS MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CONTACT GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_groups
CREATE INDEX IF NOT EXISTS idx_contact_groups_user_id ON contact_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_groups_name ON contact_groups(name);
CREATE INDEX IF NOT EXISTS idx_contact_groups_is_favorite ON contact_groups(is_favorite);

-- Unique constraint: user can't have duplicate group names (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_groups_user_name ON contact_groups(user_id, LOWER(name));

-- =====================================================
-- 2. CONTACT GROUP MEMBERS TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_group_members
CREATE INDEX IF NOT EXISTS idx_contact_group_members_group_id ON contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_contact_id ON contact_group_members(contact_id);

-- Unique constraint: prevent duplicate memberships
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_group_members_unique ON contact_group_members(group_id, contact_id);

-- =====================================================
-- 3. CONTACT TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_tags
CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id ON contact_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_name ON contact_tags(name);

-- Unique constraint: user can't have duplicate tag names (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_tags_user_name ON contact_tags(user_id, LOWER(name));

-- =====================================================
-- 4. CONTACT TAG ASSIGNMENTS TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id UUID NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contact_tag_assignments
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag_id ON contact_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact_id ON contact_tag_assignments(contact_id);

-- Unique constraint: prevent duplicate tag assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_tag_assignments_unique ON contact_tag_assignments(tag_id, contact_id);

-- =====================================================
-- 5. UPDATE TRIGGERS
-- =====================================================

-- Trigger function for contact_groups
CREATE OR REPLACE FUNCTION update_contact_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_groups_updated_at
  BEFORE UPDATE ON contact_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_groups_updated_at();

-- Trigger function for contact_tags
CREATE OR REPLACE FUNCTION update_contact_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_tags_updated_at
  BEFORE UPDATE ON contact_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_tags_updated_at();

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;

-- contact_groups policies
CREATE POLICY "Users can view their own groups"
  ON contact_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups"
  ON contact_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
  ON contact_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
  ON contact_groups FOR DELETE
  USING (auth.uid() = user_id);

-- contact_group_members policies
CREATE POLICY "Users can view group members of their groups"
  ON contact_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contact_group_members.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add members to their groups"
  ON contact_group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contact_group_members.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove members from their groups"
  ON contact_group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = contact_group_members.group_id
      AND contact_groups.user_id = auth.uid()
    )
  );

-- contact_tags policies
CREATE POLICY "Users can view their own tags"
  ON contact_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON contact_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON contact_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON contact_tags FOR DELETE
  USING (auth.uid() = user_id);

-- contact_tag_assignments policies
CREATE POLICY "Users can view tag assignments for their tags"
  ON contact_tag_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contact_tags
      WHERE contact_tags.id = contact_tag_assignments.tag_id
      AND contact_tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tag assignments for their tags"
  ON contact_tag_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_tags
      WHERE contact_tags.id = contact_tag_assignments.tag_id
      AND contact_tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tag assignments for their tags"
  ON contact_tag_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contact_tags
      WHERE contact_tags.id = contact_tag_assignments.tag_id
      AND contact_tags.user_id = auth.uid()
    )
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Contact Groups & Tags tables created successfully!';
  RAISE NOTICE 'Tables: contact_groups, contact_group_members, contact_tags, contact_tag_assignments';
  RAISE NOTICE 'You can now create groups and tags!';
END $$;
```

**Step 3:** Click "Run" or press `Ctrl+Enter`

**Step 4:** Verify success - You should see:

```
✅ Contact Groups & Tags tables created successfully!
```

**Step 5:** Refresh your app and try creating a group again!

---

## Alternative: Using Migration File

If you prefer to use the migration file:

```bash
# The migration file is located at:
migrations/20251023000000_add_contact_groups_tags.sql

# Copy its contents and run in Supabase SQL Editor
```

---

## Verification

After running the migration, verify the tables exist:

```sql
-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'contact_groups',
  'contact_group_members',
  'contact_tags',
  'contact_tag_assignments'
);
```

You should see all 4 tables listed.

---

## Status After Migration

✅ **contact_groups** - Store group information  
✅ **contact_group_members** - Link contacts to groups  
✅ **contact_tags** - Store tag information  
✅ **contact_tag_assignments** - Link contacts to tags  
✅ **RLS Policies** - Secure data access  
✅ **Triggers** - Auto-update timestamps  
✅ **Indexes** - Optimize queries

---

## What This Enables

Once the migration is complete, you'll be able to:

1. **Create Groups** ✅
   - Organize contacts into groups
   - Assign colors to groups
   - Mark favorite groups

2. **Create Tags** ✅
   - Label contacts with tags
   - Filter by tags
   - Multiple tags per contact

3. **Manage Members** ✅
   - Add/remove contacts from groups
   - Bulk operations
   - Group email distribution

4. **Email to Groups** ✅
   - Select group as recipient
   - Expands to all member emails
   - Quick mass emailing

---

_Last Updated: October 22, 2025_  
_Migration Required: ✅ YES_  
_Estimated Time: 30 seconds_

