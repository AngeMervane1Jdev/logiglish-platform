-- ============================================
-- DATABASE PURGE SCRIPT
-- ⚠️ WARNING: This will DELETE ALL DATA!
-- ============================================
-- Use this to completely reset your database to a clean state
-- Run this in Supabase Dashboard → SQL Editor

-- ============================================
-- STEP 1: Show current data (for verification)
-- ============================================
SELECT 'AUTH USERS' as table_name, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'PROFILES', COUNT(*) FROM profiles
UNION ALL
SELECT 'BOOKINGS', COUNT(*) FROM bookings
UNION ALL
SELECT 'TOPICS', COUNT(*) FROM topics
UNION ALL
SELECT 'TOPIC_MATERIALS', COUNT(*) FROM topic_materials
UNION ALL
SELECT 'STUDENT_SUBMISSIONS', COUNT(*) FROM student_submissions
UNION ALL
SELECT 'MESSAGES', COUNT(*) FROM messages
UNION ALL
SELECT 'ADMIN_REGISTRATION_REQUESTS', COUNT(*) FROM admin_registration_requests;

-- ============================================
-- STEP 2: Delete all data from custom tables
-- ============================================

-- Delete in order to respect foreign key constraints

-- Delete messages
DELETE FROM messages;

-- Delete student submissions
DELETE FROM student_submissions;

-- Delete topic materials
DELETE FROM topic_materials;

-- Delete bookings
DELETE FROM bookings;

-- Delete topics
DELETE FROM topics;

-- Delete admin registration requests
DELETE FROM admin_registration_requests;

-- Delete profiles (this should cascade from auth.users, but we'll do it explicitly)
DELETE FROM profiles;

-- ============================================
-- STEP 3: Delete all auth users
-- ============================================
-- This is the critical part - deleting auth users

-- Get all user IDs first (for logging)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, email FROM auth.users LOOP
        RAISE NOTICE 'Deleting user: % (%)', user_record.email, user_record.id;
        DELETE FROM auth.users WHERE id = user_record.id;
    END LOOP;
END $$;

-- Alternative simple approach (if above doesn't work):
-- DELETE FROM auth.users;

-- ============================================
-- STEP 4: Verify all data is deleted
-- ============================================
SELECT 'AUTH USERS' as table_name, COUNT(*) as remaining_count FROM auth.users
UNION ALL
SELECT 'PROFILES', COUNT(*) FROM profiles
UNION ALL
SELECT 'BOOKINGS', COUNT(*) FROM bookings
UNION ALL
SELECT 'TOPICS', COUNT(*) FROM topics
UNION ALL
SELECT 'TOPIC_MATERIALS', COUNT(*) FROM topic_materials
UNION ALL
SELECT 'STUDENT_SUBMISSIONS', COUNT(*) FROM student_submissions
UNION ALL
SELECT 'MESSAGES', COUNT(*) FROM messages
UNION ALL
SELECT 'ADMIN_REGISTRATION_REQUESTS', COUNT(*) FROM admin_registration_requests;

-- ============================================
-- STEP 5: Reset sequences (if needed)
-- ============================================
-- Most tables use UUIDs, so no sequences to reset

-- ============================================
-- SUCCESS! Database is now empty
-- ============================================
-- You can now:
-- 1. Create a new admin account at /admin/register
-- 2. Create test users at /signup
-- 3. Start fresh with clean data
