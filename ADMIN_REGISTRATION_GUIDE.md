# Admin Account Registration Guide

This guide explains how to create admin accounts using the authorization code system.

## Overview

The admin registration system uses a two-step verification process:
1. **Request**: Admin provides email, name, and password. An authorization code is generated.
2. **Verify**: Admin enters the code and re-enters password to complete registration.

## Setup Instructions

### 1. Run Database Migration

First, run the SQL migration to create the required table:

```bash
# Navigate to Supabase dashboard > SQL Editor
# Run the migration file: supabase/migrations/admin_registration.sql
```

Or run it directly in your Supabase SQL Editor:

```sql
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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_admin_reg_email ON admin_registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_admin_reg_code ON admin_registration_requests(authorization_code);
CREATE INDEX IF NOT EXISTS idx_admin_reg_expires ON admin_registration_requests(code_expires_at);

-- Enable RLS
ALTER TABLE admin_registration_requests ENABLE ROW LEVEL SECURITY;
```

### 2. Configure Environment

Ensure your `.env.local` has the following:

```env
# Required for email functionality (production)
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=your_sender_email@domain.com

# Required for admin functionality
ADMIN_EMAIL=admin@logiglish.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For development, set this to "development" to log codes to console
NODE_ENV=development
```

## How to Create an Admin Account

### Development Mode (Code in Console)

1. Navigate to: `http://localhost:3000/admin/register`

2. **Step 1 - Request Authorization Code:**
   - Enter Full Name
   - Enter Email
   - Enter Password (min 8 characters)
   - Click "Request Authorization Code"

3. **Check Server Console:**
   - The 6-digit authorization code will be displayed in the console like this:
   ```
   ============================================================
   📧 ADMIN AUTHORIZATION CODE (Development Mode)
   ============================================================
   Name: John Doe
   Email: admin@example.com
   Code: 123456
   Expires: 1/28/2026, 3:45:00 PM
   ============================================================
   ```

4. **Step 2 - Verify and Create Account:**
   - Enter the 6-digit code from console
   - Re-enter your password
   - Click "Verify & Create Account"

5. You'll be automatically logged in and redirected to `/admin`

### Production Mode (Email)

In production (`NODE_ENV=production`):
- The authorization code will be sent via SendGrid to the email provided
- The email includes:
  - The 6-digit code prominently displayed
  - Expiration time (24 hours)
  - Link to complete registration
- Rest of the process is the same

## Features

### Security Features

1. **Two-Factor Verification**: Requires both email verification and password
2. **Code Expiration**: Authorization codes expire after 24 hours
3. **No Password Storage**: Password is never stored temporarily; only provided at verification
4. **One-Time Use**: Codes can only be used once
5. **Email Validation**: Prevents duplicate admin accounts

### User Experience

1. **Development-Friendly**: Codes logged to console during development
2. **Code Resend**: Users can request a new code if needed
3. **Change Email**: Users can go back and change their email
4. **Auto-Login**: After successful verification, users are automatically logged in

## File Structure

```
src/
├── actions/auth/
│   └── admin-signup.ts          # Server actions for admin registration
├── app/(public)/admin/register/
│   └── page.tsx                 # Registration UI
├── lib/email/
│   ├── templates/
│   │   └── admin-authorization.ts  # Email template
│   └── send.ts                     # Email sending logic
└── supabase/migrations/
    └── admin_registration.sql   # Database schema
```

## API Reference

### `requestAdminSignup(data)`

Initiates admin registration by generating and sending an authorization code.

**Parameters:**
```typescript
{
  email: string;      // Valid email address
  fullName: string;   // Minimum 2 characters
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    message: string;  // Success message
  };
  error?: string;     // Error message if failed
}
```

### `verifyAdminSignup(data)`

Verifies the authorization code and creates the admin account.

**Parameters:**
```typescript
{
  email: string;              // Same email from step 1
  password: string;           // Minimum 8 characters
  authorizationCode: string;  // 6-digit code
}
```

**Returns:**
```typescript
{
  success: boolean;
  data?: {
    message: string;    // Success message
    redirectTo: string; // URL to redirect to
  };
  error?: string;       // Error message if failed
}
```

## Troubleshooting

### Code Not Appearing in Console

- Make sure `NODE_ENV=development` in your `.env.local`
- Check the server console (not browser console)
- Restart the dev server after env changes

### Email Not Sending (Production)

- Verify `SENDGRID_API_KEY` is correct
- Check SendGrid dashboard for send logs
- Verify `EMAIL_FROM` is verified in SendGrid

### "Booking not found" Error on Redirect

- This is a separate issue related to booking creation timing
- It has been fixed with improved retry logic

### Code Expired

- Codes expire after 24 hours
- Click "Resend code" to get a new one

### Account Already Exists

- The email is already registered
- Use the regular login page instead
- Or contact an existing admin to check your account

## Maintenance

### Cleanup Old Requests

Run this periodically to clean up expired, unverified registrations:

```sql
DELETE FROM admin_registration_requests
WHERE code_expires_at < NOW() AND is_verified = FALSE;
```

You can set this up as a cron job or scheduled function in Supabase.

## Security Considerations

1. **Rate Limiting**: Consider adding rate limiting to prevent code generation spam
2. **IP Tracking**: Optionally track IPs for security monitoring
3. **Admin Approval**: For higher security, require existing admin approval
4. **Audit Logging**: Log all admin registration attempts

## Future Enhancements

Potential improvements:
- Email verification before code generation
- SMS verification as alternative
- Admin approval workflow
- Role-based admin types (super admin, admin, moderator)
- Registration invitation system
