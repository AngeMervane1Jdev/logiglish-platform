-- Add reminder_sent column to bookings table
-- Used to track whether a 24-hour reminder email has been sent for a booking

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- Index to speed up the cron job query (finds un-reminded confirmed bookings)
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_pending
ON bookings (scheduled_at)
WHERE status = 'confirmed' AND reminder_sent = FALSE;
