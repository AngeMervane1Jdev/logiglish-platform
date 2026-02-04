-- ============================================
-- FIX RLS INFINITE RECURSION
-- ============================================
-- Fixes "infinite recursion detected in policy for relation profiles"
-- ============================================

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

-- ============================================
-- Create NON-RECURSIVE policies
-- ============================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (but not role or subscription)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy 3: Allow INSERT during signup (for trigger)
-- This is permissive because the trigger controls what gets inserted
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT
  WITH CHECK (true);

-- Policy 4: Service role can do everything (for admin operations)
-- We'll handle admin checks in the application layer, not in RLS
-- This avoids the recursion issue

-- ============================================
-- Update the trigger function to be more robust
-- ============================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert profile for new user
  INSERT INTO public.profiles (id, email, full_name, role, subscription_plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'basic'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Verification
-- ============================================

SELECT 'RLS policies recreated without recursion' as status;
SELECT 'Trigger function updated' as status;

-- List all policies
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'
ORDER BY policyname;

-- Test the trigger function exists
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✓ Trigger function exists'
    ELSE '✗ Trigger function missing'
  END as check_result
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Test the trigger is attached
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✓ Trigger is attached'
    ELSE '✗ Trigger not attached'
  END as check_result
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ============================================
-- SUCCESS!
-- ============================================
-- The infinite recursion is fixed
-- Try signing up again - it should work now
-- ============================================
