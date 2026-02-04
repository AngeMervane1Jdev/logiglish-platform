-- Create table for pending admin registrations
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

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_reg_email ON admin_registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_admin_reg_code ON admin_registration_requests(authorization_code);
CREATE INDEX IF NOT EXISTS idx_admin_reg_expires ON admin_registration_requests(code_expires_at);

-- Enable Row Level Security
ALTER TABLE admin_registration_requests ENABLE ROW LEVEL SECURITY;

-- No RLS policies needed as this is server-side only with service role

-- Clean up expired requests (optional - can be run periodically)
-- DELETE FROM admin_registration_requests
-- WHERE code_expires_at < NOW() AND is_verified = FALSE;
