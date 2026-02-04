-- ============================================
-- FINAL FIX - Create profiles for all users
-- ============================================

-- 1. Drop the enum type constraint temporarily
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;
ALTER TABLE profiles ALTER COLUMN subscription_plan TYPE TEXT;

-- 2. Create profiles for ALL existing auth users
INSERT INTO public.profiles (id, email, full_name, role, subscription_plan)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'role', 'student'),
  'basic'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 3. Fix admin roles
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
  SELECT email FROM admin_registration_requests WHERE is_verified = true
);

-- 4. Fix trigger
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
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
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify
SELECT id, email, role FROM profiles;
