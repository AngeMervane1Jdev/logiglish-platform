import { getSendGridClient, isSendGridConfigured } from "./client";
import { generateBookingConfirmationHTML } from "./templates/booking-confirmation";
import { generateBookingCancelledHTML } from "./templates/booking-cancelled";
import { generateBookingReminderHTML } from "./templates/booking-reminder";
import { generateAdminAuthorizationHTML } from "./templates/admin-authorization";
import { EMAIL_FROM, EMAIL_SUBJECTS } from "@/lib/utils/constants";
import { generateICS } from "@/lib/ics/generator";
import type { Booking, Profile } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const IS_DEV = process.env.NODE_ENV === "development";

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send booking confirmation email with ICS calendar attachment
 */
export async function sendBookingConfirmationEmail(
  booking: Booking,
  student: Profile
): Promise<SendEmailResult> {
  // Skip if SendGrid is not configured (development mode)
  if (!isSendGridConfigured()) {
    console.warn("SendGrid not configured - skipping confirmation email");
    return { success: true }; // Return success to allow booking to proceed
  }

  try {
    const sgMail = getSendGridClient();

    // Generate ICS calendar file
    const icsContent = generateICS(booking, student);

    const html = generateBookingConfirmationHTML({
      booking,
      student,
      appUrl: APP_URL,
    });

    const [response] = await sgMail.send({
      from: EMAIL_FROM,
      to: student.email,
      subject: EMAIL_SUBJECTS.BOOKING_CONFIRMATION,
      html,
      attachments: [
        {
          filename: "lesson.ics",
          content: Buffer.from(icsContent).toString("base64"),
          type: "text/calendar",
          disposition: "attachment",
        },
      ],
    });

    return { success: true, messageId: response.headers["x-message-id"] };
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send booking cancellation email
 */
export async function sendBookingCancellationEmail(
  booking: Booking,
  student: Profile,
  reason?: string
): Promise<SendEmailResult> {
  try {
    const sgMail = getSendGridClient();

    const html = generateBookingCancelledHTML({
      booking,
      student,
      appUrl: APP_URL,
      reason,
    });

    const [response] = await sgMail.send({
      from: EMAIL_FROM,
      to: student.email,
      subject: EMAIL_SUBJECTS.BOOKING_CANCELLED,
      html,
    });

    return { success: true, messageId: response.headers["x-message-id"] };
  } catch (error) {
    console.error("Error sending cancellation email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send booking reminder email (24 hours before)
 */
export async function sendBookingReminderEmail(
  booking: Booking,
  student: Profile
): Promise<SendEmailResult> {
  try {
    const sgMail = getSendGridClient();

    const html = generateBookingReminderHTML({
      booking,
      student,
      appUrl: APP_URL,
    });

    const [response] = await sgMail.send({
      from: EMAIL_FROM,
      to: student.email,
      subject: EMAIL_SUBJECTS.BOOKING_REMINDER,
      html,
    });

    return { success: true, messageId: response.headers["x-message-id"] };
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin notification for new booking
 */
export async function sendAdminBookingNotification(
  booking: Booking,
  student: Profile
): Promise<SendEmailResult> {
  // Skip if SendGrid is not configured (development mode)
  if (!isSendGridConfigured()) {
    console.warn("SendGrid not configured - skipping admin notification");
    return { success: true }; // Return success to allow booking to proceed
  }

  try {
    const sgMail = getSendGridClient();
    const adminEmail = process.env.ADMIN_EMAIL || "admin@logiglish.com";

    const scheduledDate = new Date(booking.scheduled_at);

    const [response] = await sgMail.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `New Booking: ${student.full_name || student.email}`,
      html: `
        <h2>New Booking Received</h2>
        <p><strong>Student:</strong> ${student.full_name || "Unknown"} (${student.email})</p>
        <p><strong>Lesson Type:</strong> ${booking.lesson_type}</p>
        <p><strong>Date:</strong> ${scheduledDate.toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${scheduledDate.toLocaleTimeString()}</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        ${booking.video_link ? `<p><strong>Video Link:</strong> ${booking.video_link}</p>` : ""}
      `,
    });

    return { success: true, messageId: response.headers["x-message-id"] };
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send admin authorization code email
 * In development, logs to console instead of sending email
 */
export async function sendAdminAuthorizationEmail(
  email: string,
  fullName: string,
  authorizationCode: string,
  expiresAt: Date
): Promise<SendEmailResult> {
  try {
    // In development, log to console instead of sending email
    if (IS_DEV) {
      console.log("\n" + "=".repeat(60));
      console.log("📧 ADMIN AUTHORIZATION CODE (Development Mode)");
      console.log("=".repeat(60));
      console.log(`Name: ${fullName}`);
      console.log(`Email: ${email}`);
      console.log(`Code: ${authorizationCode}`);
      console.log(`Expires: ${expiresAt.toLocaleString()}`);
      console.log("=".repeat(60) + "\n");

      return { success: true, messageId: "dev-console-log" };
    }

    // In production, send actual email
    const sgMail = getSendGridClient();

    const html = generateAdminAuthorizationHTML({
      fullName,
      email,
      authorizationCode,
      expiresAt,
      appUrl: APP_URL,
    });

    const [response] = await sgMail.send({
      from: EMAIL_FROM,
      to: email,
      subject: "Admin Account Authorization Code",
      html,
    });

    return { success: true, messageId: response.headers["x-message-id"] };
  } catch (error) {
    console.error("Error sending admin authorization email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
