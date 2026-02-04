-- ============================================
-- VERIFY DATABASE SETUP
-- ============================================
-- Run this to check if your database is set up correctly
-- and identify any issues
-- ============================================

-- Check 1: Verify all tables exist
SELECT
  'Tables Check' as check_name,
  CASE
    WHEN COUNT(*) = 7 THEN '✓ PASS - All 7 tables exist'
    ELSE '✗ FAIL - Expected 7 tables, found ' || COUNT(*)::text
  END as result
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'topics',
    'bookings',
    'topic_materials',
    'student_submissions',
    'messages',
    'admin_registration_requests'
  );

-- Check 2: Verify triggers exist
SELECT
  'Triggers Check' as check_name,
  CASE
    WHEN COUNT(*) >= 5 THEN '✓ PASS - All triggers exist'
    ELSE '✗ FAIL - Some triggers missing'
  END as result
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'on_profile_updated',
    'on_booking_updated',
    'on_topic_updated',
    'on_topic_material_updated'
  );

-- Check 3: Verify RLS is enabled
SELECT
  'RLS Check' as check_name,
  CASE
    WHEN COUNT(*) = 7 THEN '✓ PASS - RLS enabled on all tables'
    ELSE '✗ FAIL - RLS not enabled on all tables'
  END as result
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'topics',
    'bookings',
    'topic_materials',
    'student_submissions',
    'messages',
    'admin_registration_requests'
  )
  AND rowsecurity = true;

-- Check 4: Verify policies exist
SELECT
  'RLS Policies Check' as check_name,
  CASE
    WHEN COUNT(*) >= 20 THEN '✓ PASS - ' || COUNT(*)::text || ' policies created'
    ELSE '✗ FAIL - Expected at least 20 policies, found ' || COUNT(*)::text
  END as result
FROM pg_policies
WHERE schemaname = 'public';

-- Check 5: Verify handle_new_user function exists
SELECT
  'New User Function Check' as check_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✓ PASS - handle_new_user function exists'
    ELSE '✗ FAIL - handle_new_user function not found'
  END as result
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 6: Verify profiles table structure
SELECT
  'Profiles Table Structure' as check_name,
  CASE
    WHEN COUNT(*) = 7 THEN '✓ PASS - All profile columns exist'
    ELSE '✗ FAIL - Expected 7 columns, found ' || COUNT(*)::text
  END as result
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'email', 'full_name', 'role', 'subscription_plan', 'created_at', 'updated_at');

-- ============================================
-- Detailed Information
-- ============================================

-- List all tables with row counts
SELECT
  '=== TABLE ROW COUNTS ===' as info;
SELECT
  tablename,
  schemaname,
  CASE
    WHEN tablename = 'profiles' THEN (SELECT COUNT(*)::text FROM profiles)
    WHEN tablename = 'bookings' THEN (SELECT COUNT(*)::text FROM bookings)
    WHEN tablename = 'topics' THEN (SELECT COUNT(*)::text FROM topics)
    WHEN tablename = 'messages' THEN (SELECT COUNT(*)::text FROM messages)
    WHEN tablename = 'admin_registration_requests' THEN (SELECT COUNT(*)::text FROM admin_registration_requests)
    ELSE '0'
  END as row_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'bookings', 'topics', 'messages', 'admin_registration_requests')
ORDER BY tablename;

-- List all triggers
SELECT
  '=== TRIGGERS ===' as info;
SELECT
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- List all RLS policies
SELECT
  '=== RLS POLICIES ===' as info;
SELECT
  tablename,
  policyname,
  cmd as command,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- Test the trigger (if you want to)
-- ============================================
-- Uncomment these lines to test if the trigger works:
--
-- DO $$
-- DECLARE
--   test_user_id UUID;
-- BEGIN
--   -- This will fail if the auth.users insert is restricted
--   -- You can run this to test if the trigger is working
--   RAISE NOTICE 'Trigger test: The handle_new_user function exists and should auto-create profiles';
-- END $$;

-- ============================================
-- RECOMMENDATIONS
-- ============================================
SELECT '=== RECOMMENDATIONS ===' as info;
SELECT
  CASE
    WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user') = 0
    THEN '⚠ Run COMPLETE_DATABASE_SETUP.sql to create the handle_new_user function'
    WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') = 0
    THEN '⚠ Run COMPLETE_DATABASE_SETUP.sql to create the on_auth_user_created trigger'
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') < 20
    THEN '⚠ Run COMPLETE_DATABASE_SETUP.sql to create all RLS policies'
    ELSE '✓ Database setup looks good! You should be able to sign up users.'
  END as recommendation;

-- Check Supabase Auth Settings
SELECT '=== AUTH CONFIGURATION ===' as info;
SELECT
  'Check your Supabase Dashboard → Authentication → Settings:

  Required Settings:
  - Enable Email Signup: ON
  - Confirm Email: OFF (for development) or ON (for production with email configured)
  - Enable Email Provider: ON

  If "Confirm Email" is ON and you do not have email configured,
  users will not be able to sign up because they cannot confirm their email.
  ' as auth_settings_reminder;
