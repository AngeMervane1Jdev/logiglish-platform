import sgMail from "@sendgrid/mail";

let initialized = false;

/**
 * Check if SendGrid is configured
 */
export function isSendGridConfigured(): boolean {
  return !!process.env.SENDGRID_API_KEY;
}

export function initSendGrid(): void {
  if (!initialized) {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    sgMail.setApiKey(apiKey);
    initialized = true;
  }
}

export function getSendGridClient(): typeof sgMail {
  initSendGrid();
  return sgMail;
}
