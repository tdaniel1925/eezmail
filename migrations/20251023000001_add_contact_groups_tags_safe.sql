-- ============================================================================
-- Contact Groups and Tags Migration - SAFE VERSION
-- ============================================================================
-- This version includes IF NOT EXISTS checks to allow re-running safely
-- ============================================================================

-- ============================================================================
-- CONTACT GROUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for contact_groups
CREATE INDEX IF NOT EXISTS idx_contact_groups_user_id ON contact_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_groups_name ON contact_groups(name);
CREATE INDEX IF NOT EXISTS idx_contact_groups_is_favorite ON contact_groups(is_favorite);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_groups_user_name ON contact_groups(user_id, LOWER(name));

-- ============================================================================
-- CONTACT GROUP MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_group_members_group_id ON contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_contact_id ON contact_group_members(contact_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_group_members_unique ON contact_group_members(group_id, contact_id);

-- ============================================================================
-- CONTACT TAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#10B981',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_tags_user_id ON contact_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_tags_name ON contact_tags(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_tags_user_name ON contact_tags(user_id, LOWER(name));

-- ============================================================================
-- CONTACT TAG ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_contact_id ON contact_tag_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_tag_assignments_tag_id ON contact_tag_assignments(tag_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_tag_assignments_unique ON contact_tag_assignments(contact_id, tag_id);

-- ============================================================================
-- UPDATE TRIGGER FOR contact_groups (SAFE)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_contact_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_contact_groups_updated_at ON contact_groups;

CREATE TRIGGER trigger_update_contact_groups_updated_at
  BEFORE UPDATE ON contact_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_groups_updated_at();

-- ============================================================================
-- RLS POLICIES (SAFE - Drop and recreate)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can create their own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can update their own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users can delete their own groups" ON contact_groups;

DROP POLICY IF EXISTS "Users can view members of their groups" ON contact_group_members;
DROP POLICY IF EXISTS "Users can add members to their groups" ON contact_group_members;
DROP POLICY IF EXISTS "Users can remove members from their groups" ON contact_group_members;

DROP POLICY IF EXISTS "Users can view their own tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON contact_tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON contact_tags;

DROP POLICY IF EXISTS "Users can view tag assignments for their contacts" ON contact_tag_assignments;
DROP POLICY IF EXISTS "Users can assign tags to their contacts" ON contact_tag_assignments;
DROP POLICY IF EXISTS "Users can remove tag assignments from their contacts" ON contact_tag_assignments;

-- Create policies
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
CREATE POLICY "Users can view members of their groups"
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
CREATE POLICY "Users can view tag assignments for their contacts"
  ON contact_tag_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tag_assignments.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can assign tags to their contacts"
  ON contact_tag_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tag_assignments.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tag assignments from their contacts"
  ON contact_tag_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_tag_assignments.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VIEWS (SAFE - Drop and recreate)
-- ============================================================================

DROP VIEW IF EXISTS contact_groups_with_counts;
DROP VIEW IF EXISTS contacts_with_groups_and_tags;

-- View: Contact groups with member counts
CREATE OR REPLACE VIEW contact_groups_with_counts AS
SELECT 
  cg.*,
  COUNT(cgm.id) as member_count
FROM contact_groups cg
LEFT JOIN contact_group_members cgm ON cg.id = cgm.group_id
GROUP BY cg.id;

-- View: Contacts with their groups and tags
CREATE OR REPLACE VIEW contacts_with_groups_and_tags AS
SELECT 
  c.*,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', cg.id,
      'name', cg.name,
      'color', cg.color
    )) FILTER (WHERE cg.id IS NOT NULL),
    '[]'
  ) as groups,
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', ct.id,
      'name', ct.name,
      'color', ct.color
    )) FILTER (WHERE ct.id IS NOT NULL),
    '[]'
  ) as tags
FROM contacts c
LEFT JOIN contact_group_members cgm ON c.id = cgm.contact_id
LEFT JOIN contact_groups cg ON cgm.group_id = cg.id
LEFT JOIN contact_tag_assignments cta ON c.id = cta.contact_id
LEFT JOIN contact_tags ct ON cta.tag_id = ct.id
GROUP BY c.id;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Contact Groups and Tags migration completed successfully!';
  RAISE NOTICE 'Tables: contact_groups, contact_group_members, contact_tags, contact_tag_assignments';
  RAISE NOTICE 'Views: contact_groups_with_counts, contacts_with_groups_and_tags';
  RAISE NOTICE 'Safe to run multiple times!';
END $$;


