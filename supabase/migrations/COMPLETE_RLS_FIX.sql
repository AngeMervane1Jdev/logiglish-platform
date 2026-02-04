-- ============================================
-- COMPLETE RLS FIX FOR PROFILES
-- ============================================
-- Fixes profile loading and admin role issues
-- ============================================

-- Step 1: Check current state
SELECT '=== CURRENT PROFILES ===' as info;
SELECT
  id,
  email,
  full_name,
  role,
  subscription_plan,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Step 2: Force update admin accounts to have admin role
UPDATE profiles
SET role = 'admin'
WHERE email IN (
  SELECT email
  FROM admin_registration_requests
  WHERE is_verified = true
);

-- Step 3: Also check auth.users metadata
SELECT '=== AUTH USERS METADATA ===' as info;
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as metadata_role,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Drop ALL existing policies on profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', r.policyname);
    END LOOP;
END $$;

-- Step 5: Create comprehensive, non-recursive policies
-- Policy 1: Everyone can read their own profile
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Everyone can update their own profile
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow inserts (for trigger during signup)
CREATE POLICY "allow_insert_profile" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Policy 4: Service role bypass (for admin operations)
-- This is handled by using the admin client in the code

-- Step 6: Update trigger to ensure role is properly set
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
BEGIN
  -- Extract metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  -- Validate role
  IF user_role NOT IN ('student', 'instructor', 'admin') THEN
    user_role := 'student';
  END IF;

  -- Log what we're doing
  RAISE NOTICE 'Creating profile for user %: email=%, role=%, name=%',
    NEW.id, NEW.email, user_role, user_full_name;

  -- Insert or update profile
  INSERT INTO public.profiles (id, email, full_name, role, subscription_plan)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_role,
    'basic'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

  RAISE NOTICE 'Profile created/updated successfully for user %', NEW.id;
  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Don't fail the user creation
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Verify profiles after fix
SELECT '=== PROFILES AFTER FIX ===' as info;
SELECT
  id,
  email,
  full_name,
  role,
  subscription_plan,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- Step 8: Verify RLS policies
SELECT '=== RLS POLICIES ===' as info;
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Step 9: Test if profiles can be read
-- This simulates what happens when you log in
DO $$
DECLARE
  test_profile RECORD;
BEGIN
  -- Try to read each profile (simulating auth.uid() = id check)
  FOR test_profile IN SELECT id, email, role FROM profiles LOOP
    RAISE NOTICE 'Profile found: % (%) - role: %',
      test_profile.email, test_profile.id, test_profile.role;
  END LOOP;
END $$;

-- ============================================
-- VERIFICATION SUMMARY
-- ============================================
SELECT
  'Total profiles' as metric,
  COUNT(*)::text as value
FROM profiles
UNION ALL
SELECT
  'Admin profiles' as metric,
  COUNT(*)::text as value
FROM profiles WHERE role = 'admin'
UNION ALL
SELECT
  'Student profiles' as metric,
  COUNT(*)::text as value
FROM profiles WHERE role = 'student'
UNION ALL
SELECT
  'RLS policies on profiles' as metric,
  COUNT(*)::text as value
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- ============================================
-- MANUAL FIX (if needed)
-- ============================================
-- If your admin email is still showing as student, run this:
-- Replace 'your-admin-email@example.com' with your actual admin email

-- UPDATE profiles
-- SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';

-- Then check:
-- SELECT id, email, role FROM profiles WHERE email = 'your-admin-email@example.com';
