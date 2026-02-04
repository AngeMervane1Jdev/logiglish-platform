interface AdminAuthorizationEmailData {
  fullName: string;
  email: string;
  authorizationCode: string;
  expiresAt: Date;
  appUrl: string;
}

export function generateAdminAuthorizationHTML(
  data: AdminAuthorizationEmailData
): string {
  const { fullName, authorizationCode, expiresAt, appUrl } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Account Authorization Code</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    .code-box {
      background-color: #f8fafc;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #2563eb;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info {
      color: #64748b;
      font-size: 14px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 12px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Admin Account Authorization</h1>
    </div>

    <p>Hello ${fullName},</p>

    <p>You have requested to create an admin account on the Logiglish platform. To complete your registration, please use the authorization code below:</p>

    <div class="code-box">
      <div class="code">${authorizationCode}</div>
      <div class="info">Authorization Code</div>
    </div>

    <div class="warning">
      <strong>⚠️ Important:</strong> This code will expire on ${expiresAt.toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short',
      })}
    </div>

    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Return to the admin registration page</li>
      <li>Enter this authorization code</li>
      <li>Complete your registration</li>
    </ol>

    <div style="text-align: center;">
      <a href="${appUrl}/admin/register" class="btn">Complete Registration</a>
    </div>

    <p style="margin-top: 30px;">If you did not request this admin account, please ignore this email. The code will expire automatically.</p>

    <div class="footer">
      <p><strong>Logiglish Platform</strong></p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
