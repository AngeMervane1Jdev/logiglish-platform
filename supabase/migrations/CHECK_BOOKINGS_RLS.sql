-- Check bookings RLS policies
SELECT
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bookings'
ORDER BY policyname;

-- Check if bookings exist
SELECT COUNT(*) as total_bookings FROM bookings;

-- Check bookings with student info
SELECT
  b.id,
  b.student_id,
  b.status,
  b.scheduled_at,
  p.email as student_email
FROM bookings b
LEFT JOIN profiles p ON b.student_id = p.id
ORDER BY b.created_at DESC;
