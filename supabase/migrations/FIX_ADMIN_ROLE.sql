-- ============================================
-- FIX ADMIN ROLE ASSIGNMENT
-- ============================================
-- Ensures admin role is properly set during signup
-- ============================================

-- Check current admin accounts
SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Update any admin accounts that have wrong role
UPDATE profiles
SET role = 'admin'
WHERE email IN (
  SELECT email
  FROM admin_registration_requests
  WHERE is_verified = true
)
AND role != 'admin';

-- Verify the fix
SELECT
  '=== ADMIN ACCOUNTS AFTER FIX ===' as info;

SELECT
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE email IN (
  SELECT email
  FROM admin_registration_requests
)
ORDER BY created_at DESC;

-- ============================================
-- Update trigger to properly handle role
-- ============================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- Ensure valid role
  IF user_role NOT IN ('student', 'instructor', 'admin') THEN
    user_role := 'student';
  END IF;

  -- Insert profile for new user
  INSERT INTO public.profiles (id, email, full_name, role, subscription_plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role,
    'basic'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,  -- Update role on conflict too
    updated_at = NOW();

  RAISE NOTICE 'Profile created for user % with role %', NEW.id, user_role;
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
-- SUCCESS!
-- ============================================
SELECT 'Admin role fix complete' as status;
SELECT 'Existing admin accounts updated' as status;
SELECT 'Trigger updated to properly handle admin role' as status;
