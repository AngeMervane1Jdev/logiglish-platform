-- ============================================
-- LOGIGLISH COMPLETE DATABASE SETUP
-- ============================================
-- This script creates or updates the entire database structure
-- Safe to run multiple times
-- ============================================

-- ============================================
-- STEP 1: Create all tables
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  subscription_plan TEXT NOT NULL DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  lesson_type TEXT NOT NULL CHECK (lesson_type IN ('response_practice', 'micro_response_practice')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  calendar_event_id TEXT,
  video_link TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic Materials table
CREATE TABLE IF NOT EXISTS topic_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  material_type TEXT NOT NULL CHECK (material_type IN ('pre_study_pdf', 'assignment', 'feedback', 'audio')),
  title TEXT NOT NULL,
  file_url TEXT,
  message_content TEXT,
  sequence_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Submissions table
CREATE TABLE IF NOT EXISTS student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES topic_materials(id) ON DELETE CASCADE,
  file_url TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  feedback_url TEXT,
  feedback_at TIMESTAMPTZ
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Registration Requests table
CREATE TABLE IF NOT EXISTS admin_registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  authorization_code TEXT NOT NULL,
  code_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT FALSE
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_id ON bookings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_topic_id ON bookings(topic_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);

-- Topics indexes
CREATE INDEX IF NOT EXISTS idx_topics_sequence_order ON topics(sequence_order);
CREATE INDEX IF NOT EXISTS idx_topics_is_active ON topics(is_active);

-- Topic Materials indexes
CREATE INDEX IF NOT EXISTS idx_topic_materials_topic_id ON topic_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_materials_sequence_order ON topic_materials(sequence_order);

-- Student Submissions indexes
CREATE INDEX IF NOT EXISTS idx_student_submissions_student_id ON student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_topic_id ON student_submissions(topic_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_material_id ON student_submissions(material_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_topic_id ON messages(topic_id);
CREATE INDEX IF NOT EXISTS idx_messages_student_id ON messages(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_author_id ON messages(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Admin Registration indexes
CREATE INDEX IF NOT EXISTS idx_admin_reg_email ON admin_registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_admin_reg_code ON admin_registration_requests(authorization_code);
CREATE INDEX IF NOT EXISTS idx_admin_reg_expires ON admin_registration_requests(code_expires_at);

-- ============================================
-- STEP 3: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_registration_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Drop ALL existing policies (clean slate)
-- ============================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on our tables
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN (
            'profiles', 'topics', 'bookings',
            'topic_materials', 'student_submissions',
            'messages', 'admin_registration_requests'
        )
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- STEP 5: Create RLS Policies
-- ============================================

-- ==================
-- Profiles Policies
-- ==================

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==================
-- Bookings Policies
-- ==================

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Instructors can view assigned bookings" ON bookings
  FOR SELECT USING (
    instructor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

-- ==================
-- Topics Policies
-- ==================

CREATE POLICY "Anyone can view active topics" ON topics
  FOR SELECT USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage topics" ON topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================
-- Topic Materials Policies
-- ==================

CREATE POLICY "Users can view materials for active topics" ON topic_materials
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM topics
      WHERE topics.id = topic_materials.topic_id AND topics.is_active = true
    )
  );

CREATE POLICY "Admins can manage materials" ON topic_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================
-- Student Submissions Policies
-- ==================

CREATE POLICY "Students can view own submissions" ON student_submissions
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Students can create submissions" ON student_submissions
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can view all submissions" ON student_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==================
-- Messages Policies
-- ==================

CREATE POLICY "Users can view messages" ON messages
  FOR SELECT USING (
    student_id = auth.uid() OR
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admins can view all messages" ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin registration requests has no public policies (service role only)

-- ============================================
-- STEP 6: Create Functions
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: Create Triggers
-- ============================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
DROP TRIGGER IF EXISTS on_booking_updated ON bookings;
DROP TRIGGER IF EXISTS on_topic_updated ON topics;
DROP TRIGGER IF EXISTS on_topic_material_updated ON topic_materials;

-- Create new user trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at triggers
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_booking_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_topic_updated
  BEFORE UPDATE ON topics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_topic_material_updated
  BEFORE UPDATE ON topic_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STEP 8: Verify setup
-- ============================================

-- Show all tables
SELECT
  'TABLES CREATED' as status,
  COUNT(*) as count
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

-- Show all indexes
SELECT
  'INDEXES CREATED' as status,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- Show all RLS policies
SELECT
  'RLS POLICIES CREATED' as status,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- SUCCESS!
-- ============================================
-- Database structure is now complete and ready to use
--
-- Next steps:
-- 1. Create an admin account at /admin/register
-- 2. Create test users at /signup
-- 3. Start using the application
--
-- For development, you can use demo accounts:
-- - Student: demo@logiglish.com / demo123456
-- - Admin: admin-demo@logiglish.com / admin123456
-- ============================================
