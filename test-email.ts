import sgMail from "@sendgrid/mail";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

console.log("--- SendGrid Email Test ---\n");
console.log("SENDGRID_API_KEY:", SENDGRID_API_KEY ? `${SENDGRID_API_KEY.slice(0, 10)}...` : "NOT SET");
console.log("EMAIL_FROM:", EMAIL_FROM || "NOT SET");
console.log("ADMIN_EMAIL:", ADMIN_EMAIL || "NOT SET");
console.log("");

if (!SENDGRID_API_KEY || !EMAIL_FROM || !ADMIN_EMAIL) {
  console.error("Missing required environment variables. Check your .env.local file.");
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function sendTestEmail() {
  try {
    const [response] = await sgMail.send({
      from: EMAIL_FROM!,
      to: "angenoutchogbe@gmail.com",
      subject: "Logiglish - Test Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2>SendGrid Test</h2>
          <p>If you are reading this, your SendGrid configuration is working correctly.</p>
          <p style="color: #666; font-size: 14px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    console.log("Email sent successfully!");
    console.log("Status code:", response.statusCode);
    console.log("Message ID:", response.headers["x-message-id"]);
  } catch (error: any) {
    console.error("Failed to send email.\n");

    if (error.response) {
      console.error("Status:", error.response.statusCode);
      console.error("Body:", JSON.stringify(error.response.body, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

sendTestEmail();
