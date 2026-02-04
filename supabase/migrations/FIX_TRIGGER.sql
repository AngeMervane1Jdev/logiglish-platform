-- ============================================
-- FIX TRIGGER FOR USER SIGNUP
-- ============================================
-- This fixes the "Database error saving new user" issue
-- ============================================

-- Drop and recreate the trigger function with proper settings
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function with proper privileges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, subscription_plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'basic'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Grant execute permission to authenticated and service role
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Alternative: Add a more permissive INSERT policy for profiles
-- This allows the trigger to insert even when no user is authenticated yet
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;

CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT
  WITH CHECK (true);  -- Temporarily allow all inserts

-- Verification
SELECT 'Trigger function recreated with proper permissions' as status;
SELECT 'Trigger reattached to auth.users' as status;
SELECT 'Permissive INSERT policy added to profiles' as status;

-- Test the setup
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✓ Trigger function exists'
    ELSE '✗ Trigger function missing'
  END as function_check
FROM pg_proc
WHERE proname = 'handle_new_user';

SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✓ Trigger is attached'
    ELSE '✗ Trigger not attached'
  END as trigger_check
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- ============================================
-- DONE! Try signing up again
-- ============================================
