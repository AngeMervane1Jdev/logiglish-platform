-- ============================================
-- DIAGNOSE TRIGGER ISSUE
-- ============================================
-- This will help identify why the trigger is failing
-- ============================================

-- Check 1: Does profiles table exist?
SELECT
  'Profiles Table Check' as check_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✓ profiles table exists'
    ELSE '✗ profiles table does NOT exist'
  END as result
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check 2: What columns does profiles table have?
SELECT
  '=== Profiles Table Columns ===' as info;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 3: Does the trigger function exist and what's its definition?
SELECT
  'Trigger Function Check' as check_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✓ handle_new_user function exists'
    ELSE '✗ handle_new_user function does NOT exist'
  END as result
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 4: View the actual trigger function code
SELECT
  '=== Trigger Function Definition ===' as info;
SELECT
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check 5: Is the trigger actually attached?
SELECT
  'Trigger Attachment Check' as check_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✓ on_auth_user_created trigger is attached to auth.users'
    ELSE '✗ Trigger is NOT attached to auth.users'
  END as result
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- Check 6: List ALL triggers on auth.users
SELECT
  '=== All Triggers on auth.users ===' as info;
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
ORDER BY trigger_name;

-- Check 7: Check RLS on profiles table
SELECT
  'RLS Check' as check_name,
  CASE
    WHEN rowsecurity = true THEN '✓ RLS is enabled on profiles'
    ELSE '✗ RLS is NOT enabled on profiles'
  END as result
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Check 8: Test if we can manually insert into profiles (as service role)
-- This simulates what the trigger does
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Try to insert a test profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, subscription_plan)
    VALUES (
      test_id,
      'test@example.com',
      'Test User',
      'student',
      'basic'
    );

    RAISE NOTICE '✓ Successfully inserted test profile (id: %)', test_id;

    -- Clean up the test
    DELETE FROM public.profiles WHERE id = test_id;
    RAISE NOTICE '✓ Test profile deleted';

  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✗ Failed to insert test profile: %', SQLERRM;
  END;
END $$;

-- Check 9: Check if there are any constraints that might be failing
SELECT
  '=== Profiles Table Constraints ===' as info;
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY contype, conname;

-- ============================================
-- RECOMMENDATIONS
-- ============================================
SELECT '=== RECOMMENDATIONS ===' as info;
SELECT
  CASE
    -- If profiles table doesn't exist
    WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') = 0
    THEN '⚠ CRITICAL: Run COMPLETE_DATABASE_SETUP.sql - profiles table is missing!'

    -- If trigger function doesn't exist
    WHEN (SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user') = 0
    THEN '⚠ CRITICAL: Run COMPLETE_DATABASE_SETUP.sql - trigger function is missing!'

    -- If trigger is not attached
    WHEN (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'auth' AND event_object_table = 'users' AND trigger_name = 'on_auth_user_created') = 0
    THEN '⚠ CRITICAL: Trigger exists but is not attached to auth.users table!'

    ELSE '✓ Basic setup looks good. Check the test insert result above for details.'
  END as recommendation;
