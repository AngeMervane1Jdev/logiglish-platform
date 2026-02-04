-- ============================================
-- Add cancellation_reason to bookings table
-- ============================================

-- Add cancellation_reason column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add comment
COMMENT ON COLUMN bookings.cancellation_reason IS 'Reason provided when booking is cancelled (by user or admin)';
