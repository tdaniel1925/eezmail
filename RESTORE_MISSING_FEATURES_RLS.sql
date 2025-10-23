-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
-- ============================================================================
-- This migration adds RLS policies for tables created in RESTORE_MISSING_FEATURES.sql
-- Run this in Supabase SQL Editor after the main restoration migration
-- Date: Current Session
-- ============================================================================

-- ============================================================================
-- PART 1: ENABLE RLS ON NEW TABLES
-- ============================================================================

-- Enable RLS on embedding_queue
ALTER TABLE embedding_queue ENABLE ROW LEVEL SECURITY;

-- Enable RLS on contact_timeline_queue
ALTER TABLE contact_timeline_queue ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_ai_profiles
ALTER TABLE user_ai_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: CREATE POLICIES FOR EMBEDDING_QUEUE
-- ============================================================================

-- Users can select their own embedding queue items
CREATE POLICY "Users can view own embedding queue"
ON embedding_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own embedding queue items
CREATE POLICY "Users can insert own embedding queue"
ON embedding_queue
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own embedding queue items
CREATE POLICY "Users can update own embedding queue"
ON embedding_queue
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own embedding queue items
CREATE POLICY "Users can delete own embedding queue"
ON embedding_queue
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- PART 3: CREATE POLICIES FOR CONTACT_TIMELINE_QUEUE
-- ============================================================================

-- Users can select their own timeline queue items
CREATE POLICY "Users can view own timeline queue"
ON contact_timeline_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own timeline queue items
CREATE POLICY "Users can insert own timeline queue"
ON contact_timeline_queue
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own timeline queue items
CREATE POLICY "Users can update own timeline queue"
ON contact_timeline_queue
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own timeline queue items
CREATE POLICY "Users can delete own timeline queue"
ON contact_timeline_queue
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- PART 4: CREATE POLICIES FOR USER_AI_PROFILES
-- ============================================================================

-- Users can select their own AI profile
CREATE POLICY "Users can view own AI profile"
ON user_ai_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own AI profile
CREATE POLICY "Users can insert own AI profile"
ON user_ai_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own AI profile
CREATE POLICY "Users can update own AI profile"
ON user_ai_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own AI profile
CREATE POLICY "Users can delete own AI profile"
ON user_ai_profiles
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- PART 5: ADD PERFORMANCE INDEXES
-- ============================================================================

-- Index for faster queue processing (status + priority ordering)
CREATE INDEX IF NOT EXISTS embedding_queue_processing_idx 
ON embedding_queue(user_id, status, priority DESC, created_at ASC);

-- Index for timeline queue processing
CREATE INDEX IF NOT EXISTS timeline_queue_processing_idx 
ON contact_timeline_queue(user_id, status, created_at ASC);

-- Index for failed items that need retry
CREATE INDEX IF NOT EXISTS embedding_queue_failed_idx 
ON embedding_queue(status, last_attempt_at) 
WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS timeline_queue_failed_idx 
ON contact_timeline_queue(status, last_attempt_at) 
WHERE status = 'failed';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================================';
  RAISE NOTICE 'RLS POLICIES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '==============================================================';
  RAISE NOTICE 'Security Improvements:';
  RAISE NOTICE '  ✅ RLS enabled on embedding_queue';
  RAISE NOTICE '  ✅ RLS enabled on contact_timeline_queue';
  RAISE NOTICE '  ✅ RLS enabled on user_ai_profiles';
  RAISE NOTICE '';
  RAISE NOTICE 'Performance Improvements:';
  RAISE NOTICE '  ✅ Added composite indexes for queue processing';
  RAISE NOTICE '  ✅ Added indexes for failed item retry';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Status:';
  RAISE NOTICE '  ✅ Users can only access their own data';
  RAISE NOTICE '  ✅ All CRUD operations protected';
  RAISE NOTICE '==============================================================';
END $$;


